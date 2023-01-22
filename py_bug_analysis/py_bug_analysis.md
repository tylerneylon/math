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
  + To be a little bad, you can use sudo to edit your standard library files
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






