% Notes on Richard Stanley's Enumerative Combinatorics
% Tyler Neylon
% 201.2016

These are somewhat informal notes I'm taking as I read through the book
*Enumerative Combinatorics, Volume 1* by Richard P. Stanley [@stanley].


# Notes on chapter 1

On page 19, we find the following proposition, which I quote directly:

**Proposition 1.3.4**
Let $x$ be an indeterminate, and fix $n\ge 0$. Then

$$\sum_{k=0}^n c(n,k) x^k = x(x + 1)(x + 2)\cdots (x + n - 1).$$

---

Three proofs are supplied for this proposition. I think the second proof is not
clearly written, so I'm going to dive into it a bit here.

**Clarified second proof of proposition 1.3.4**

Stanley defines $F_n(x) := x(x + 1)(x + 2)\cdots (x + n - 1)$, which I'll write
as $x^\overline{n}$ following Knuth's notation in *Concrete Mathematics*
[@concrete].
In $x^\overline{n}$, the coefficient of $x^{n-m}$ is

$$ \sum_{I \in \left\{{[n-1]\atop m}\right\}} \Pi_{j\in I}\;j. $$

In other words, it's the sum of all products of $m-$sets from $[n-1]$.
The claim of proposition 1.3.4 is that this is identical to the value
$c(n,n-m)$.

We'll proceed by describing a procedure that results in an $n-$permutation with
exactly $k=n-m$ cycles. Each different way of carrying out this procedure
results in
a different permutation, and every $k-$cycle permutation is produced by this
procedure. In other words, there are exactly $c(n, k)$ ways to carry out this
procedure.

This is the procedure: We'll begin with the string $s_0 = 1, 2, \ldots, n$ and
move one item at a time around in the string until we arrive at a target string.
We can think of each string as the standard order of a permutation's cycle
notation. This is the string-permutation correspondence mentioned in Stanley's
proposition 1.3.1. The procedure has two parameters: a set $I \subset [n-1]$ of
size $|I| = m$, and a function $g:I\to [n-1]$ satisfying $g(i) \le n - i$.
Sort $I$ so that $I = i_1 > i_2 > \ldots > i_m$.
Then at the $j^\text{th}$ step, remove $i_j$ from string $s_{j-1}$ and move it
$g(i_j)$ items to the right, resulting in string $s_j$. At the end of step $m$,
we'll have the final string $s_m$.

Our first job is to show that this process provides a bijection between its
parameters $(I, g)$ and the set of all $k-$cycles.


% TODO HERE Cover the process of moving items from the default string to the
% right, and how each step corresponds with a join or insert. Talk about how
% every k-cycle permutation can be reached this way, and how every such process
% results in a k-cycle permutation; clarify that this is a bijection.
% Now we just have to show that the counts agree. I suppose finally we could try
% to elucidate the connection with what Stanley wrote.


# References

