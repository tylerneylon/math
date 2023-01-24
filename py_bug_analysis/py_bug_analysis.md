% Post Mortem of a Sneaky Bug Whilst Using Python Multiprocessing
% Tyler Neylon
% 25.2023

\newcommand{\R}{\mathbb{R}}
\newcommand{\N}{\mathbb{N}}
\newcommand{\eqnset}[1]{\left.\mbox{$#1$}\;\;\right\rbrace\class{postbrace}{ }}
\providecommand{\latexonlyrule}[3][]{}
\providecommand{\optquad}{\class{optquad}{}}
\providecommand{\smallscrneg}{\class{smallscrneg}{ }}
\providecommand{\bigscr}[1]{\class{bigscr}{#1}}
\providecommand{\smallscr}[1]{\class{smallscr}{#1}}
\providecommand{\smallscrskip}[1]{\class{smallscrskip}{\hskip #1}}

\newcommand{\mydots}{{\cdot}\kern -0.1pt{\cdot}\kern -0.1pt{\cdot}}

\newcommand{\?}{\stackrel{?}{=}}
\newcommand{\sign}{\textsf{sign}}
\newcommand{\order}{\textsf{order}}
\newcommand{\flips}{\textsf{flips}}
\newcommand{\samecycles}{\textsf{same$\\\_$cycles}}
\newcommand{\canon}{\textsf{canon}}
\newcommand{\cs}{\mathsf{cs}}
\newcommand{\dist}{\mathsf{dist}}
\renewcommand{\theenumi}{(\roman{enumi})}

[
Formats:
 [html](http://tylerneylon.com/a/py_bug_analysis/py_bug_analysis.html) |
 [pdf](http://tylerneylon.com/a/py_bug_analysis/py_bug_analysis.pdf)
 $\,$
]

While working on a prototype machine learning system in Python (v3.10.6), I hit
a concurrency deadlock that seemed at first to be impossible. This is the story
of that bug.

# The Architecture

The problem I'm solving involves iterating over more data than can fit into
memory, doing some non-trivial processing of each data item — call this step 1 —
and then integrating those outputs together in a non-trivial way — call this
step 2. Both memory and cpu cycles are potential bottlenecks.

I could shape the system in different ways, but I'm trying out an architecture
where a pool of worker processes does step 1, which is cpu-bound, and then uses
a shared queue to send its data to another process to do step 2, integrating the
output together. This is inspired by the actor model of handling concurrency:
Basically, there is no shared memory outside of message passing, which is done
by process-safe queues.

Here's the process and data flow layout:

![](img/py_bug1.svg)

Here's some pseudocode to capture this architecture, with the
[Queue in blue]{color="blue"}
and
the
[Pool in orange]{color="orange"}:

<div class="box"> \boxedstart

```
{formatted}import multiprocessing as mp

[# Load the data.]{bold}
a_giant_list = read_input()

[# Set up the writer process and queue.]{bold}
[writer_q]{color="blue"} = mp.Queue()
def writer_fn():
    global [writer_q]{color="blue"}
    # Process each message in the queue, stopping when
    # we receive a message == 'STOP'.
    for msg in iter([writer_q]{color="blue"}.get, 'STOP'):
        write_msg_into_data(msg)
writer_process = mp.Process(target=writer_fn)
writer_process.start()

[# Process the data.]{bold}
with mp.Pool(num_cores) as [p]{color="orange"}:
    # The function process_one_input() takes an input
    # datum and puts the processed output to writer_q.
    [p]{color="orange"}.map(process_one_input, a_giant_list)

[# Before we use the result, ensure the queues are done.]{bold}
[writer_q]{color="blue"}.put('STOP')
writer_process.join()
```

\boxedend </div>

That's pretty close to the actual code I was running, leaving out extraneous
code.

Hint 1: If you deeply grok Python's multiprocessing module, then the above is
enough information for you to see the bug.

Hint 2: Otherwise, I suspect you can't figure it out by looking at that code. It
is, in my opinion, not a simple typo or silly mistake. For example, sharing
`writer_q` as a global is legitimate.

# What Wasn't Working

Sometimes the code would work as intended, and other times — often — it froze on
the last line:


<div class="box"> \boxedstart

```
writer_process.join()
```

\boxedend </div>

# Investigating the Problem

I tried many things before fully understanding what was broken. I'll start by
listing the truly helpful steps I took, then explaining the source of the
problem, and finally — since I think this is also helpful to other coders — I'll
list other steps I took that turned out to be unnecessary, but might be helpful
in other situations.

## Helpful Steps

* **Use the source.**
  + You can read the source of a standard library module to help understand
    what's happening under the hood.
  + The `multiprocessing` module is internally made up of many source files —
    some of them in Python, and some in C. Luckily, I was able to learn most of
    what I needed without diving deeply into the C.
  + Here are two techniques you can use to find the location of your system's
    Python standard library:

<div class="box"> \boxedstart

```
# In your shell, print out locations where python finds
# library imports:

$ python3 -c 'import sys; print("\n".join(sys.path))'
```

(prints out a list of directories)

```
# One of those dirs, probably near the top of the list, contains
# your standard library files.
```

___

```
# In Python's REPL, see the location actually used for a
# particular module import:

$ python3 -v
```

(lots of output you can ignore)

```
>>> import multiprocessing

# /usr/lib/python3.10/multiprocessing/__pycache__/
__init__.cpython-310.pyc matches /usr/lib/python3.10/
multiprocessing/__init__.py
…

# The example above tells us my standard library is (mostly) at
# /usr/lib/python3.10/MODULE_NAME.
```

\boxedend </div>

* {+} I added some debug prints in the source to help understand exactly where
  the code was stuck.
  + To be a little bad, you can use *sudo* to edit your standard library files
    directly. Obviously this is a terrible idea (which I did); a more
    responsible thing to do is to work with a different siloed version of the
    standard library.

* **Print built-in logging messages from multiprocessing code.**
  + The multiprocessing module can provide some built-in debug messages that can
    help you see, at a high level (well, relative to low stuff) what's going on.
    You turn it on like this:

<div class="box"> \boxedstart

```
logger = mp.log_to_stderr()
logger.setLevel(logging.DEBUG)
```

\boxedend </div>

* {+} The docs for that are [here](https://docs.python.org/3/library/multiprocessing.html#logging).

* **Print when locks are acquired and released.**
  + Based on the nature of the problem — multiple processes, sometimes freezing,
    sometimes not — this looks like a race condition. A common type of race
    condition is when a lock can be held indefinitely.
  + By looking at the source of `multiprocessing.Queue`, I see that several locks
    are used, so it seems likely one of these is getting stuck.
  + Here’s one way to add debug prints each time a lock is acquired or
    released:

<div class="box"> \boxedstart

```
# In synchronize.py, edit the _make_methods()
# method of class Lock like so:

def _make_methods(self):

	def dbg_acquire(blocking=True, timeout=None):
		res = self._semlock.acquire(blocking, timeout)
		if res:
			print('Lock acquired')
		return res

	self.acquire = dbg_acquire

	def dbg_release():
		self._semlock.release()
		print('Lock released')

	self.release = dbg_release
```

\boxedend </div>

* {+} If you only had a single lock in your program, then you could look through
  the above prints to confirm that `acquire()` was called twice with no
  `release()` in between. That alone is not deadly, but if neither locker ever
  releases, then it becomes a mortal embrace.

  + There are a few things to improve from this setup:
    - I have many locks, so **I have too many debug prints**.
      I'll explain how to focus on a single lock next.
    - So far, these will let me confirm that a particular lock appears to be the
      deadlock source, but **it won't tell me *why* the deadlock happened**.
      I need more information to understand why; I'll add stack traces below to
      help with that.
    - Finally, **there can be missing debug prints**.
      That is, it's possible that a
      lock is released or acquired, but that the debug print never happens, such
      as if the process becomes stuck or killed after the acquire/release but
      before the print. In fact, I think I saw this happen in one of my test runs,
      and it was extremely confusing. I chose to ignore it as an anomaly, and
      later realized this was the likely cause. I don't think there's an easy fix
      for this. Basically, it's good to know that it might happen in rare cases.
      For the sake of debugging, I'd suggest running things multiple times so you
      don't get hung up on missing debug prints.

* **Print acquire/release updates only for a single lock.**
  + At first I started to do this by adding a new constructor argument to `Queue`
    and `Lock` that would turn on debug prints. This would be a nice general
    solution, but I was aiming for quick and effective rather than a gold medal
    for clean code. So I copied-and-pasted all of classes `Lock` and `Queue` into
    `Lock2` and `Queue2`, and added the debug code only to those new classes.
  + I then made only my `writer_q` queue an instance of `Queue2`. Within that, I
    looked at different locks and found the deadlock to occur on a lock it calls
    `self._wlock`. So that particular lock was the *only* instance of `Lock2` in my
    code.
  + The `multiprocessing` module actually uses factory functions to create
    instances of many of its classes, so you need to do more than add
    declarations for class `Lock2` in *synchronize.py*. You also need to add the
    appropriate methods to the `BaseContext` class in *context.py*, like this:

<div class="box"> \boxedstart

```
def Lock2(self):
	'''Returns a non-recursive lock object'''
	from .synchronize import Lock2
	return Lock2(ctx=self.get_context())
```

\boxedend </div>

* **Print process, thread, and stack trace information at will.**
  + From the above, I was able to gather strong evidence that `Queue`'s `_wlock`
    lock was being double-booked. It was easy to see why the 2nd acquisition was
    locking — the code would freeze, I can hit ctrl-C and see a stack trace.
  + (I'll explain the details of the freeze in the next section, "The Source of
    the Problem.")
  + In order to understand why the penultimate acquisition was happening (and
    from there to hopefully understand why it was not released), I printed out
    process and thread status with each lock acquisition.
  + Here is how to do that:

<div class="box"> \boxedstart

Print out the stack trace of any thread, such as the current thread:

    frames = sys._current_frames()
    thread = threading.current_thread()
    stack = ''.join(traceback.format_stack(frames[thread.ident]))
    print(stack)

The above idiom can be extended to print out stack traces for other threads; in
fact, the main use case for `sys._current_frames()` is to enable you to do so even
in a deadlock situation. Here's a quote from the
[sys docs for `_current_frames()`](https://docs.python.org/3/library/sys.html#sys._current_frames):

> "This is most useful for debugging deadlock: this function does not require the
> deadlocked threads’ cooperation, and such threads’ call stacks are frozen for as
> long as they remain deadlocked. The frame returned for a non-deadlocked thread
> may bear no relationship to that thread’s current activity by the time calling
> code examines the frame."

For the record, here's a simpler way to print out the current stack trace:

    traceback.print_stack()

\boxedend </div>

<div class="box"> \boxedstart

Print out a list of all threads in the current process, and their stacks:

    frames = sys._current_frames()
    for thread in threading.enumerate():
        print(thread.name)
        if thread.ident in frames:
            traceback.print_stack(frames[thread.ident])

\boxedend </div>


<div class="box"> \boxedstart

Print out the name / identifier / pid for the current process and thread.

In this example, I'll also show one way to package up multiple strings into a
single print. This is useful to reduce the likelihood of prints overlapping each
other across different processes.

```
{formatted}frames = sys._current_frames()
thread = threading.current_thread()
stack = ''.join(traceback.format_stack(frames[thread.ident]))
# inspect.cleandoc() trims some whitespace for you.
msg = [inspect.cleandoc]{url="https://docs.python.org/3/library/inspect.html#inspect.cleandoc"}(f'''
    Lock acquired
    {[process.current_process()]{bold}} pid={[os.getpid()]{bold}}
    {[threading.current_thread()]{bold}}
    Stack:
    {stack}
''')
print(msg, flush=True)

# Note that I'm calling process.current_process() above since
# I'm within the multiprocessing source; outside of it, you'd
# call multiprocessing.current_process() instead.
```

It's useful to include `flush=True` because when you redirect to a file, flushing
is not automatic. Without the flush, you might end up seeing a side effect that
happened *after* a debug print line, but never seeing that debug print in your
output.

\boxedend </div>

* **Use a timeout-based hook to auto-print more info.**
  + Often, when someone makes an indefinitely-blocking call to
    `Lock.acquire()`,
    you expect the lock to be acquired quickly. If it's not acquired after, say,
    2 full seconds, that might indicate something's gone
    sideways.
  + All of the above can produce many printouts, so it's nice to have an
    automatic hook that executes at the point when things are deadlocked.
  + We can do this by hooking into the `dbg_acquire()` method on `Lock2`, as in
    the next example.


<div class="box"> \boxedstart

This example is from *queues.py*, in the `_feed()` method, which I'll explain
further below.

I replaced the single line:

    wacquire()

with this:
 
    if not wacquire(True, 2):  # Try to lock, timeout after 2sec.
        # Debug prints.
        print('I appear to be stuck.')
        print('Threads:')
        frames = sys._current_frames()
        for thread in threading.enumerate():
            print(thread.name)
            if thread.ident in frames:
                traceback.print_stack(frames[thread.ident])
        wacquire()

\boxedend </div>

* **Check which processes are alive.**
  + At this point in the debugging, I was pretty sure that one of my pool's
    workers was dying quite violently, and taking our precious `_wlock` with it
    to its grave. I wanted to confirm this suspicion by checking that a
    given process had first acquired the lock and then died without releasing
    it.
  + I thought about programmatically getting the appropriate `Process` object in
    Python, but then I realized it would be easier to just print out the pid
    with the lock, and use *pgrep* to see if the pid was alive at a given point.
    Like this:


<div class="box"> \boxedstart

`$ python3 my_program.py`\
… it freezes; I can see any pids that hold the lock
via debug prints from the steps above.

Me, in another shell:\
`$ pgrep python`\
… list of living Python pids. If a dead (missing) pid holds the lock, that
causes a deadlock.

\boxedend </div>


