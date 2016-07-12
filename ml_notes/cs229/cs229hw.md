% CS 229 Homework
% Tyler Neylon
% 345.2016

\newcommand{\R}{\mathbb{R}}
\newcommand{\eqnset}[1]{\left.\mbox{$#1$}\quad\quad\right\rbrace}
\newcommand{\tr}{\text{tr}\;}
\renewcommand{\th}{\theta}
\newcommand{\toi}{^{(i)}}

These are solutions to the most recent problems posted for Stanford's
CS 229 course, as of June 2016. I'm not sure if this course re-uses old
problems, but please don't copy the answers if so.
This document is also available as a
[pdf](http://tylerneylon.com/notes/cs229/cs229hw.pdf).

# Problem set 1

## Logistic regression

### Part (a)

The problem is to compute the Hessian matrix $H$ for the function

$$J(\th) = -\frac{1}{m}\sum_{i=1}^m\log(g(y\toi x\toi)),$$

where $g(z)$ is the logistic function,
and to show that $H$ is positive semi-definite; specifically, that
$z^THz\ge 0$ for any vector $z.$

We'll use the fact that $g'(z) = g(z)(1-g(z)).$
We'll also note that since all relevant operations are linear, it will suffice
to ignore the summation over $i$ in the definition of $J.$
I'll use the notation $\partial_j$ for $\frac{\partial}{\partial\th_j},$
and introduce $t$ for $y\th^Tx.$
Then

$$-\partial_j(mJ) = \frac{g(t)(1-g(t))}{g(t)}x_jy = x_jy(1-g(t)).$$

Next

$$-\partial_k\partial_j(mJ) = x_jy\big(-g(t)(1-g(t))\big)x_ky,$$

so that

$$\partial_{jk}(mJ) = x_jx_ky^2\alpha,$$

where $\alpha = g(t)(1-g(t)) > 0.$

Thus we can use repeated-index summation notation to arrive at

$$z^THz = z_ih_{ij}z_j = (\alpha y^2)(z_ix_ix_jz_j)
        = (\alpha y^2)(x^Tz)^2 \ge 0.$$

This completes this part of the problem.

### Part (b)

Here is a matlab script to solve this part of the problem:

~~~
% problem1_1b.m
%
% Run Newton's method on a given cost function for a logistic
% regression setup.
%

printf('Running problem1_1b.m\n');

% Be able to compute J.
function val = J(Z, theta)
  [m, _] = size(Z);
  g      = 1 ./ (1 + exp(Z * theta));
  val    = -sum(log(g)) / m;
end

% Setup.
X      = load('logistic_x.txt');
[m, n] = size(X);
X      = [ones(m, 1) X];
Y      = load('logistic_y.txt');
Z      = diag(Y) * X;

% Initialize the parameters to learn.
old_theta =  ones(n + 1, 1);
theta     = zeros(n + 1, 1);
i         = 1;  % i = iteration number.

% Perform Newton's method.
while norm(old_theta - theta) > 1e-5
  printf('J = %g\n', J(Z, theta));
  printf('theta:\n');
  disp(theta);
  printf('Running iteration %d\n', i);

  g         = 1 ./ (1 + exp(Z * theta));
  f         = (1 - g);
  alpha     = f .* g;
  A         = diag(alpha);
  H         = Z' * A * Z / m;
  nabla     = Z' * f / m;
  old_theta = theta;
  theta     = theta - inv(H) *  nabla;

  i++;
end

% Show and save output.
printf('Final theta:\n');
disp(theta);
save('theta.mat', 'theta');
~~~

Because I have copious free time, I also wrote a Python
version. Also because I'm learning numpy and would prefer to
consistently use a language that I know can produce decent-looking
graphs. Here is the Python script:

~~~
#!/usr/bin/env python

import numpy as np
from numpy import linalg as la


# Define the J function.
def J(Z, theta):
  m, _ = Z.shape
  g    = 1 / (1 + np.exp(Z.dot(theta)))
  return -sum(np.log(g)) / m

# Load data.
X    = np.loadtxt('logistic_x.txt')
m, n = X.shape
X    = np.insert(X, 0, 1, axis=1)  # Prefix an all-1 column.
Y    = np.loadtxt('logistic_y.txt')
Z    = np.diag(Y).dot(X);

# Initialize the learning parameters.
old_theta = np.ones((n + 1,))
theta     = np.zeros((n + 1,))
i         = 1

# Perform Newton's method.
while np.linalg.norm(old_theta - theta) > 1e-5:

  # Print progress.
  print('J = {}'.format(J(Z, theta)))
  print('theta = {}'.format(theta))
  print('Running iteration {}'.format(i))

  # Update theta.
  g         = 1 / (1 + np.exp(Z.dot(theta)))
  f         = 1 - g
  alpha     = (f * g).flatten()
  H         = (Z.T * alpha).dot(Z) / m
  nabla     = Z.T.dot(f) / m
  old_theta = theta
  theta     = theta - la.inv(H).dot(nabla)

  # Update i = the iteration counter.
  i += 1

# Print and save the final value.
print('Final theta = {}'.format(theta))
np.savetxt('theta.txt', theta)
~~~

The final value of $\th$ that I arrived at is

$$\th = (2.62051, -0.76037, -1.17195).$$

The first value $\th_0$ represents the constant term, so that the final model is
given by

$$y = g(2.62 - 0.76x_1 - 1.17x_2).$$

### Part (c)

![The data points given for problem 1.1 along with the
decision boundary learned by logistic regression as
executed by Newton's method.](images/pr1_1c.png)

## Poisson regression and the exponential family

### Part (a)

Write the Poisson distribution as an exponential family:

$$p(y;\eta) = b(y)\exp\big(\eta^T T(y) - a(\eta)\big),$$

where

$$p(y;\lambda) = \frac{e^{-\lambda}\lambda^y}{y!}.$$

This can be done via

$$\begin{array}{rcl}
\eta & = & \log(\lambda), \\
a(\eta) & = & e^\eta = \lambda, \\
b(y) & = & 1/y!, \text{ and} \\
T(y) & = & y.
\end{array}$$

### Part (b)

As is usual with generalized linear models, we'll let
$\eta = \th^Tx.$
The canonical response function is then given by

$$g(\eta) = E[y;\eta] = \lambda = e^\eta = e^{\th^Tx}.$$

### Part (c)

Based on the last part, I'll define the hypothesis function
$h$ via $h(x) = e^{\th^Tx}.$

For a single data point $(x, y),$
let $\ell(\th) = \log(p(y|x)) =$ $\log(\frac{1}{y!}) + (y\th^T x-e^{\th^Tx}).$
Then

$$\frac{\partial}{\partial\th_j}\ell(\th) = yx_j - x_je^{\th^Tx}
= x_j(y-e^{\th^Tx}).$$

So stochastic gradient ascent for a single point $(x, y)$ would use
the update rule

$$\th := \th + \alpha x(y - h(x)).$$

### Part (d)

In section 1.10 of my notes — the section on generalized linear models — I
derived the update rule:

$$\th := \th + \alpha\big(T(y)-a'(\th^Tx)\big)x.$$

The missing piece is to proof that
$h(x) = E[y] = a'(\eta),$ which we'll do next.
We'll work in the context of $T(y)=y,$ as given by the problem statement.
Notice that, for any $\eta,$

$$\int p(y)dy = \int b(y)\exp(\eta^Ty - a(\eta))dy = 1.$$

Since this identity is true for all values of $\eta,$ we can take
$\frac{\partial}{\partial\eta}$ of it to arrive at the value 0:

$$\begin{array}{rcl}
 0 & = & \frac{\partial}{\partial\eta}\int p(y)dy \\
   & = & \int \frac{\partial}{\partial\eta} b(y)\exp(\eta^Ty - a(\eta))dy \\
   & = & \int b(y)(y - a'(\eta))\exp(\eta^Ty - a(\eta)) dy \\
   & = & \int y p(y)dy - a'(\eta)\int p(y)dy \\
   & = & E[y] - a'(\eta).
\end{array}$$

Thus we can conclude that $E[y] = a'(\eta) = a'(\th^Tx),$ which completes
the solution.

## Gaussian discriminant analysis

### Part (a)

This problem is to show that a two-class GDA solution effectively provides a
model that takes the form of a logistic function, similar to logistic
regression.
This is something I already did in
section 2.1 of [my notes](http://tylerneylon.com/notes/cs229/cs229.html).

### Parts (b) and (c)

These parts ask to derive the maximum likelihood estimates of
$\phi,$ $\mu_0,$ $\mu_1,$ and $\Sigma$ for GDA. Part (b) is a special case of
part (c), so I'll just do part (c).

**Some lemmas**

It will be useful to know a couple vector- and matrix-oriented calculus facts
which I'll briefly derive here.

First I'll show that, given column vectors $a$ and $b,$ and symmetric matrix
$C,$

$$\nabla_b [ (a-b)^T C (a-b) ] = -2C(a-b).$$ {#eq:nabla_b}

We can derive this by looking at the $k^\text{th}$ coordinate of the gradient.
Let $x = (a-b)^T C (a-b).$ Then, using repeated index summation notation,

$$\begin{array}{crcl}
& x & = & (a_i - b_i)c_{ij}(a_j-b_j) \\
\Rightarrow & [\nabla_b]_k x & = & -c_{kj}(a_j - b_j) - (a_i - b_i)c_{ik} \\
 & & = & -2C(a-b). \\
\end{array}$$

Next I'll show that

$$\frac{\partial}{\partial C}(a-b)^T C (a-b) = (a-b)(a-b)^T.$$ {#eq:partial_C}

This follows since

$$(a-b)^T C (a-b) = (a_i - b_i) c_{ij} (a_j - b_j),$$

so that

$$\frac{\partial}{\partial c_{ij}} (a-b)^T C (a-b)
= (a_i - b_i)(a_j - b_j).$$

In other words, the $ij^\text{th}$ entry of the matrix derivative is exactly
the $ij^\text{th}$ entry of the matrix $(a-b)(a-b)^T.$

Finally, I'll mention that, when a matrix $A$ is invertibe,

$$\frac{d}{dA} |A| = |A|\,A^{-T}.$$ {#eq:deriv_of_det}

This can be seen by considering that the $ij^\text{th}$ entry of $A^{-1}$
can be written as

$$(A^{-1})_{ij} = ((-1)^{i+j}M_{ji})/|A|,$$ {#eq:inv_eqn}

where $M_{ij}$ denotes the determinant of the minor of $A$ achieved by removing
the $i^\text{th}$ row and $j^\text{th}$ column. Next, consider the expression
for $A$ as a sum of products $\sigma(\pi)\prod a_{i\pi(i)}$ over all
permutations $\pi:[n]\to[n]$ where $\sigma(\pi)$ is the sign of permutation
$\pi$
([reference](https://en.wikipedia.org/wiki/Determinant#n_.C3.97_n_matrices)).
Based on that definition of a determinant, it can be derived that

$$\frac{\partial}{\partial a_{ij}}|A| = (-1)^{i+j}M_{ij}.$$

Combine this last result with ([@eq:inv_eqn]) to arrive at
([@eq:deriv_of_det]).

**The solution**

We're now ready to derive the equations for the GDA parameters based on
maximum likelihood estimation.

The log likelihood function is

$$\ell = \sum_i \log(p(x|y)) + \log(p(y)).$$

$\phi$

\newcommand{\pd}[1]{\frac{\partial}{\partial #1}}

In this section I'll start to use the notation $[\textsf{Pred}(x)]$ for
the indicator function of a boolean predicate $\textsf{Pred}(x):$

$$[\textsf{Pred}(x)] := \begin{cases}
1 & \text{if }\textsf{Pred}(x)\text{ is true, and} \\
0 & \text{otherwise.} \\
\end{cases}$$

This is the notation that Knuth uses, and I prefer it to Ng's notation
$1\{\textsf{Pred}(x)\}.$

Treating $p(y)$ as $\phi^y(1-\phi)^{1-y},$
set $\pd{\phi}$ of $\ell$ to 0; the result is

$$\sum_i\pd\phi\big(y\log\phi + (1-y)\log(1-\phi)\big)
= \sum_i \frac{y}{\phi} - \frac{1-y}{1-\phi} = 0$$

$$\Rightarrow\quad \sum_i y(1-\phi) - (1-y)\phi = 0$$

$$\Rightarrow\quad m_1 - m_1\phi = m_0\phi,$$

where $m_j = \sum_i [y\toi = j],$ and I'm treating the possible $y$ values
as 0 or 1.
Then

$$m_1 = \phi(m_0 + m_1) \;\Rightarrow\; \phi = \frac{m_1}{m},$$

using that $m = m_0 + m_1.$

$\mu_j$

\newcommand{\Sinv}{\Sigma^{-1}}

$$\pd{\mu_j}\ell = \pd{\mu_j}\sum_{y=j}-\frac{1}{2}(x-\mu_j)^T\Sinv(x-\mu_j)$$

We can use ([@eq:nabla_b]) to see that this is the same as

$$\sum_{y=j} \Sinv(x-\mu_j).$$ 

Setting $\pd{\mu_j}\ell = 0,$ and noticing that
$\Sinv$ must be nonsingular as it's an inverse, we get

$$\sum_{y=j} x = \sum_{y=j} \mu_j,$$

resulting in

$$
\sum_{y=j} x = m_j \mu_j \quad \Rightarrow \quad
\mu_j = \frac{1}{m_j}\sum_{y=j}x
.$$

$\Sigma$

To get an equation for $\Sigma,$ we'll actually maximize $\ell$ with respect
to its inverse $\Sinv.$ This works because there is a bijection between all
possible values of $\Sinv$ and of $\Sigma$ under the constraint that
$\Sigma$ is invertible, which is required for GDA to make sense.
Thus the value of $\Sinv$ which maximizes $\ell$ uniquely identifies the value
of $\Sigma$ which maximizes $\ell.$

$$\pd{\Sinv}\ell = \sum_i\pd\Sinv\left(C + \frac{1}{2}\log |\Sinv| -
\frac{1}{2}(x-\mu_y)^T\Sinv(x-\mu_y)\right).$$

Use ([@eq:partial_C]) to see that this is the same as

$$\sum_i \frac{|\Sinv|\Sigma^T}{|\Sinv|} - \frac{1}{2}(x-\mu_y)(x-\mu_y)^T.$$

Set this value to 0 to arrive at

$$\sum_i \Sigma^T = \sum_i (x-\mu_y)(x-\mu_y)^T
\quad\Rightarrow\quad
\Sigma^T = \frac{1}{m}\sum_i (x-\mu_y)(x-\mu_y)^T.$$

Since the expression on the right must give a symmetric matrix, this same
expression also gives the value for $\Sigma$ itself.

## Linear invariance of optimization algorithms

### Part (a)

This problem is to show that Newton's method is invariant to
linear reparametrizations.

Specifically, suppose $x^{(0)} = z^{(0)} = 0,$ that matrix $A$ is invertible,
and that $g(z) = f(Az).$ Our goal is to show that if the sequence
$x^{(1)}, x^{(2)}, \ldots$ results from Newton's method applied to $f$,
then the corresponding sequence $z^{(1)}, z^{(2)}, \ldots$ resulting from
Newton's method applied to $g$ obeys the equation $x^{(i)} = Az^{(i)}$ for all
$i,$ so that the two versions of Newton's method are in a sense doing the
exact same work.
We'll think of $f$ consistently as a function of $x,$ and $g$ as a function
of $z.$

\newcommand{\pdd}[2]{\frac{\partial #1}{\partial #2}}

Start with

$$\big[\nabla_z g\big]_i = \pdd{f}{z_i} = \pdd{f}{x_j}\pdd{x_j}{z_i}
= \pdd{f}{x_j}a_{ji},$$

from which it follows that

$$\nabla g = A^T\nabla f.$$

Next, introduce the variables $H$ as the Hessian of $f,$ and
$P$ as the Hessian of $g.$
Then

$$
\begin{aligned}
p_{ij} & = \pd{z_i}\pdd{f}{z_j} = \pd{z_i}\left(\pdd{f}{x_k}a_{kj}\right)
= \left(\pd{z_i}\pdd{f}{x_k}\right)a_{kj} \\
& = \left(\pd{x_\ell}\pdd{x_\ell}{z_i}\pdd{f}{x_k}\right)a_{kj}
= \left(a_{\ell i}\frac{\partial^2f}{\partial x_\ell\partial x_k}\right)a_{kj}
= a_{\ell i}h_{\ell k}a_{kj}.
\end{aligned}
$$

We can summarize this as

$$P = A^T H A.$$

Newton's method in this context can be expressed by the two equations

$$\begin{aligned}
x^{(i+1)} & = x^{(i)} - H^{-1}(x^{(i)}) \nabla f(x^{(i)}), \text{ and} \\
z^{(i+1)} & = z^{(i)} - P^{-1}(z^{(i)}) \nabla g(z^{(i)}) \\
          & = z^{(i)} - (A^THA)^{-1}(x^{(i)}) A^T\nabla f(x^{(i)}). \\
\end{aligned}$$

We'll show by induction on $i$ that $x^{(i)} = Az^{(i)}$ for all $i.$
The base case for $i=0$ is true by definition.
For the inductive step, assume that $x^{(i)} = Az^{(i)},$ and
use the above equations to see that

$$\begin{aligned}
Az^{(i+1)} & = Az^{(i)} - AA^{-1}H(x^{(i)})A^{-T}A^T\nabla f(x^{(i)}) \\
           & = x^{(i)} - H(x^{(i)}) \nabla f(x^{(i)}) \\
           & = x^{(i+1)},
\end{aligned}$$

which completes this part of the problem.

### Part (b)

Gradient descent is not invariant to linear reparametrizations. The update
equation for $f$ is

$$x^{(i+1)} = x^{(i)} - \alpha\nabla f,$$

and for $g$ is

$$z^{(i+1)} = z^{(i)} - \alpha\nabla g = z^{(i)} - \alpha A^T\nabla f.$$

In order for $Az^{(i+1)} = x^{(i+1)},$ we would need

$$A(z^{(i)} - \alpha A^T\nabla f) = Az^{(i)} - A\alpha\nabla f
\quad\Leftrightarrow\quad
AA^T\nabla f = A\nabla f,$$

but this is only guaranteed when $A$ is unitary.
