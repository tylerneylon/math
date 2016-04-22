% Self-Replicating Functions
% Tyler Neylon
% 204.2016

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

# Motivation

I became interested in self-replicating functions by working on algorithms to
procedurally generate 3d models of natural-looking trees. When algorithmically
making trees, it makes sense to start from the idea of an
[*L-system*](https://en.wikipedia.org/wiki/L-system), which can
be visualized as a kind of fractal in which a trunk forks into branches that
fork into smaller subranches, this process repeating infinitely.

I noticed that tree-like *L*-systems can have a large amount of
"branch overlap" concentrated around a central area of their apparent surface.
For example, consider the two images below. On the left is a standard
*L*-system along with a histogram showing the density of leaf points along the
edge. Intuitively, the leaf points achieve a reasonable density even toward the
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
outer ellipse.](images/ellsystem2.png)

One approach to smoothing out the distribution of leaf points would be to
compromise the fractal-like nature of the system by choosing each line direction
based on where it is within the fractal, rather than simply by making each
branching point a smaller version of its parent.
The line directions can be chosen so that
the set of points at a fixed distance from the trunk point
form a set of equidistant angles from a central point.
The result is an extremely
regular edge, as seen below.

![A *L*-like system in which line directions are chosen to maximize the
regularity of leaf point distribution.](images/well_distributed_ell_like_system.png)

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

which is good enough for me to somewhat subjectively say that they strongly
resemble shifts of $f$.

However, the original motivation for self-replicating functions is based on
distribution functions, so the rest of this note focuses on functions $f$
for which $\lim_{x\to\pm\infty}f(x) = 0$.

Another simple approach would be to set $g_1 = g_2 = \frac{1}{2}f$ for
any function $f$. This is not very interesting, and the word *shift* in the
informal definition of a self-replicating function is intended to defeat this
trivial case. That is, each $g_i$ is expected to be similar to a translation of
$f$, such as $f(x-1)$ or $f(x+1)$.

TODO In the paragraph below, add citation of proper reference for the $[P(x)]$
notation.

A very simple function that meets all our requirements so far is the indicator
function of an interval.
Given a boolean property $P(x)$ of $x$, I'll use Knuth's notation
$[P(x)]$ to denote the $\{0,1\}-$valued function of $x$ with value 1 iff
$P(x)$ is true. Using this, we can denote a function with value 1 on
half-open interval $[a,b)$, and 0 elsewhere, as

$$f_{[a, b)}(x) = \big[x\in[a, b)\big].$$

Then

$$f_{[0,1)} = g_{[0,1/2)} + g_{[1/2,1)}.$$

TODO Add an image here giving a graphical equation.

We can consider the above $g-$functions as horizontally scaled versions of the
original. It's not clear that they're "shifts," but this kind of flexibility is
the reason the definition of a self-replicating function is informal.


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

# References

