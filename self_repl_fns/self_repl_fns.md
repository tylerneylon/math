% Self-Replicating Functions
% Tyler Neylon
% 204.2016

\newcommand{\R}{\mathbb{R}}

These are notes I'm creating for myself as I explore
functions $f$ that can be written as a sum $f = g_1 + g_2$ where $g_1$ and $g_2$
are the same up to symmetry, and both $g_1$ and $g_2$ strongly resemble shifts
of the
original function $f$.
When a function $f$ has these properties, I informally call it a
*self-replicating function*.

Like the word *fractal*, this term is not
rigorously defined — in particular, it depends on the ambiguous
notion of "strong resemblance" — although I plan to investigate more precise
requirements
below.

![As an example of a self-replicating function, the normal curve can be
expressed as the sum of two normal-like curves that are reflections of each
other.](images/added_normals4.png){#fig:added_normals}

# Motivation

I became interested in self-replicating functions by working on algorithms to
procedurally generate 3d models of natural-looking trees. When algorithmically
making trees, it makes sense to start from the idea of an
[*L-system*](https://en.wikipedia.org/wiki/L-system), which can
be visualized as a kind of fractal in which a trunk forks into branches that
themselves fork into smaller subranches, this process repeating infinitely.

I noticed that tree-like *L*-systems can have a large amount of
"branch overlap" concentrated around a central area of their apparent surface.
For example, consider the two images in [@fig:ellsystem]. On the left is a
standard
*L*-system along with a histogram showing the density of leaf points along the
edge. Intuitively, the leaf points are dense even toward the
extreme angles of the tree's top. However, the density increases continuously
toward the center.

We could think of each leaf point as doing a certain amount
of work by covering some area along the top of the *L*-system.
Each subtree is so oblivious to its other subtrees that they overlap heavily,
and the central leaf
points end up being highly redundant. To illustrate this redundancy, the
right-hand figure shows the exact same *L*-system with essentially half of
the tree removed — yet the shape formed by the leaf points is only slightly
changed.

![Left: An *L*-system; Right: the same system with two large subtrees removed.
In both cases, a histogram of leaf point density is provided around an
outer ellipse.](images/ellsystem2.png){#fig:ellsystem}

One approach to smoothing out the distribution of leaf points would be to
compromise the fractal-like nature of the system by choosing each line direction
based on where it is within the fractal, rather than simply by making each
branching point a smaller version of its parent.
The line directions can be chosen so that
the set of points at a fixed distance from the trunk point
form a set of equidistant angles from a central point.
The result is an extremely
regular edge, as seen in [@fig:well_dist].

![A *L*-like system in which line directions are chosen to maximize the
regularity of leaf point
distribution.](images/well_distributed_ell_like_system.png){#fig:well_dist}

This is ideally efficient in that each leaf point is equally important
in forming the shape of the
system. However, this
system is defined in terms of
the path to each point. Is it possible to design a system so
that the overall distribution of leaf points is fairly even, yet each subtree's
shape is independent of its position within the full tree?

If this goal were achieved, we would necessarily have a leaf point distribution
which was the sum of two smaller versions of itself.
Intuitively, the leaf-point distribution of any *L*-system is
already a self-replication function
because, if its two main subtrees have distribution functions $g_1$ and $g_2$,
then the full tree has distribution function $f = g_1 + g_2$.
I have to say *intuitively* here because I haven't formally defined the
leaf-point distribution of an *L*-system.

Thus, *L*-systems naturally coincide with self-replicating functions. Although
there are probably self-replicating functions which do not correspond with
*L*-systems, I nonetheless find it interesting to independently explore the
world of self-replicating functions.


# Simple cases

Technically, any polynomial can be seen as a kind of
self-replicating function. For example, if $f(x) = x^2$,

$$\begin{array}{rcl}
  g_1(x) & = & (x + 1)^2 - 1 = x^2 + 2x, \quad \text{and} \\
  g_2(x) & = & (x - 1)^2 - 1 = x^2 - 2x, \\
\end{array}$$

then $f = g_1 + g_2$, and each $g_i$ is a shift of the original function $f$.
In general, if $f(x) = ax^n + O(x^{n-1})$ then we can choose
$g_i(x) = a(x\pm 1)^n + O(x^{n-1})$ so that $f = g_1 + g_2$,
and each $g_i$ has

$$ \lim_{x\to\pm\infty}\frac{g_i(x)}{f(x)} = 1,$$

which is good enough for me to subjectively say that they strongly
resemble shifts of $f$.

However, the original motivation for self-replicating functions is based on
distribution functions, so the rest of this note focuses on functions $f$
for which $\lim_{x\to\pm\infty}f(x) = 0$.

Another simple approach would be to set $g_1 = g_2 = \frac{1}{2}f$ for
any function $f$. This is not very interesting, and the word *shift* in the
informal definition of a self-replicating function is intended to defeat this
trivial case. That is, each $g_i$ is expected to be similar to a translation of
$f$, such as $f(x-1)$ or $f(x+1)$.

## Indicator functions

The next function I'll describe is simple and meets all of the requirements so
far. An *indicator function* is a function taking on only the value 0 or 1; it's
also sometimes referred to as a *characteristic function*.
If $f$ is an indicator function, then you can think of those $x$ with $f(x) = 1$
as belonging to the subset of the domain which is *indicated* by the function.
It's handy to use the following bracket notation of Knuth and
others:
given any boolean predicate $P(x)$, let $[P(x)]$ denote the value 1 when $P(x)$
is true, and false otherwise [@taocp1].

Given a half-open interval $[a, b)$, define $I_{[a, b)}$ to be the function
$[x\in[a, b)]$. The following equation shows how such indicator functions can be
considered simple self-replicating functions:
$I_{[0, 2)} = I_{[0, 1)} + I_{[1, 2)}$.

![Visual representation of the addition of indicator functions of
intervals.](images/added_intervals6.png){#fig:added_intervals}

In order to match the equation $f = g_1 + g_2$, emphasizing the similarity
between the $g_i$'s and $f$, we can set $f = I_{[0, 2)}$,
$g_1 = f(2x) = I_{[0, 1)}$, and $g_2 = f(2(x - 1)) = I_{[1, 2)}$.

## Ramp functions {#sec:ramp_functions}

Things get more interesting when $g_1(x) g_2(x) \ne 0$ for some $x$.
To this end, define the *ramp function* for values $a,b,c,d$ with
$a < b < c < d$ via

$$ J_{a,b,c,d} = \begin{cases}
(x - a) / (b - a) & \text{if } x \in [a, b), \\
1 & \text{if } x \in [b, c), \\
(d - x) / (d - c) & \text{if } x \in [c, d), \text{and} \\
0 & \text{otherwise.} \\
\end{cases}$$

Then $J_{0,1,4,5} = J_{0,1,2,3} + J_{2,3,4,5}$, as illustrated in
[@fig:ramp_fns].

![Visual addition of two ramp functions to form
another.](images/ramp_fns3.png){#fig:ramp_fns}

The ramp function example gives me four ideas for further study:

1. The addends and the sum cannot be expressed as linearly related; that is,
   there is no linear function $\ell(x)$ so that
   $J_{0, 1, 2, 3}(\ell(x)) = J_{0, 1, 4, 5}(x)$. Contrast this with the
   interval functions where $I_{[0, 1)}(x / 2) = I_{[0, 2)}$.
   This raises the questions: Which self-replicating functions allow for this
   linear-relation restriction? Is there a slight modification of ramp functions
   which meets this linear-relation restriction?
2. The ramp functions are piece-wise linear, but that linearity is not really
   the key to their being self-replicating. Rather, the key is that the left
   ramp and right ramp sum to 1, which matches the middle height of the
   functions. Which more general self-replicating functions can be constructed
   using this idea?
3. What happens if we treat the sum $f = g_1 + g_2$ as part of a sequence?
   Thinking of *L* and *R* for *left* and *right*,
   let $f^{(0)}_L = J_{0, 1, 2, 3}$, and $f^{(i)}_R = f^{(i)}_L(x-2)$ for
   $i \ge 0$.
   Thinking of *S* for *sum*,
   define $f^{(i+1)}_S = f^{(i)}_L + f^{(i)}_R$ for $i \ge 1$.
   If $f^{(i)}_L$ is positive on $(0, b)$, then $f^{(i)}_R$ is positive on
   $(2, b + 2)$, so $f^{(i+1)}_S$ is positive on $(0, b + 2)$.
   Set $f^{(i+1)}_L = f^{(i+1)}_S(x (b + 2) / b)$ so that we maintain the 
   region on which the left function is positive. In this way, we get a sequence
   of functions. What is the limiting behavior? Can we attempt to extend the
   sequence backwards? Can we say anything in general about the limiting
   behavior of a class of starting functions $f^{(0)}_L$?
4. For the current ramp functions, the middle section is flat with value 1,
   while the edges sum to 1. Can we do something more interesting where the
   edges sum to a non-constant value? I can imagine this leading to a
   discontinuous function. Is there a way to do this where the functions are
   continuous, or at least continuous almost everywhere? Can we describe a
   general class of self-replicating functions which are not continuous, such
   as the indicator function of the Cantor dust?

TODO Mention how I'm following up with further study idea 1.

## Nonlinear ramps {#sec:nonlinear_ramps}

Other curves that sum to 1 could easily take the place of the left and right
edges of the ramp function. For example, the left and right ramps could be
replaced by curves with the shapes of $x^2$ and $1-x^2$ on $x\in [0, 1]$, as
illustrated in [@fig:nonlinear_ramps].

![An example of nonlinear ramp functions using $x^2$ on $x\in [0, 1]$ to determine the edge
shapes.](images/nonlinear_ramps2.png){#fig:nonlinear_ramps}

Given any function $f:[0,1]\to [0,1]$, the generalized ramp function is

$$ K_{a,b,c,d} = \begin{cases}
f\big((x - a) / (b - a)\big) & \text{if } x \in [a, b), \\
1 & \text{if } x \in [b, c), \\
1 - f\big((x - c) / (d - c)\big) & \text{if } x \in [c, d), \text{and} \\
0 & \text{otherwise.} \\
\end{cases}$$

If any function can be written as $K_{a,b,c,d}$ for some value of $f$, I'll call
it a $K-$*function*.
This form is general enough to include interval functions — for example, by
using $f(x) = 0$ — and to include the previous ramp function $J(x)$ by setting
$f(x)=x$.

The versatility of the $K-$functions shows that we can produce self-replicating
functions that are highly discontinuous, such as by setting $f(x)$ to be the
indicator function of a set with many border elements. Even among continuous
functions, we can produce self-replicating functions which avoid being "mostly
monotonic." In particular, I'll say that a function
$f:\R\to\R$ is
*peak monotonic* iff there is a point $x$ such that
$a < b < x \Rightarrow f(a) \le f(b)$ and $x < c < d \Rightarrow f(c) \ge f(d)$.
The indicator function of an interval and the ramp function are both peak
monotonic, while the example $K-$functions in [@fig:other_ramps] are not.

![Example $K-$functions: on the top is a function more discontinuous than the
indicator function of an interval; on the bottom is a continuous but
non-peak-monotonic function.](images/other_ramps2.png){#fig:other_ramps}


## Non-plateau functions

The ramp functions $K_{a,b,c,d}$ all have the constant value 1 on the
middle interval $[b, c]$. This requires the ramps on intervals $[a, b]$ and
$[c, d]$ to sum to 1. In this section, I'll consider what can happen if we relax
this condition. I'll informally call these *non-plateau functions*.

It will be useful to propose one possible formalization of a
self-replicating function before exploring non-plateau functions.

### A formal definition for self-replicating functions

I think the term *self-replicating function* is best left as an intuitive,
non-rigorous concept because there seem to be a wide variety of instances that
are best studied via their own particular flavors of a formal definition.
A number of other terms used to discuss mathematics are similarly
unformalized or context-specific: consider *fractal*, *symmetry*, or *closure*
as examples. Nonetheless, many self-replicating functions meet the conditions
of the definition I'll present next.

Call a function $f$ *exactly self-replicating* iff there exist continuous
bijections $s$, $t_1$, and $t_2$ such that $s$ is not the identity function
and 

$$\begin{array}{rcl}
  f_L(x) & = & f(x), \\
  f_R(x) & = & f(s(x)), \\
  f_S(x) & = & f_L(x) + f_R(x), \text{and} \\
  f_L(x) & = & t_2(f_S(t_1(x))).
\end{array}$$ {#eq:exact_defn}

The *L*, *R*, and *S* subscripts are meant to hint that these functions act as
the *left* addend, *right* addend, and the *sum*; the $s$ function suggests a
*shift*, while the $t_1$ and $t_2$ functions suggest a *transformation*.
The last equation in
([@eq:exact_defn]) captures the similarity relationship between the addend
$f = f_L$ and the
sum $f_S = f_L + f_R$.

**Example**
The ramp functions given in [@sec:ramp_functions] and [@sec:nonlinear_ramps],
viewed as $K-$functions, all adhere to the general form

$$K_{0,1,2,3} + K_{2,3,4,5} = K_{0,1,4,5}.$$

In this case, $f(x) = f_L(x) = K_{0,1,2,3}$ and
$f_R(x) = K_{2,3,4,5} = f(x-2)$ so that $s(x) = x - 2$.
The equation $f_L(x) = f_S(t_1(x))$ is satisfied by defining

$$t_1(x) =
\begin{cases}
  x              &   \text{if } x \le 1,                  \\
  3x - 2         &   \text{if } x \in (1,2), \text{ and}  \\
  x + 2          &   \text{otherwise.}                    \\
\end{cases}$$

To summarize, $s(x) = x - 2$, $t_1(x)$ is defined immediately above, and
$t_2(x) = x$.

This is a simple yet foundational case — it may be interesting to see
which other functions are exactly self-replicating with these parameters.


### Characterizing one type of exactly self-replicating function

In this section I'll give sufficient and necessary conditions for a function
to be exactly self-replicating with the $s$, $t_1$, and $t_2$ functions
given in the above example, and with $f(x)=0$ outside of the interval
$[0, 3]$. This can be considered the most general version of the
category of functions we've explored so far.

\newcommand{\restrict}{\,\big|\,}
For convenience, I'll introduce a notation to extract a new function with
domain $[0, 1]$ from any closed domain interval of an original function
$f$. Specifically, let $f \restrict [a, b]$ denote the function
with domain $[0,1]$ where

$$
\big(f \restrict [a,b]\big)(x) = f(a + (b-a)x).
$$

Let $f:\R\to\R$ be any function such that $f(x)=0$
outside of $[0, 3]$.
Define $r_L = f\restrict [0, 1]$ and $r_R = f\restrict [2,3]$; conceptually,
these are the left and right ramp functions.
Let $g = r_L + r_R$.

![An example showing how $r_L$, $r_R$, and $g$ are extracted from a
function $f$.](images/nonpl_setup.png){#fig:nonpl_setup}

I'll show that the shape of $g$ must dominate the landscape
of $f$ in order for it to be exactly self-replicating.

Now suppose that, in addition to having $f(x)=0$ outside of $[0,3]$, $f$ 
is also exactly self-replicating.
I'll use definition ([@eq:exact_defn]) to
provide functions $f_L$, $f_R$, and $f_S$ in terms of $f$, $s$, $t_1$, and
$t_2.$
Notice that

$$\big(f_S \restrict [2,3]\big) = \big(f_L + f_R \restrict [2, 3]\big) =
r_L + r_R = g.$$

Since $f_L(x) = f_S(t_1(x))$, and $t_1$ maps
$[1\tfrac{1}{3}, 1\tfrac{2}{3}]$ to $[2,3]$,
this means $(\,f=f_L \restrict [1\tfrac{1}{3}, 1\tfrac{2}{3}]) = g$.
Below, I'll show how repeated application of this kind of logic determines
the non-ramp values of $f$ almost everywhere; a boolean property
$P:\R\to\{\text{true},\text{false}\}$ is defined to be true
[*almost everywhere*](https://en.wikipedia.org/wiki/Almost_everywhere)
when the set $\{x : P(x) = \text{false}\}$ has measure
zero.

\newcommand{\zerotwo}{\big\{\!\raise1.5pt\hbox{$\genfrac{}{}{0pt}{}
{\lower1.8pt\hbox{$\smash{\scriptstyle 0}$}}
{\lower1pt\hbox{$\smash{\scriptstyle 2}$}}$}\!\big\}}

\newcommand{\lstar}{\overline{*}_3}

At this point it will be useful to begin using base-3 notation for the
intervals at hand. If $s$ is a finite string with digits from the set
$\{0, 1, 2\}$, then let $0.s\lstar$ denote the closure of the set of
points whose base-3 expansion begins with $0.s$. For example,
$0.11\lstar$ denotes the interval $[0.11_3, 0.12_3]$ while
$0.012\lstar$ denotes the interval $[0.12_3, 0.20_3]$.
I'll also use $\zerotwo$ to denote a digit that may be either a 0 or a 2;
for example, $0.1\zerotwo 1\lstar$ denotes the union of intervals
$[0.101_3, 0.102_3]$ and $[0.121_3, 0.122_3]$.

Now, instead of writing $(\,f \restrict [1\tfrac{1}{3}, 1\tfrac{2}{3}]) = g$,
I can write

$$\big(\,f \restrict 1 + 0.1\lstar\big) = g.$$ {#eq:nonpl_base_case}

It's possible to generalize this last equation so that it defines
$f$ almost everywhere on the interval $[1, 2]$.

Recall that the notation $1 + 0.\zerotwo^k1\lstar$ indicates a union of
closed intervals.
In the next theorem, the notation $(\,f \restrict \cup_i [a_i,b_i]) = g$
indicates
that, for every $i$ in the union, $(\,f \restrict [a_i,b_i]) = g$.

**Theorem 1** $\;$
*For any $k\ge 0$,
$$\big(\,f \restrict 1 + 0.\zerotwo^k1\lstar\big)=g.$$*

**Proof** $\;$
The proof is by induction on $k$. Equation ([@eq:nonpl_base_case])
provides the base case.

For the inductive step, suppose

$$\big(f=f_L \restrict 1 + 0.\zerotwo^k1\lstar \big) = g.$$

Then

$$\big(f_R \restrict 3 + 0.\zerotwo^k1\lstar \big) = g,$$

so that

$$\big(f_S \restrict \{1,3\} + 0.\zerotwo^k1\lstar \big) = g.$$

Applying $t_1$ to derive $f=f_L$ back from $f_S$, we can see that

$$\big(f \restrict 1 + 0.\zerotwo^{k+1}1\lstar \big) = g.$$

<p align="right">
\hfill$\Box$
</p>

Let $G_k = 1 + 0.\zerotwo^k1\lstar$.
[@Fig:nonpl_process] illustrates $G_k$ for low values of $k$.

![The inductive process in the proof of theorem 1. The top
line is the domain $[0,5]$ of $\,f_S$; the line below that is the
domain $[0,3]$ of $\,f$; then the subsets of $[1,2]$ on which $f$ is
described as the induction proceeds.](images/nonpl_process.png){#fig:nonpl_process}

If $x\in G_k$, then either $x=0.\zerotwo^k1\ldots$ or $x=0.\zerotwo^k2$.
Suppose $x_j\in G_j$ and $x_k\in G_k$, where $j < k$.
Then either the $(j+1)^\text{th}$ digit of $x_j$ is 1,
or the $(j+1)^\text{th}$ digit of $x_j$ is 2 and all subsequent
digits are 0. In either case, $x_j\ne x_k$ since the $(j+1)^\text{th}$
digit of $x_k$ can't be 1 and the $(k+1)^\text{th}$ digit of $x_k$ must be 1 or
2. Thus all of the $G_k$ sets are pairwise disjoint.

Because they're disjoint, we can find the total measure of the
set $G = \cup_k G_k$ as follows:

$$\mu(G) = \sum_{k \ge 0}\mu(G_k) = \sum_{k\ge 0}
\frac{1}{3}\left(\frac{2}{3}\right)^k = 1.$$

Since each $G_k\subset [1,2]$, this justifies the claim that theorem 1
characterizes $f$ almost everywhere in that interval.

What values may $f$ take on for the points $x\in (1,2) - G$?
The choice is still not arbitrary as the values remain related.
I'll explore this question next.

Given $x\in (1,2)$, there is some $k$ with $x\in G_k$ iff
the base-3 expansion of $x$ contains a 1 or if it ends with the tail
$\overline{0}$. This can be written somewhat
informally as

$$x\in (1,2) - G \quad\Leftrightarrow\quad x \in 1.\zerotwo^\infty_3 -\,
\bigcup_{k\ge 0} 1.\zerotwo^k\overline{0}_3.$$

From here on, I'll more formally use the word *expansion* — based on the idea of
the base-3 expansion of a number in $[0,1]$ — to indicate a function
$E:\mathbb{N}_{\ge 1}\to \{0, 1, 2\}$ which denotes the value $v(E) = \sum_{k\ge
1}E(k)/3^k.$
If $x=v(E)$, we may write $x = 0.E_3$ and think of $E$ as an infinite string
on the alphabet $\{0,1,2\}$.

Suppose that $f(x) = y$ for some $x\in (1,2)$.
Let $E$ be the expansion with $x=1.E_3$.
Then $f_S(x+\{0,2\}) = y$ and, by applying $t_1$,
$f(x') = y$ for both $x' = (x+2)/3$ and $x' = (x+4)/3$.
In expansion notation, we can write these last two
equations as $x' = x/3 + 2/3 = 0.1E_3 + 0.2_3 = 1.0E_3$ and
as $x' = x/3 + 4/3 = 0.1E_3 + 1.1_3 = 1.2E_3$.
We can summarize this reasoning as

$$f(1.\zerotwo E_3) = f(1.E_3).$$ {#eq:h_reln}

\newcommand{\tail}{\text{tail}}

We can expand on this idea to partition $(1,2) - G$ into subsets on which
$f$ must have the same value. To do that, it will be useful to define the
*tail* of an expansion as a way to capture end-of-string behavior.
More precisely, if $E$ is an expansion, then define $\tail(E)$ via

$$\tail(E) = \big\{\text{expansion }\eta \;\big|\;
\exists\, j, k: E(j + m) = \eta(k + m) \,\forall\, m \ge 0\big\}.$$

Intuitively, $\tail(E)$ is the set of all numbers in $[0, 1]$ with
the same final sequence of base-3 digits as $E$, ignoring any finite prefix
of either expansion.
For example, $x=0.21021\overline{011}_3$ and
$y=0.001\overline{011}_3$ have $\text{tail}(x) = \text{tail}(y)$.

The following theorem builds on equation ([@eq:h_reln]).

**Theorem 2** $\;$
*Suppose $x=1.E_3$ and $y=1.F_3$, where both expansions $E$ and $F$ 
exclude 1 from their range, which we could express as
$x,y\in 1.\zerotwo^\infty_3$. Then*

$$\tail(x) = \tail(y) \quad\Rightarrow\quad f(x) = f(y).$$

**Proof** $\;$
If $\tail(x) = \tail(y)$, then there exist integers $j, k$ such that

$$E(j+m)=F(k+m)\, \forall m\ge 0.$$ {#eq:thm2_pf}

Let $p_E$ be the length-$j$ prefix of $E$ and
    $p_F$ be the length-$k$ prefix of $F$, and choose the
expansions $E'$ and $F'$ so that

$$x = 1.E_3 = 1.p_EE'_3 \quad\text{ and }\quad y = 1.F_3 = 1.p_FF'_3.$$

By ([@eq:thm2_pf]), $E'=F'$. By repeated application of ([@eq:h_reln]),
$f(1.p_EE'_3) = f(1.E'_3)$ and $f(1.p_FF'_3) = f(1.F'_3)$. The final result
is that

$$f(x) = f(1.E'_3) = f(1.F'_3) = f(y).$$

<p align="right">
\hfill$\Box$
</p>

Although I haven't proven it yet,
it turns out that theorems 1 and 2 capture *all* of the restrictions needed for
$f$ to be exactly self-replicating.
We can see this by working with three functions:
$r_L : [0,1] \to \R$,
$r_R : [0,1] \to \R$, and
$h   : (1,2) - G \to \R$;
with the restriction that
$\tail(x) = \tail(y) \Rightarrow h(x) = h(y)$.
Theorem 1 allows us to build a function $f:[0,3]\to\R$ based on
$r_L,$ $r_R,$ and $h.$


TODO HERE Continue this reasoning in the other direction and summarize
          the aforementioned results (whatever are appropriate in a single
          theorem statement) as a theorem.

Suppose that $f(x) = y$ for some $x\in (1,2)$ and not in any set $G_k$.
Let $b$ be an expansion with $v(b) = x-1$.
Then $f_S(x+\{0,2\}) = y$ and, by applying $t_1$,
$f((x+\{2,4\})/3) = y$. The expansion of $(x+2)/3 - 1$ is

Now suppose that $f(x) = y$ for some point $x$ not in any set $G_k$.
Then $f_S(x') = y$ for both $x' = x$ and $x' = x + 2$.
Suppose $x'' \in (1, 2)$.
Since $f(x'') = f_S(t_1(x'')) = f_S(3x''-2)$, this means that
($3x''-2 = x' \Leftrightarrow x'' = (x'+2) / 3 = (x+\{2,4\})/3$)
$f()$


TODO the image for the above proof, and why it is almost everywhere;
     then the remaining cases and relation to Cantor dust.


TODO work up to this image

![An exactly self-replicating function $f$ completely determined by
$r_L(x) = \cos(2x)/2 + 1/4$,
$r_R(x) = r_L(1 - x)$, and the value $f(x) = r_L(0) + r_R(0)$ for all $x$ not
determined by $r_L$ and $r_R$.](images/nonplateau.png){#fig:nonplateau}

TODO Clarify the values of $s$, $t_1$, and $t_2$ in that caption.

---

This means that $(\,f_R \restrict 3 + 0.1\lstar) = g$, so that
$(\,f_S \restrict \{1,3\} + 0.1\lstar) = g$.
As above, use the map $t_1$ to conclude that
$(\,f_L \restrict 0.\zerotwo 1\lstar) = g$.



### All possible positive curves for the example $s,t_1,t_2$ parameters

Consider a general function $f(x)$ such that $f(x)=0$ except when
$x \in [0, 5]$. For convenience, I'll introduce the notation
$\alpha_{[0,1]}$ to denote the function 

$$\alpha_{[0,1]}(x) = \alpha(x) \cdot \big[ x\in [0,1] \big],$$

for any function $\alpha(x)$.
Using this notation, it will be useful to isolate the left and right ramps
$r_L(x) = f_{[0,1]}(x)$ and $r_R(x) = \big(f(x + 4)\big)_{[0,1]}$.




---



TODO finish from here; don't forget that $s$ can't be the identity function



### Begin other stuff to rewrite

I'll describe a sequence of functions which may help us find a self-replicating
function by starting with an arbitrary function.
The sequence depends on an initial function $f(x)$, a shift function $s(x)$ that
captures the relationship between the left and right addends, and
transformation functions $t_1(x)$ and $t_2(x)$ that formalize the similarity
between the addends and their sum.

Given these functions, we can define

$$\begin{array}{rcl}
  f_L(x) & = & f(x), \\
  f_R(x) & = & f(s(x)), \text{and} \\
  f_S(x) & = & f_L(x) + f_R(x), \\
\end{array}$$

with the expectation that

$$f_L(x) = t_2(f_S(t_1(x))).$$

This setup supports the possibility that $f_L$ and $f_R$ are possibly-reflected
shifts of each other,
and requires $f_S$ can be transformed to recover exactly $f_L$.
This is one possible way to formalize the definition of a self-replicating
function.

It can also be used to set up a sequence of functions via the following
definitions:

$$\begin{array}{rcl}
  f^{(1)}_L & = & f(x), \\
  f^{(i)}_R & = & f^{(i)}_L \\
  f^{(i+1)}_S = f^{(i)}_L + f^{(i)}_R \\
\end{array}$$

TODO finish the above




# The normal curve

The normal curve is described by
$y = e^{-x^2/2}$.

![The normal curve: $y=e^{-x^2/2}$.](images/normal3.png)


# Leaf-point distributions of *L*-systems


# Fractal functions

This section is for functions similar to the Cantor diagonal.
It may turn out that I can't find any functions that fit here, or that the
*L*-systems distributions includes this case, or even that I can prove that no
functions could exist here (as far as I know).

TODO Add a note somewhere that the initial setup requires that the sum itself is
     always the translation of an even function.


# Temporary example content

**Lemma 1**\ 
*Content of lemma 1, including some $\pi+3$ mathy bits.*

## Subheader

Content

See my notes on Raney's lemmas for more examples.

Here is a reference [@concrete].




# Questions

* The ellipse around my first *L*-system appears to fit surprisingly well.
  Is there a nice way to discover when an ellipse and an *L*-system may fit like
  this? Is there, perhaps, a series of shapes which converge on the system or
  its leaf points, analogous to
  [Mandelbrot set
  lemniscates](http://mathworld.wolfram.com/MandelbrotSetLemniscate.html)?
* The histogram around my first *L*-system appears simple in shape. Can its
  shape be described precisely?
* The sigmoid $\sigma(x)=1/(1+e^{-x})$ provides a near-self-replicating split of
  $e^{-x^2}$. Is there a function $f(x)$ such that $\sigma(x)$ provides an
  *exact* self-replicating split? More than one? In general, given any sigmoid
  $s(x)$, what is the set of functions which it splits exactly in this way?
  For this question, we can have some precise requirement for a sigmoid, such as
  being an appropriately scaled and translated odd function.
* Are there variants of self-replicating functions that work for other sets of
  operations such as using more than two copies of the function in a sum, or by
  using multiplication or some other operation instead of addition?

# References

