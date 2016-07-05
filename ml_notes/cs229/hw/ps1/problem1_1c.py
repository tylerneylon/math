#!/usr/bin/env python
"""Problem 1_1c.py

Graph the data points and the
learned decision boundary.
"""

from itertools import cycle
from matplotlib import pyplot as plt
import numpy as np

# Load data.
X     = np.loadtxt('logistic_x.txt')
Y     = np.loadtxt('logistic_y.txt')
theta = np.loadtxt('theta.txt')

# Calculate two points on the decision boundary.
b = theta[0]
a1, a2 = theta[1], theta[2]
# b + a1 x1 + a2 x2 = 0
# x2 = (-1/a2)(b + a1 x1)
bdry_x = [0, 8]
bdry_y = []
for i in range(2):
  bdry_y.append((-1.0 / a2) * (b + a1 * bdry_x[i]))

# Plot the points and decision boundary.
fig, ax = plt.subplots()
ax.grid(True)
ax.set_aspect('equal')
ax.set_title('Problem 1.1(c)')
prop_cycle = cycle(plt.rcParams['axes.prop_cycle'])
y_vals  = [-1, 1]
markers = ['o', '+']
for i in range(2):
  val = y_vals[i]
  pts = X[Y == val]
  ax.plot(pts[:,0], pts[:,1], markers[i], ms=8, mew=3.0)
ax.plot(bdry_x, bdry_y)
plt.show()
