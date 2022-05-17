% Notes on Permutations: Cycles and Transpositions
% Tyler Neylon
% Started typing up 166.2022

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

\newcommand{\sign}{\textsf{sign}}
\newcommand{\csfn}{\textsf{cs}}
\newcommand{\order}{\textsf{order}}
\renewcommand{\theenumi}{(\roman{enumi})}

[//]: #  TODO: Try adding a table of contents, but not at the tippy top.
[//]: #        I think it will work better after the introductory text.
[//]: #        This may be helpful to achieve that:
[//]: #        https://stackoverflow.com/questions/25591517/pandoc-inserting-pages-before-generated-table-of-contents


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

[//]: # TODO ^^^^^^ I think the multiplication algorithm will be another part.
[//]: #             So update the above list accordingly.


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

I'll contrast the proof above of ([-@eq:eq5b]) with two other approaches.

## Herstein's Proof

In his book *Topics in Algebra*, I.N. Herstein uses the
Vandermonde polynomial:

$$ p(x_1,\ldots, x_n) := \prod_{i<j}(x_i-x_j). $$

Given a permutation $\pi$, we can now define

$$ \pi(p(x_1,\ldots, x_n)) := p(x_{\pi_1},\ldots, x_{\pi_n}). $$

The polynomial $\pi(p)$ is still a product of $(x_i - x_j)$ for
all $i\ne j$, but the sign of the polynomial may change.
For example, when $n=3$, and $\pi=(1\;2)$:

\begin{align*}
p(x_1, x_2, x_3) &= (x_1 - x_2)(x_1 - x_3)(x_2 - x_3) \\
\pi(p)           &= (x_2 - x_1)(x_2 - x_3)(x_1 - x_3) = -p.
\end{align*}

Since $\pi(p) = \pm p$ for any $\pi$, we can (re)define

$$ \sign(\pi) := \pi(p)/p \in \{-1, +1\}. $$ {#eq:eq7}

(Temporarily forget our original definition of $\sign(\pi)$.
We'll re-prove ([-@eq:eq5b]), and because our new and old $\sign()$
functions are the same on $e$ and on transpositions, it will
follow that they are in fact the same function.)

Notice that

$$\pi(-p) = -\pi(p)$$ {#eq:eq8}

based on the definition of $\pi(p)$.

This means that, for any two permutations $\sigma$ and $\tau$,

$$
\begin{alignedat}{2}
\sigma(\tau(p)) &= \sigma(\sign(\tau)\cdot p) & \text{by } (7) \\
                &= \sign(\tau)\cdot\sigma(p)  & \text{by } (8) \\
                &= \sign(\sigma)\cdot\sign(\tau)\cdot p.
\end{alignedat}
$$

In summary, $\sign(\sigma\cdot\tau) = \sign(\sigma)\cdot\sigma(\tau)$,
which confirms ([-@eq:eq5b]) for this new definition of $\sign()$.
This proof provides less insight than the cut-merge approach
as to *why* ([-@eq:eq5b]) is true ---
into what is going on behind the scenes to make things click.

## Artin's Proof

The other approach I'll consider is from the book *Algebra* by Michael
Artin. This second alternative proof works by translating permutations
into the language of linear algebra, and relies upon properties of
the determinant of a matrix. On the off chance that you're not fluent
in properties of determinants, you can skim or skip this section
and safely resume reading afterwards (the remainder of this note
does not rely on linear algebra).
I'm not a huge fan of this proof because
it's so easy to get lost in the details of tracking the relationship
between vector coordinates and how permutations act on them. I'll
break the proof down into small steps to walk you through
the dance of indices.

I'll use the variable $e_i$ to denote the length-$n$ column vector
$$e_i =
\begin{array}{l}
0 \\
0 \\
\vdots \\
1 \longleftarrow i^\text{th}\text{ place}. \\
\vdots \\
0 \\
0 \\
\end{array}$$

For example, if $n=3$, then

$$
e_1 = \begin{pmatrix} 1 \\ 0 \\ 0 \end{pmatrix} \quad
e_2 = \begin{pmatrix} 1 \\ 1 \\ 0 \end{pmatrix} \quad
e_3 = \begin{pmatrix} 0 \\ 0 \\ 1 \end{pmatrix}.
$$

Now I can define, for permutation $\pi$, the $n\times n$ matrix $M_\pi$
as having $e_{\pi_i}$ for its $i^\text{th}$ column;
this is how Artin represents a permutation as a matrix.
For example, if $\sigma = (3\;2\;1)$ then
$M_\sigma = \left(\begin{smallmatrix}&1\\ &&1\\ 1 \end{smallmatrix}\right)$.

Let's see why this matrix definition makes sense.
Let $\vec n := \left(\begin{smallmatrix}1 \\ 2 \\ \vdots \\
n\end{smallmatrix}\right)$, and then, using the column-expansion perspective of
matrix multiplication,

$$M_\pi\vec n = 1\cdot e_{\pi_1} + 2\cdot e_{\pi_2} + \ldots + n\cdot e_{\pi_n}
= 
\left(
\begin{array}{l}
\vdots \\
i \\
\vdots \\
\end{array}
\right)
\longleftarrow\text{ in row }\pi_i.
$$ {#eq:eq9}

In other words, when we multiply $M_\pi$ on the left of a column vector,
we take whatever value was in the $i^\text{th}$ row and move it to the
$\pi_i^\text{th}$ row.
For example, with $n=3$, $M_\sigma\vec n =
\left(\begin{smallmatrix}&1\\ &&1\\ 1 \end{smallmatrix}\right)
\left(\begin{smallmatrix}1 \\ 2 \\ 3 \\ \end{smallmatrix}\right) =
\left(\begin{smallmatrix}2 \\ 3 \\ 1 \\ \end{smallmatrix}\right)$.
We can express the way $M_\pi$ performs $\pi$ by rewriting ([-@eq:eq9])
as:
$$ y = M_\pi\vec n \Rightarrow y_{\pi_i}=i \Rightarrow
   y_j=\pi^{-1}(j) \Rightarrow \pi(y_j) = j.
$$ {#eq:eq10}
Intuitively: ``$\pi$ maps each value in $M_\pi\vec n$ to its row number.''

\newcommand{\xcolvec}{\begin{pmatrix}x_1 \\ \vdots \\ x_n\end{pmatrix}}

It will be useful to slightly generalize ([-@eq:eq10]) like this,
using the notation $[v]_i$ to indicate the $i^\text{th}$
coordinate of column vector $v$:
$$\left[M_\pi\begin{pmatrix} x_1 \\ \vdots \\ x_n\end{pmatrix}
   \right]_{\displaystyle\, \pi_i}
   \!\! = x_i \quad\Rightarrow\quad
   \left[M_\pi\begin{pmatrix}x_1 \\ \vdots \\ x_n\end{pmatrix}
   \right]_{\displaystyle\, i}
   \!\! = x_{\pi^{-1}i}.
$$ {#eq:eq11}

We're ready to see how the composition of permutations $\sigma$ and $\tau$
translates to matrices via ([-@eq:eq11]):
$$ \left[M_\tau M_\sigma \xcolvec\right]_{\displaystyle\, i} =
   \left[M_\sigma \xcolvec\right]_{\displaystyle\,\tau^{-1}(i)} \!\! =
   x_{\sigma^{-1}(\tau^{-1}(i))}.
$$ {#eq:eq12}
That is,
$$ y = M_\tau M_\sigma\vec n \Rightarrow
   y_i = \sigma^{-1}(\tau^{-1}(i)) \Rightarrow
   \tau(\sigma(y_i)) = i.
$$ {#eq:eq13}
Keep in mind that I've always been writing
(and will continue to write) $\sigma \cdot \tau$ to mean that
$\sigma$ happens first and $\tau$ second. In traditional functional
notation, this same composition is written as $\tau(\sigma(i))$.
Intuitively:
$$
\sigma\cdot\tau \approx \tau(\sigma(\cdot)) \approx M_\tau M_\sigma.
$$
The switch of ordering can be confusing.

Back to ([-@eq:eq13]): We can summarize this as
$$M_{\sigma\cdot\tau} = M_\tau M_\sigma.$$

At long last, I'm ready to (re)define the $\sign()$ function,
following Artin:
$$\sign(\pi) := \det(M_\pi),$$
where $\det()$ is the determinant function of a square matrix.

It turns out that this definition is also consistent with
our earlier definitions because:

* $\det(M_t) = -1$ for any transposition $t$ because exchanging
  any two columns of a matrix negates its determinant; and
* when $\pi=\prod_{i=1}^k t_i$ for transpositions $(t_i)_1^k$,
  $\sign(\pi) = \det(M_\pi) = \det(\prod_{i=1}^kM_{t_i})
  = (-1)^k =$ our cut-merge definition of $\sign()$, based
  on ([-@eq:eq5]).

In using this approach, Artin is able to show that
([-@eq:eq5b]) holds simply by delegating the work to the properties
of matrix determinants. In particular, using the fact that
$\det(AB) = \det(A)\det(B)$:
$$\sign(\sigma\cdot\tau) = \det(M_\tau M_\sigma) =
  \det(M_\tau)\det(M_\sigma) = \sign(\sigma)\sign(\tau).
$$

Artin's proof is certainly valid, though I think it offers
less insight into *why* equation ([-@eq:eq5b]) holds when
compared to the cut-merge proof.

# Cycle Structures

Let $\sigma = (1\;3)(2\;4\;5)$ and $\tau = (1\;4)(2\;3)$.
Then
\begin{align*}
  \sigma \tau &= (1\;2)(3\;4\;5), \text{ and} \\
  \tau \sigma &= (1\;5\;2)(3\;4).
\end{align*}

Notice that these two permutations each have one
cycle of length 2 and another of length 3. Is this a
coincidence? It turns out that this similarity of
structure will *always* hold between $\sigma \tau$ and
$\tau \sigma$. I'll have to define a new concept before I can
precisely formulate this relationship.

<div class="box"> \boxedstart

**Definition** $\quad$
Given a permtuation $\pi$, a *cycle set* $S$ of $\pi$ is a set
of elements in the domain of $\pi$ such that, for any $a,b\in S$,
$\exists k:\pi^k(a)=b$. Notice that every element in the domain
of $\pi$ is in exactly one cycle set of $\pi$.

\indent
The *cycle structure* $\csfn(\pi)$ of $\pi$ is a
function $f:\N_{\ge 1}\to\N_{\ge 0}$ such that
$f(i) :=$ the number of cycle sets of $\pi$ with $i$ elements.

\boxedend </div>

As a shorthand, I'll write $(f(1), f(2), f(3), \ldots)$ to
express a cycle structure. For example, when $n=5$,
the permutation $(1\;2)(3\;4\;5)$ has cycle structure
$(0, 1, 1)$; so does the permutation $(1\;5\;2)(3\;4)$.
Now I can state:

<div class="box"> \boxedstart

**Observation 4** $\quad$
For any permutations $\sigma$ and $\tau$,
$$ \csfn(\sigma\tau) = \csfn(\tau\sigma). $$

\boxedend </div>

I'll provide two proofs because they each
shed their own light on why this is true.

**Proof 1** $\quad$
Given permutation $\pi$,
I'll write $\order_\pi(i)=k$ to mean that $\pi^k(i)=i$,
and there is no $\ell < k : \pi^\ell(i)=i$.
To prove the observation, it's sufficient to show that there is
a 1-1 and onto mapping $f:[n]\to[n]$ such that
$\order_{\sigma\tau}(i)=k \Leftrightarrow \order_{\tau\sigma}(f(i))=k$.

Suppose $\order_{\sigma\tau}(i)=k$.
Let $j=\tau^{-1}(i)$.
In the following equations, I'll use a left-to-write, input-to-output
notation, where $i\pi$ means $\pi(i)$ and $i\sigma\tau$ means
$\tau(\sigma(i))$. We have:
$$ i = i(\sigma\tau)^k = j\tau(\sigma\tau)^k = j(\tau\sigma)^k\tau. $$
Now apply $\tau^{-1}$ to the left-most and right-most expressions above
to arrive at:

$$ j= i\tau^{-1} = j(\tau\sigma)^k
   \;\Rightarrow\; \order_{\tau\sigma}(j) \le k = \order_{\sigma\tau}(i).
$$ {#eq:eq15}

On the other hand, if $\ell=\order_{\tau\sigma}(j)$, then
$$ i = (j)\tau = (j)(\tau\sigma)^\ell\tau
     = (j)\tau(\sigma\tau)^\ell = i(\sigma\tau)^\ell
$$
$$ \Rightarrow \order_{\sigma\tau}(i) \le \ell = \order_{\tau\sigma}(j).
$$ {#eq:eq16}

Combining ([-@eq:eq15]) and ([-@eq:eq16]),
$$ \order_{\sigma\tau}(i) = \order_{\tau\sigma}(j=\tau^{-1}(i)), $$
and it turns out that $\tau^{-1}$ is the mapping $f:[n]\to [n]$
we needed to complete the proof.
$\square$

**Proof 2** $\quad$
Given any permutation product $\sigma\tau$, we can decompose
$\tau$ into transpositions as in
$\tau = t_1\cdots t_k$.
Now we can think in terms of a series of smaller steps that carry
us from $\sigma\tau$ over to $\tau\sigma$:
\begin{align*}
  \pi_0 &= \sigma\tau = \sigma\cdot t_1 \cdots t_k \\
  \pi_1 &= t_k \cdot \sigma \cdot \tau t_k^{-1} = t_k\sigma t_1\cdots t_{k-1} \\
  \vdots \\
  \pi_k &= t_1\cdots t_k \sigma \tau t_k^{-1}\cdots t_1^{-1} = \tau\sigma.
\end{align*}
Each small step here can be characterized as
$\pi_{i+1} = t_{k-i}\pi_i t_{k-i}$, using the fact that $t_j^{-1}=t_j$,
which is true for any transposition. So the problem
is reduced to showing that
$$ \csfn(\pi) = \csfn(t \pi t) \text{ for any permutation $\pi$
and transposition $t$.} $$




# References
