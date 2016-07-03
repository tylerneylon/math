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

The final value of $\th$ that I arrived at is

$$\th = (2.62051, -0.76037, -1.17195).$$

The first value $\th_0$ represents the constant term, so that the final model is
given by

$$y = g(2.62 - 0.76x_1 - 1.17x_2).$$

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
