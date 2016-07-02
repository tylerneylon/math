printf('Running problem1_1.m\n');

% Setup.
X = load('logistic_x.txt');
[m, n] = size(X);
X = [ones(m, 1) X];
Y = load('logistic_y.txt');
Z = diag(Y) * X;

theta = zeros(n + 1, 0);

