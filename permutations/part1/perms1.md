% Notes on Permutations: Cycles and Transpositions
% Tyler Neylon
% Started typing up 166.2022

\newcommand{\R}{\mathbb{R}}
\newcommand{\eqnset}[1]{\left.\mbox{$#1$}\;\;\right\rbrace\class{postbrace}{ }}
\providecommand{\latexonlyrule}[3][]{}
\providecommand{\optquad}{\class{optquad}{}}
\providecommand{\smallscrneg}{\class{smallscrneg}{ }}
\providecommand{\bigscr}[1]{\class{bigscr}{#1}}
\providecommand{\smallscr}[1]{\class{smallscr}{#1}}
\providecommand{\smallscrskip}[1]{\class{smallscrskip}{\hskip #1}}

\newcommand{\mydots}{{\cdot}\kern -0.1pt{\cdot}\kern -0.1pt{\cdot}}

\newcommand{\sign}{\textsf{sign}}
\renewcommand{\theenumi}{(\roman{enumi})}

[//]: #  The following doesn't work outside of a LaTeX output because pandoc only
[//]: #  provides a bare bones macro replacement mechanism --- it doesn't really speak
[//]: #  TeX macro language itself. I'm leaving this here as a reminder since I had
[//]: #  to learn this lesson with some confusion. See here:
[//]: #  https://pandoc.org/MANUAL.html#latex-macros
[//]: #  \newcommand{\atest}{\count255=1\loop hi\ifnum\count255<10\advance\count255 by 1 \repeat}

This is a collection of notes about permutations --- all the different
ways of ordering a set of distinct elements. In group theory, the group of
permutations of size $n$ is denoted $S_n$. For example:

<div class="table1">

------- ---------------------------
$S_2$   $\tt 12 \quad 21$
$S_3$   $\tt 123 \quad 132 \quad 213 \quad 231 \quad 312 \quad 321$
$S_4$   $\tt 1234 \quad 1243 \quad 1324 \quad 1342 \quad 1423 \quad 1432$
        $\tt 2134 \quad 2143 \quad 2314 \quad 2341 \quad 2413 \quad 2431$
        $\tt 3124 \quad 3142 \quad 3214 \quad 3241 \quad 3412 \quad 3421$
        $\tt 4123 \quad 4132 \quad 4213 \quad 4231 \quad 4312 \quad 4321$
------- ---------------------------

</div>
You can think of a single permutation as either a particular ordering of
the integers 1 through $n$, or, equivalently, as a 1-1 and onto mapping
$f:\{1,\ldots, n\}\to\{1,\ldots,n\}$.
There's a natural way to write such a mapping $f$, which is to list
out $f(1), f(2), \ldots, f(n)$ as a *string*;
you can consider the lists of elements
of $S_2, S_3, S_4$ above to be in this string notation.
By default, this article will view
permutations as mappings.

[//]: # This serves as an example of how to insert comments in an md file.
[//]: #
[//]: # Here is more to the comment.
[//]: # Commenty comment.

\newcommand{\cs}{\mathsf{cs}}
\newcommand{\dist}{\mathsf{dist}}

This article covers the following independent observations about permutations:

* I'll introduce the idea of a *cut-merge* operation, and show how this
  corresponds to a *transposition*; a transposition is a permutation that
  exchanges two elements of a set, and changes no others. Given the set {1, 2,
  3, 4, 5}, the swap of 2 and 5 would be a transposition; I might write this
  permutation as
  $\tt 1\underline{5}34\underline{2}$.
* Permutations can be split into two kinds: *odd* permutations and *even*
  permutations. Just as odd + even = odd when it comes to integer addition,
  the analogous rules hold for permutations under composition. For example, if I
  apply an odd permutation, and then apply an even permutation after that, the
  result of the combined permutations is itself an odd permutation (and this
  analogy holds for all combinations of odd/even). I'll present a simple proof
  of this breakdown using cut-merge operations.
* I'll discuss a generalization of the parity (even-ness or odd-ness) of a
  permutation $\pi$ that I call the *magnitude* $m(\pi)$ of the permutation.
* I'll define the *cycle structure* $\cs(\pi)$ and show that
  $\cs(a \cdot b) = \cs(b \cdot a)$ for any two permutations $a, b$.
* I'll show that the magnitude $m(\cdot)$ acts like a norm on the group $S_n$,
  and that it can define a coherent distance function $\dist(\cdot, \cdot)$
  on $S_n$.
* Finally, I'll look at a particular notation for permutations called
  *cycle notation* (not a new idea), and I'll explain a human-oriented
  algorithm to efficiently multiply permutations written in this notation.

[//]: # * I'll define the graph $G_n$ with elements of $S_n$ as nodes, and with
[//]: #   transpositions as edges. (This kind of graph has been defined in the
[//]: #   literature before.)
[//]: # this item continues, but I'm omitting it b/c it goes in part 2. ^^^

When I say these are *independent* observations, I mean that these ideas are new
to me. I have not tried much to check if they are new to the world
altogether --- in all likelihood, many of these ideas have been discovered by
others before me. Still, I think they're fun ideas worth sharing.

# Cycle Notation

Any permutation is a specific ordering of a set of distinct elements.
This article focuses on *finite* permutations, and I'll generally use the
variable $n$ to denote the size of the set being permuted.
It's simple and traditional to think of a permutation as a bijection
(a 1-1 and onto mapping) of the first $n$ integers --- for example,
here's a permutation of the set $\{1, 2, \ldots, 8\}$ in string notation:

$$\pi = 15273648.$$ {#eq:eq1}

Despite the possible confusion with the constant $\pi=3.141\ldots$, it's
also traditional to use the variable $\pi$ for a permutation, as (clearly)
$\pi$ stands for "$\pi$ermutation."

There are many fun ways to denote or think about a particular permutation.
For example, given $\pi$ as in ([-@eq:eq1]), we could think of it as the
sequence $\pi_1=1$, $\pi_2=5$, $\ldots$, $\pi_8=8$.
We could also think of it as a function $\pi:[n]\to[n]$, using
$[n]$ to denote the integers $\{1, 2,\ldots, n\}$.

This article uses a particular notation for permutations called
*cycle notation*: the intuition for cycle notation is to write out
a string of integers in $[n]$ with the interpretation
that any consecutive pair $ij$ indicates that $i$ is mapped to $j$.
Our permutation from ([-@eq:eq1]) looks like this in cycle notation:

$$ \pi = (2\;5\;3)(4\;7) $$

because $\pi(2) = 5$, $\pi(5) = 3$, and $\pi(4) = 7$.
Further, each sequence in parentheses *wraps around*;
$\pi(3)=2$ and $\pi(7)=4$.
Thus each parenthesized sequence is a *cycle*.
It is understood that any omitted elements are mapped to themselves;
since $\pi(1)=1$, we don't need to include $1$ in the cycle notation
for $\pi$.

Examples:

<div class="table2">

-            -                            -             -------------------
For $n=5$,   $(1\;3)$                     denotes       $\tt 32145$.
For $n=5$,   $(2\;3)(4\;5)$               denotes       $\tt 13254$.
For $n=8$,   $(1\;5\;2)(3\;7)(4\;8\;6)$   denotes       $\tt 51782436$.
-            -                            -             -------------------

</div>

You could write the same permutation many ways in cycle notation;
for example:

$$ \pi = (7\;4)(5\;3\;2) = (3\;2\;5)(7\;4) = (2\;5\;3)(4\;7). $$

Among those choices, I cosider the last one to be standard because
it's lexicographically first.

# The Cut-Merge Operation

Now I'll introduce an operation that acts naturally on the cycle
notation of a permutation. Intuitively, a *merge* is an operation
that combines two cycles by concatenating their cycle notation.
When two elements --- say 3 and 5 --- are in different
cycles, then I'll write $\pi * (3\;5)$ to
mean "merge, in $\pi$, the cycles starting with 3 and 5."

An example:

$$(1\;2)(3\;4)(5\;6) * (3\;5) = (1\;2)(3\;4\;5\;6).$$

What if 3 and 5 were already in the same cycle?
Then $\pi * (3\;5)$ takes on the meaning
"*cut* apart the subcycles starting with 3 and 5:"

$$(1\;2)(3\;4\;5\;6) * (3\;5) = (1\;2)(3\;4)(5\;6)$$

or

$$(1\;2\;3\;4\;5) * (3\;5) = (3\;4)(5\;1\;2);$$

this last example might be easier to see when you keep
in mind that

$$(1\;2\;3\;4\;5) = (\underline{3}\;4\;\underline{5}\;1\;2).$$

Now I'm ready to more carefully define the cut-merge operation
$*(x\;y)$. In the definition below, I'll write $(x\mydots)$ to
denote the cycle starting with $x$; and, analogously,
I'll write $(x\mydots\;y\mydots)$ to indicate a cycle containing both
$x$ and $y$, possibly with other elements indicated by the dots.

<div class="box"> \boxedstart

**Definition** $\quad$
The *cut-merge* operation $*(x\;y)$ operates on a
permutation $\pi$ via
$$ \pi * (x\;y) = \begin{cases}
    (x\mydots\;y\mydots)\,\sigma & \text{when } \pi = (x\mydots)(y\mydots)\,\sigma, \text{ or,} \\
    (x\mydots)(y\mydots)\,\sigma & \text{when } \pi = (x\mydots\;y\mydots)\,\sigma, \\
\end{cases}$$
where $\sigma$ represents all the other cycles of $\pi$; $\sigma$ may
represent no cycles.

\boxedend </div>

The operation *cuts* a cycle if $x$ and $y$ are in the same cycle; otherwise
it *merges* the cycles of $x$ and $y$.
A shorthand for the definition is:

$$ (x\mydots\;y\mydots) \; \underset{*(x\;y)}{\longleftrightarrow} \; (x\mydots)(y\mydots). $$

[//]: # *a

Note that a merge can still operate on elements not explicitly written
in cycle notation. If I write $e$ to denote the identity permutation,
with $\pi_i=i\;\forall i$, then

$$e * (x\;y) = (x\;y). $$

Similarly,

$$(1\;2) * (2\;3) = (2\;1\;3)$$

because, setting $x=2$ and $y=3$, we think of
the left side as $(x\mydots)(y\mydots)=(2 1)(3)$.

<div class="box"> \boxedstart

**Observation 1** $\quad$
The cut-merge operation $\pi * (x\;y)$ is simply $\pi$ composed with
the permutation $(x\;y)$.

\boxedend </div>

To state this observation again, I'll introduce the notation $\rho_{ab}()$
for the function that swaps input elements $a$ and $b$, but otherwise
acts as the identity function. Thus $\rho_{ab}()$ is the function version
of the *transposition* that we would write in cycle notation as $(a\;b)$.
With $\rho_{ab}()$ defined, I can express observation 1 like so:

$$ \left(\pi * (x\;y)\right)(i) = \rho_{xy}(\pi(i)), $$ {#eq:eq2}

where I'm thinking of permutations as functions, so the $(i)$ sub-expression
is evaluating the function on input $i \in \{1, 2, \ldots, n\}$.

I could stop to carefully prove observation 1, but I think you'll have more fun
if you convince yourself it's true on your own.

Why did I bother to define the cut-merge operation when I could have just
started with ([-@eq:eq2]) instead? Because the perspective of the definition I'm
using will let us make some interesting further observations, as we'll see
below.

# The Magnitude and Parity of a Permutation

**Definition** $\quad$
The *magnitude* of a permutation $\pi$ is given by

$$ m(\pi) := \#(\text{cycle elements of }\pi) - \#(\text{cycles of }\pi), $$

where a *cycle element* of $\pi$ is any element written in the
cycle notation of $\pi$, and where we similarly count the *cycles* of $\pi$
based on how many cycles are written in $\pi$'s cycle notation.

For example, the permutation $\pi = (2\;5\;3)(4\;7)$ has 5 cycle
elements and 2 cycles, so $m(\pi) = 3$.

Notice that $m(\pi)$ remains the same if we include singleton cycles in
our cycle notation. It would be nonstandard to include singletons, but it
would still be a consistent notation. Continuing our example,
$\pi = (1)(2\;5\;3)(4\;7)(6)
\Rightarrow m(\pi) = 7 - 4 = 3$, as before.
This leads to:

<div class="box"> \boxedstart

**Observation 2** $\quad$
$$ m(\pi) = n - \#(\text{orbits}), $$
where an *orbit* is either a cycle with multiple elements,
or a *singleton*, which is an element $i : \pi(i) = i$.

\boxedend </div>

Let's see why the definition of $m(\pi)$ is interesting.

<div class="box"> \boxedstart

**Observation 3** $\quad$

#. Every merge increases $m(\pi)$ by 1.
#. Every cut decreases $m(\pi)$ by 1.
#. $m(\pi)$ is the least number of cut-merge operations which
   can reach $\pi$ from the identity permutation $e$.

\boxedend </div>

Parts (i) and (ii) are easy to check.

Part (iii) is clear from the cut-merge perspective in that
(a) we cannot build $\pi$ in fewer operations, based on (i);
and (b) we can indeed build $\pi$ in $m(\pi)$ merges by appending
together the appropriate singletons one at a time. For example:

$$(2\;5\;3)(4\;7) = e * (2\;5) * (2\;3) * (4\;7).$$ {#eq:eq3}

Starting now, I'll write simply $\sigma \tau$ or $\sigma\cdot\tau$ to denote
the composition of permutations $\sigma$ and $\tau$.
Using observation 1, we can see that the construction pattern used in
([-@eq:eq3]) must work for any cycle that we want to write as a composition
of transpositions:

$$(x_1\;x_2\cdots x_k) = (x_1\;x_2)(x_1\;x_3)\cdots(x_1\;x_k).$$

In other words, every permutation is the product of $m(\pi)$
transpositions, and cannot be the product of fewer.
It could be the product of more, though:

$$ (1\;2\;3) = (1\;2)(1\;3)(8\;9)(8\;9). $$

Now we're getting to an interesting way to split permutations into two
distinct subsets:

<div class="box"> \boxedstart

**Definition** $\quad$
A permutation $\pi$ is *odd* if $m(\pi)$ is odd, and *even* otherwise.

\boxedend </div>

As soon as we call something even or odd, we expect some kind of behavior
like this to happen:

$$
\begin{alignedat}{2}
\text{even} &+ \text{even} &&= \text{even}  \\
\text{odd}  &+ \text{even} &&= \text{odd}   \\
\text{odd}  &+ \text{odd}  &&= \text{even}. \\
\end{alignedat}
$$ {#eq:eq4}

It turns out that these rules do indeed hold true in the sense that, for
example, if we compose an odd permutation with another odd permutation,
the result is an even permutation. Next I'll explain
why the intuitive identities of ([-@eq:eq4]) are true for permutations.

The key to the proof is to see that, for any sequence
of transpositions $t_1, t_2, \ldots, t_k$:

$$m(t_1t_2\cdots t_k)\text{ is even iff } k \text{ is even}.$$ {#eq:eq5}

This fact follows from observation 3. In more detail:
Certainly $m(e)=0$ (recall that $e$ is the identity permutation); this
corresponds to $k=0$ in ([-@eq:eq5]), an empty product.
Now for larger values of $k$: If $\pi=t_1t_2\cdots t_{k-1}$ and we
compose $\pi$ with $t_k$ (move from $\pi$ to $\pi\cdot t_k$),
then the parity (even/odd-ness) of the permutation switches because
$m(\pi\cdot t_k) = m(\pi) \pm 1$ by observation 3.
So $\pi\cdot t_k$ is even iff $\pi$ is odd. This is enough
to complete a proof of ([-@eq:eq5]) by induction on $k$.

[//]: # TODO The bit below is all new; try to clean it up and clarify.

Planning ahead, it will be useful to define the sign function of a
permutation $\pi$ like so:
$$\textsf{sign}(\pi) := \begin{cases}
    \phantom{-}1  & \text{if $\pi$ is even, and} \\
    -1            & \text{if $\pi$ is odd.}
\end{cases}$$
Notice that $\sign(\pi) = (-1)^{m(\pi)}$.

When we use this sign function, we're essentially moving from an additive view
of even/odd-ness and into a multiplicative view --- but the two views are
equivalent.
For example, the equation
$$\text{even} + \text{odd} = \text{odd}$$
becomes
$$(-1)^\text{even}(-1)^\text{odd} = (-1)^\text{odd}.$$
The general equation $(-1)^a(-1)^b = (-1)^{a+b}$ provides the equivalence.

We can now state the idea of ([-@eq:eq4]) both more formally and more
succinctly.

<div class="box"> \boxedstart

For any two permutations $\sigma$ and $\tau$,
$$\sign(\sigma\cdot\tau) = \sign(\sigma) \cdot \sign(\tau).$$ {#eq:eq5b}

\boxedend </div>

Let's see why ([-@eq:eq5b]) is true.
Let $k = m(\sigma)$ and $k' = m(\tau)$. Then, using observation
3(iii), we can find transpositions $(t_i)_1^k$ and $(t'_i)_1^{k'}$ so that
\begin{align*}
  \sigma &= t_1 \cdots t_k \\
  \tau   &= t'_1 \cdots t'_{k'}.
\end{align*}
Then
$$
\begin{alignedat}{2}
\sign(\sigma\cdot\tau) &= (-1)^{m(\sigma\tau)} & \text{by def'n of }\sign \\
&= (-1)^{m(t_1\cdots t_k \cdot t'_1 \cdots t'_{k'})} &
          \quad\text{ by def'n of $t_i$ and $t'_i$} \\
&= (-1)^{k + k'} & \text{ by (5)} \\
&= (-1)^k (-1)^{k'} \\
&= \sign(\sigma)\sign(\tau).
\end{alignedat}
$$
This completes the proof of ([-@eq:eq5b]). And ([-@eq:eq5b]) expresses the same
idea as ([-@eq:eq4]), so that we have now justified all of those
formulae.

[//]: # *a

Moving back to group theory: Notice that if $\sigma$ and $\tau$ are both even
permutations, then so is $\sigma\tau$. In other words, the subset of even
permutations is closed under composition, so that they form a subgroup of $S_n$.
This is not true for odd permutations.

# Previous Approaches to Permutation Parity

I like the cut-merge proof of ([-@eq:eq5b]) because it provides an intuition
for *why* parity makes sense for permutations.
In a nutshell, every permutation is a sequence of transpositions (cut-merges),
and every transposition is a flip of the parity because the magnitude must
either increase or decrease by 1.

Here's a sketch of the intuitive paths we've crossed:

[//]: # TODO HERE vvvvvv Clean up this overfull diagram.

<div class="table3">

 | | | |
:-------:|:-:|:-------:|:-:|:-------:
$\fbox{transpositions}$ | $\longleftrightarrow$ | $\fbox{cut-merges}$ | $\longleftrightarrow$ | $\fbox{changes to cycles}$
 | | | |  | $\updownarrow\customstrut$
 | | | $\fbox{changes to parity}$ | $\longleftrightarrow$ | $\fbox{changes to \(m(\pi)\)}$

</div>



# References