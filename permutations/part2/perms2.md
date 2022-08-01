% Notes on Permutations: A Chalkboard Algorithm
% Tyler Neylon
% 342.2022

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
 [html](http://tylerneylon.com/a/perms2/perms2.html) |
 [pdf](http://tylerneylon.com/a/perms2/perms2.pdf)
 $\,$
]

*This is a continuation of notes about permutations; this series
began with
[some notes on cycles and
transpositions](http://tylerneylon.com/a/perms1/perms1.html).*

<!-- TODO

* [x] Right now I say some examples are the same that aren't. Fix
      that lack of consistency.
* [x] Delete perms1.md which is in this directory for reference.
* [x] Check and clean up how the references are looking.
* [ ] There are two elements I added by hand to perms1.html which I'd rather add
      to the template file: the google analytics tracking, and the call to
      subscribe at the bottom of the page.

-->

This short article describes a chalkboard method for
multiplying (that is, composing) permutations written in cycle notation.
When I call it a *chalkboard method*, I mean that it's useful for
humans doing simple math by hand --- akin to long-hand addition taught
in school --- and as opposed to an algorithm designed for a computer.

This article can be read as an extension to an earlier note about
permutations, although
this one can be read independently, assuming that you know both what
permutation multiplication (synonymously, composition) is, and what
cycle notation is. (If not, you can learn by reading
[the previous note in this
series](http://tylerneylon.com/a/perms1/perms1.html).)

The chalkboard algorithm I'll describe is something I derived for fun.
I haven't put effort into discovering if someone else has come up with
it before me.

Let's get started. As an example, consider

<div class="bigscr">
$$\sigma = (1\;3\;7\;2\;5\;4) \quad\text{and}\quad
  \tau = (1\;2)(4\;6).$$ {#eq:eq0}
</div>
<div class="smallscr"> \smallstart
\begin{align*}
\sigma &= (1\;3\;7\;2\;5\;4) \quad\text{and} \\[0.2cm]
\tau   &= (1\;2)(4\;6). \quad (1)
\end{align*}
</div> \smallend

We can define the product $\sigma\cdot\tau$ as the permutation $\mu$ where
$$\mu(x) = (\sigma\cdot\tau)(x) = \tau(\sigma(x)).$$ {#eq:eq1}
I've chosen to work with the intuition that
the element on the left $(\sigma)$ "happens first;"
this notation seems more natural to me.
Some authors choose the opposite ordering because it avoids the
awkward reversal of symbols in ([-@eq:eq1]).

In our example,
$$ \mu = (1\;3\;7)(2\;5\;6\;4), $$
as can be verified by asking, for each $x\in\{1,2,\ldots,7\}$,
what is $y=\sigma(x)$? followed by asking what is $\tau(y)$?

Let's informally call this a 2-lookup method, in the sense that a
human will perform a scan of $\sigma$ to find $\sigma(x)$ and then
another scan of $\tau$ to find $\tau(y)$ for each input $x$ to $\mu$.
This article improves on this by providing an algorithm that
is a 1-lookup method. In some informal sense we can say it's twice
as fast for a human to execute.

A computer can multiply permutations even more efficiently. We could
encode a permutation as a hash map (a `dict` in Python, or an
`object` in JavaScript, for example) where the keys are the input numbers
and the values are what those values map to. In this case, each lookup of a
value $\mu(x)$ takes constant time, so that computing all of $\mu$ requires
$O(n)$ time, where $n$ is the size of the domain of the permutations.
I don't consider a human working on a chalkboard to have access to
constant-time lookups, so this algorithm is only for computers.

# A Worked Example

I'll illustrate the method by working through example
([-@eq:eq0]), and then I'll summarize the general process.

Say that a permutation is *single-cycle* when its cycle notation
has one cycle: $\sigma_1=(1\;4\;2)$ is single-cycle, whereas
$\sigma_2=(1\;2)(3\;5)$ is not.

* Step 1. [Write the problem.] Write $\sigma\cdot\tau$ in cycle notation;
     include single-element cycles in $\tau$, but not of $\sigma$. Write a dot
     over $\tau(a)$, where $a$ is the left-most element in
     $\sigma$'s cycle:

     <div class="bigscr">
     $$\begin{array}{rcll}
           \sigma\cdot\tau & = & \underline{(1\;3\;7\;2\;5\;4)} & 
           \underline{(1\;\dot 2)(3)(4\;6)(5)(7)}. \\
           && \sigma & \tau \\
     \end{array}$$
     </div>
     <div class="smallscr"> \smallstart
     $$\begin{array}{rcll}
           \sigma\cdot\tau & = & \underline{(1\;3\;7\;2\;5\;4)} \; \cdot \\
           && (\textit{This is }\sigma.) \\[0.2cm]
           && \underline{(1\;\dot 2)(3)(4\;6)(5)(7)}. \\
           && (\textit{This is }\tau.)
     \end{array}$$
     </div> \smallend

     $$a=1 \qquad \tau(a)=2.$$
* Step 2. [Process the problem.]
     Repeat this until $\sigma$ is exhausted: Draw a line over element
     $\overline x$ in $\sigma$, where $x$ is the right-most, not-yet-overlined
     element of $\sigma$ (above, we have $x=4$).

     Call the dotted element in $\tau$ as $\dot y$ (above, we have $y=2$).
     In $\tau$, insert a new
     $\hat y$ after $x$ and add a dot over $z=\tau(x)$, like so:
     $$x\, \lower 1ex\hbox{$\hat y$}\,\dot z.$$
     Cross out the previous dot:
     $\crossedouty$.

     Here is how step 2 applies to our example:
     $$\sigma\cdot\tau =
         (1\;3\;7\;2\;5\;\bar 4)\;
         (1\;\crossedouttwo)(3)(4\lower 2ex\hbox{$\hat 2$}\dot 6)(5)(7)
     $$
     $$\sigma\cdot\tau =
         (1\;3\;7\;2\;\bar 5\;\bar 4)\;
         (1\;\crossedouttwo)(3)
         (4\lower 2ex\hbox{$\hat 2$}\crossedoutsix)
         (\dot 5\lower 2ex\hbox{$\hat 6$})(7)
     $$
     $$\sigma\cdot\tau =
         (1\;3\;7\;\bar 2\;\bar 5\;\bar 4)\;
         (\dot 1\;\crossedouttwo\lower 2ex\hbox{$\hat 5$})(3)
         (4\lower 2ex\hbox{$\hat 2$}\crossedoutsix)
         (\crossedoutfive\lower 2ex\hbox{$\hat 6$})(7)
     $$
     $$\sigma\cdot\tau =
         (1\;3\;\bar 7\;\bar 2\;\bar 5\;\bar 4)\;
         (\crossedoutone\;\crossedouttwo\lower 2ex\hbox{$\hat 5$})(3)
         (4\lower 2ex\hbox{$\hat 2$}\crossedoutsix)
         (\crossedoutfive\lower 2ex\hbox{$\hat 6$})
         (\dot 7\lower 2ex\hbox{$\hat 1$})
     $$
     $$\sigma\cdot\tau =
         (1\;\bar 3\;\bar 7\;\bar 2\;\bar 5\;\bar 4)\;
         (\crossedoutone\;\crossedouttwo\lower 2ex\hbox{$\hat 5$})
         (\dot 3\lower 2ex\hbox{$\hat 7$})
         (4\lower 2ex\hbox{$\hat 2$}\crossedoutsix)
         (\crossedoutfive\lower 2ex\hbox{$\hat 6$})
         (\crossedoutseven\lower 2ex\hbox{$\hat 1$})
     $$
     $$\sigma\cdot\tau =
         (\bar 1\;\bar 3\;\bar 7\;\bar 2\;\bar 5\;\bar 4)\;
         (\crossedoutone\lower 2ex\hbox{$\hat 3$}
         \crossedouttwo\lower 2ex\hbox{$\hat 5$})
         (\crossedoutthree\lower 2ex\hbox{$\hat 7$})
         (4\lower 2ex\hbox{$\hat 2$}\crossedoutsix)
         (\crossedoutfive\lower 2ex\hbox{$\hat 6$})
         (\crossedoutseven\lower 2ex\hbox{$\hat 1$})
     $$
     At the end of that last equation, we've drawn a line over all
     the elements of $\sigma$, indicating that we're done with step 2.
* Step 3. [Write the answer.]
     Repeat this until all the elements are used (meaning they
     are included in the answer).

     + [Step 3a.] Write "$(a$" where $a$ is the least unused element
       appearing in $\sigma$ or $\tau$. If all the elements are used, you're
       done.
     + [Step 3b.] Let $b$ be the right-most element in the answer so far.
       Let $c$ the element after $b$ in our final notation for $\tau$:
       If the notation is $$b\, \lower 1ex\hbox{$\hat c$}\, d,$$
       then $c$ is the inserted element; otherwise $c=\tau(b)$.
       If $c=a$, then write ")" and go to step 3a; otherwise write "$c$"
       and repeat this step (step 3b).

    To finish our example:

    $$ \sigma\cdot\tau = (1\;3\;7)(2\;5\;6\;4). $$

The first time you read about this method, it may seem like a lot,
but after working a few examples, it feels natural and easy.

# Why It Works

In this section, I'll define $\mu$ as the permutation
produced by this method, and it will be my job to show
that $\mu=\sigma\cdot\tau$.

At the start of each iteration of step 2, we're going to insert
element $y$ after $x$ in our notation of $\tau$, where
\begin{align*}
    x &= \text{the right-most un-overlined element of }\sigma, \text{ and} \\
    y &= \text{the dotted element in }\tau.
\end{align*}
Effectively, we're recording that $\mu(x)=y$.

In each case, $y$ is chosen as, informally, the element in $\tau$
after [the element in $\sigma$ after $x$].
In other words,
$$y = \tau(\sigma(x)).$$ {#eq:eq2}
whenever we write $x\lowerhaty$.

At the end of an iteration of step 2, the newly-dotted
element $\dot z$ will satisfy $z=\tau(x)$. This sets us up for the next
iteration of step 3, in which we'll begin looking at a new
$x'$ with $\sigma(x')=x$, preparing us to continue
fulfilling ([-@eq:eq2]) for the next value $y' = \dot z$.

When we write out the answer in step 3, either element $x$
in $\tau$ has an inserted element after it or not.
If element $y$ is inserted, then we have
$$\mu(x) = y = \tau(\sigma(x))$$ {#eq:eq3}
by ([-@eq:eq2]). If $x$ has no inserted element after it,
then $x$ never appeared in $\sigma$'s cycle notation,
meaning $\sigma(x)=x$. Then
$$ \mu(x) = \tau(x) = \tau(\sigma(x)). $$ {#eq:eq4}
Since either ([-@eq:eq3]) or ([-@eq:eq4]) holds for all inputs
$x$ to $\mu$, we must have $\mu = \sigma\cdot \tau$,
concluding the proof of correctness.

# The General Process

The steps written in $\S1$ will work for any single-cycle
permutation $\sigma$. It's not difficult to extend this
method to work for any $\sigma$.

Below is the general method, simplified with some shorthand
notation that I believe will be clear in the context
from $\S1$. This is the same as above, with some changes in step 2
to accommodate multi-cycle $\sigma$s.

* Step 1. [Write the problem.] Write $\sigma\cdot\tau$ in cycle notation;
     include single-element cycles $(x)$ in $\tau$ whenever $\sigma(x)\ne x$;
     exclude single-element cycles in $\sigma$.
* Step 2. [Process the problem.] Repeat until $\sigma$ is overlined:
    + [2a.] Set $x :=$ the right-most non-overlined element in $\sigma$,
          *or* ")".
    + [2b.] If $x=$")" then let $a :=$ the left-most element in this cycle of
          $\sigma$. Write a dot over $\tau(a)$; go to step 2a.
    + [2c.] In $\tau$, write $x\lhy\dot z$, where $y$ is the dotted
          element of $\tau$. Cross out $y$'s dot in $\tau$.
* Step 3. [Write the answer.]
     Repeat this until all the elements are used (meaning they
     are included in the answer).

     + [3a.] Write "$(a$" where $a$ is the least unused element
       appearing in $\sigma$ or $\tau$. If all the elements are used, you're
       done.
     + [3b.] Let $b$ be the right-most element in the answer so far.
       Let $c$ the element after $b$ in our final notation for $\tau$:
       If the notation is $$b\, \lower 1ex\hbox{$\hat c$}\, d,$$
       then $c$ is the inserted element; otherwise $c=\tau(b)$.
       If $c=a$, then write ")" and go to step 3a; otherwise write "$c$"
       and repeat this step (step 3b).

It's straightforward to apply essentially the same proof of correctness
to this general version of the method.
