% Notes on Permutations: Cycles and Transpositions
% Tyler Neylon
% Started typing up 166.2022

\newcommand{\R}{\mathbb{R}}
\newcommand{\eqnset}[1]{\left.\mbox{$#1$}\;\;\right\rbrace\class{postbrace}{ }}
\providecommand{\optquad}{\class{optquad}{}}
\providecommand{\smallscrneg}{\class{smallscrneg}{ }}
\providecommand{\bigscr}[1]{\class{bigscr}{#1}}
\providecommand{\smallscr}[1]{\class{smallscr}{#1}}
\providecommand{\smallscrskip}[1]{\class{smallscrskip}{\hskip #1}}

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
* I'll show that the magnitude $m(\pi)$ acts like a norm on the group $S_n$,
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

[//]: # TODO HERE vvvvvv

$$\pi = 15273648.$$ {#eq:eq1}


# References
