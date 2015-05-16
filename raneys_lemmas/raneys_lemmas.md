% Notes on Raney's Lemmas
% Tyler Neylon
% 251.2015

In a 1960 paper, George Raney proved
the first two lemmas below; the lemmas suppose we have a
finite sequence of numbers meeting certain constraints, and
provide the number of cycle shifts that contain
all-positive partial sums [@raney].

These notes expand on the ideas behind these lemmas.
The final section of these notes discusses cyclic shifts for
finite sequences of independent, uniformly random
values; as far as I know, the work in that section is new.

I personally learned of these lemmas in chapter 7 of
the book *Concrete Mathematics* [@concrete],
which explores their applications to generating functions.
The presentation of the lemmas here is based on the
presentation in *Concrete Mathematics* rather than on
Raney's original paper.

# Exact values for finite integer sequences

**Lemma 1**\ 
*Suppose $\sum_{i=1}^n x_i = 1$, where all $x_i\in\mathbb{Z}$.
Extend the sequence by letting $x_{n+p}=x_p$ for $1\le p\le n$.
Then there is a unique $j$, $1 \le j \le n$, such that*

$$\sum_{i=j}^{j+k-1} x_i > 0; \quad 1 \le k \le n.$$

---

Intuitively, we can think of such an index $j$ as a cyclic shift
of the sequence that has partial sums that are all positive.

For example, the finite sequence
$\langle x_1, \ldots, x_5\rangle = \langle 3, -2, 4, -1, 1 \rangle$
offers $j=5$ as the unique shift providing
$\langle x_5, x_6=x_1, \ldots, x_9=x_4\rangle = \langle 1, 3, -2, 4, -5\rangle$
with partial sums
$\langle 1, 4, 2, 6, 1\rangle$ that are all positive.

**Definitions**\ 
Given a sequence $\langle x_1, \ldots, x_n\rangle$, it's useful to say that
an index $i \in \{1,\ldots, n\}$ is a *positive-sum shift* if and only if
the partial sums of $\langle x_i, \ldots, x_n, x_1, \ldots, x_{i-1}\rangle$
are all positive. Since these notes focus on finite sequences, we'll
implicitly use arbitrary indexes $x_j, j\in\mathbb{Z}$, to refer to
$x_k$ with $k\in \{1, \ldots, n\}, k\equiv j \pmod n$.

We'll use the subscript-free letter $x$ to denote an entire finite sequence
$\langle x_1, \ldots, x_n\rangle$. We'll write $\sigma(x)$ to indicate the
number of indexes of $x$ that are positive-sum shifts.

We can now concisely state a related result proved by Raney:

**Lemma 2**\ 
*Suppose $\sum_{i=1}^nx_i=\ell$, where $x_i\in\mathbb{Z}$ and
$x_i \le 1$ for all $i$.
Then $\sigma(x) = \ell$; that is,
exactly $\ell$ indexes in $\{1, \ldots, n\}$ are
positive-sum shifts.*

---

For example, let $\langle x_1, \ldots, x_8\rangle =
\langle -2, 1, 1, 0, -1, 1, 1, 1\rangle$. Then
$\sum x_i = 2$, and $x_2, x_6$ are the only
positive-sum shifts:

 shift | partial sums
-------|----------------
$\langle x_2, \ldots\rangle = \langle 1, 1, 0, -1, 1, 1, 1, -2\rangle\quad$ | $\langle 1, 2, 2, 1, 2, 3, 4, 2\rangle$
$\langle x_6, \ldots\rangle = \langle 1, 1, 1, -2, 1, 1, 0, -1\rangle\quad$ | $\langle 1, 2, 3, 1, 2, 3, 3, 2\rangle$

Note that lemma 2 is not a strict generalization of lemma 1 as it adds the
condition $x_i \le 1$. This condition is necessary for lemma 2;
without it we may have, for example, the one-element sequence
$x = \langle 2\rangle$ with sum $\ell = 2$ and $\sigma(x) = 1$.

Rather than proving the above two lemmas directly, we'll jump to the
general case of real sequences $x$ and prove strictly more general bounds
on $\sigma(x)$ in that context.

# Bounds for real finite sequences

We start with a general guarantee that
$\sum x_i > 0 \Rightarrow \sigma(x) \ge 1$.
In the context of a sequence $x$,
it will be useful to write $s_i$ to denote the
$i^\mathrm{th}$ partial sum of $x$; that is,
$$ s_i = \sum_{j=1}^i x_j. $$

**Property 3**\ 
*Suppose $\sum_{i=1}^nx_i > 0$, where $x_i\in\mathbb{R}$.
Let $s_i$ denote the $i^\mathrm{th}$ partial sum of $x$, and
let $j$ be the largest index in $\{1, \ldots, n\}$ with $s_j = \min_i s_i$.
Then $j$ is a positive-sum shift.*

---

**Proof**\ 
Let $y=\sum x_i > 0$, and
let
$$s'_i = \sum_{k=j}^{j+i-1}x_k$$
denote the $i^\mathrm{th}$ partial sum of the shifted sequence
$\langle x_j, x_{j+1}, \ldots \rangle$.
Then, for $1 \le i \le n$,
$$s'_i = s_{j+i-1} - s_{j-1}
\begin{cases}
> 0 \text{ (by definition of $j$)} & \text{when } j+i-1 \le n \\
= s_{j+i-1-n}-s_{j-1}+y \ge 0 + y > 0 & \text{when } j+i-1 > n. \\
\end{cases}$$


# Finite sequences with uniformly random values

Add more content here.

# References

