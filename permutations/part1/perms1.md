% Notes on Permutations: Cycles and Transpositions
% Tyler Neylon
% Started typing up 166.2022

\newcommand{\R}{\mathbb{R}}
\newcommand{\eqnset}[1]{\left.\mbox{$#1$}\;\;\right\rbrace\class{postbrace}{ }}
\providecommand{\optquad}{\class{optquad}{}}
\providecommand{\smallscrneg}{\class{smallscrneg}{ }}
\providecommand{\bigscr}[1]{\class{bigscr}{#1}}
\providecommand{\smallscr}[1]{\class{smallscr}{#1}}
\providecommand{\smallscrskip}[1]{\class{smallscrskip}{\hskip #1}}

This is a collection of notes about permutations --- all the different
ways of ordering a set of distinct elements. In group theory, the group of
permutations of size $n$ is denoted $S_n$. For example:

<div class="table1">
------- ---------------------------
$S_2$   $\tt 12 \quad 21$
$S_3$   $\tt 123 \quad 132 \quad 213 \quad 231 \quad 312 \quad 321$
$S_4$   $\tt 1234 \quad 1243 \quad 1324 \quad 1342 \quad 1423 \quad 1432$
        $\tt 2134 \quad 2143 \quad 2314 \quad 2341 \quad 2413 \quad 2431$
        $\tt 3124 \quad 3142 \quad 3214 \quad 3241 \quad 3412 \quad 3421$
        $\tt 4123 \quad 4132 \quad 4213 \quad 4231 \quad 4312 \quad 4321$
------- ---------------------------
</div>

[//]: # <div class="table1">
[//]: # | Group          | Elements
[//]: # |:---------|:-------------------------------------------------
[//]: # | $S_2$          | $\tt 12 \quad 21$
[//]: # | $S_3$          | $\tt 123 \quad 132 \quad 213 \quad 231 \quad 312 \quad 321$
[//]: # | $S_4$          | $\tt 1234 \quad 1243 \quad 1324 \quad 1342 \quad 1423 \quad 1432$
[//]: # |                | $\tt 2134 \quad 2143 \quad 2314 \quad 2341 \quad 2413 \quad 2431$
[//]: # |                | $\tt 3124 \quad 3142 \quad 3214 \quad 3241 \quad 3412 \quad 3421$
[//]: # |                | $\tt 4123 \quad 4132 \quad 4213 \quad 4231 \quad 4312 \quad 4321$
[//]: # </div>


# References
