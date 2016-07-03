% problem1_1.m
%
% Run Newton's method on a given cost function for a logistic regression setup.
%

% Temp.
printf('Running problem1_1.m\n');

% Setup.
X      = load('logistic_x.txt');
[m, n] = size(X);
X      = [ones(m, 1) X];
Y      = load('logistic_y.txt');
Z      = diag(Y) * X;

% Initialize the parameters to learn.
theta = zeros(n + 1, 1);

% Perform Newton's method.
for i = 1:100
  disp(i);  % XXX
  g     = 1 ./ (1 + exp(X * theta));
  f     = (1 - g);
  alpha = f .* g;
  A     = diag(alpha);
  H     = Z' * A * Z / m;
  nabla = Z' * f;
  theta = theta - inv(H) *  nabla;
  disp(theta)
end

% Show output.
printf('Final theta:\n');
disp(theta);
