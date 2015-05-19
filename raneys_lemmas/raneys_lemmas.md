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

# Integer sequences

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

# Real sequences

We start with a general guarantee that
$\sum x_i > 0 \Rightarrow \sigma(x) \ge 1$.
In the context of a sequence $x$,
it will be useful to write $s_i$ to denote the
$i^\mathrm{th}$ partial sum of $x$; that is, $s_0 = 0$, and
$$ s_i = \sum_{j=1}^i x_j, \quad \text{for } i \ge 1. $$
We can define $s_i$ for $i > n$ using the implicitly
periodic sequence characterized by $x_{n + i} = x_i$.

**Property 3**\ 
*Suppose $\sum_{i=1}^nx_i > 0$, where $x_i\in\mathbb{R}$.
Let $s_i$ denote the $i^\mathrm{th}$ partial sum of $x$, and
let $j$ be the largest index in $\{1, \ldots, n\}$ with $s_{j-1} = \min_{0\le i < n} s_i$.
Then $j$ is a positive-sum shift.*

---

**Proof**\ 
Let
$$s'_i = \sum_{k=j}^{j+i-1}x_k$$
denote the $i^\mathrm{th}$ partial sum of the shifted sequence
$\langle x_j, \ldots, x_{j+n-1}\rangle$.
Then, for $1 \le i \le n$,
$$s'_i = s_{j+i-1} - s_{j-1}
\begin{cases}
> 0 \text{ (by definition of $j$)} & \text{when } j+i-1 < n \\
= s_n + s_{j+i-1-n}-s_{j-1} \ge s_n > 0 & \text{when } j+i-1 \ge n. \\
\end{cases}$$
$\Box$

Now we can assume without loss of generality that any sequence of
real numbers $\langle x_1, \ldots, x_n\rangle$ with $\sum x_i > 0$
is already shifted
so that all its partial sums $s_i > 0$ for $i > 0$.
This allows us to provide a nice general expression for $\sigma(x)$.

**Property 4**\ 
*Suppose that $x$ is a finite real sequence with $i^\text{th}$ partial sum
$s_i$, and that $s_i > 0$ for all $i > 0$. Then*

$$\sigma(x) = \#\left\{\min_{j \le i \le n} s_i\; \big|\; 1 \le j \le n \right\}.$$ {#eq:prop4pt1}

*More specifically, an index $j$ with $1 \le j \le n$ is a positive-sum shift iff*

$$s_{j-1} < s_i \;\forall i: j\le i \le n.$$ {#eq:prop4pt2}

---

**Proof**\ 
We'll start by supposing we have an index $j$ with $1 \le j \le n$ and
$s_{j-1} < s_i$ for all $i$ with $j \le i \le n$; our goal is to show that such
a $j$ must be a positive-sum shift. Our approach will be similar to the proof of
property 3.

Let $s'_i$ denote the $i^\text{th}$ partial sum of $\langle x_j, \ldots, x_{j+n-1}\rangle$:
$$s'_i = \sum_{k=j}^{j+i-1}x_k.$$
Then
$$s'_i = s_{j+i-1} - s_{j-1} \begin{cases}
> 0 & \text{if } j+i-1 \le n, \\
= s_{j+i-1-n} + s_n - s_{j-1} & \text{if } j+i-1 > n; \\
\end{cases}$$
the last inequality follows since $s_{j+i-1-n} > 0$ and $s_n > s_{j-1}$.

On the other hand, if $s_{j-1}\ge s_i$ for some $i,j$ with $1\le j\le i\le n$, then
$s'_{i-j+1}=s_i-s_{j-1}\le 0$, so that $j$ isn't a positive-sum shift.
This completes the proof of the last part of the property.

Let's see that condition (@eq:prop4pt2) corresponds with our equation ([@eq:prop4pt1])
for $\sigma(x)$.
Let $m_x = \{\min_{j \le i \le n} s_i\; \big|\; 1 \le j \le n\}$.

Suppose $t\in m_x$. If $t \neq s_n$, then there's a corresponding largest index $j$
with $1 \le j \le n$ and $s_{j-1}=t$ that meets condition (@eq:prop4pt2).
If $t = s_n$, then we can think of this is corresponding to $j=n+1$, which is
effectively the null shift, meaning that $x_1$ remains the first element.
Any $j>1$ meeting condition (@eq:prop4pt2) has its value $s_{j-1}\in m_x$ by
definition; the value $j=1$ can be seen as corresponding to the value $s_n\in m_x$
as before.
In other words, the set $m_x$ contains exactly the values $s_{j-1}$ for each
positive-sum shift $j$, with $j=1$ replaced by the value $j=n+1$ that effectively
provides the same shift. Condition (@eq:prop4pt2) guarantees that these values
$s_{j-1}$ are distinct.
$\Box$

(Next: note why the specifically case matches the $\sigma(x)$ value; proof; example
illustration for intuition)

# Random sequences

Add more content here.

# References

