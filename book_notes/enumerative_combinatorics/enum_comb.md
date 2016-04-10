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

Stanley defines $F_n(x) := x(x + 1)(x + 2)\cdots (x + n - 1)$, which I'll write
as $x^\overline{n}$ following Knuth's notation in *Concrete Mathematics*
[@concrete].
In $x^\overline{n}$, the coefficient of $x^{n-i}$ is

$$ \sum_{I \in \left\{{[n-1]\atop i}\right\}} \Pi_{j\in I}\;j. $$

In other words, it's the sum of all products of $i-$sets from $[n-1]$.
The claim of proposition 1.3.4 is that this is identical to the value
$c(n,n-i)$.

% TODO HERE Cover the process of moving items from the default string to the
% right, and how each step corresponds with a join or insert. Talk about how
% every k-cycle permutation can be reached this way, and how every such process
% results in a k-cycle permutation; clarify that this is a bijection.
% Now we just have to show that the counts agree. I suppose finally we could try
% to elucidate the connection with what Stanley wrote.


# References

