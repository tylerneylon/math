% problem1_1c.m
%
% Plot the model learned from problem1_1b.m.
%

% Load the data.
X      = load('logistic_x.txt');
[m, n] = size(X);
X      = [ones(m, 1) X];
Y      = load('logistic_y.txt');
theta  = load('theta.mat');

X_neg = X(find(Y < 0), :);
X_pos = X(find(Y > 0), :);

scatter(X_neg(:, 1), X_neg(:, 2), 'r', 'o');
scatter(X_pos(:, 1), X_neg(:, 2), 'b', '+');
