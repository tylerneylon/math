% Notes on Color
% Tyler Neylon
% 352.2024

\newcommand{\R}{\mathbb{R}}
\newcommand{\N}{\mathbb{N}}
\newcommand{\eqnset}[1]{\left.\mbox{$#1$}\;\;\right\rbrace\class{postbrace}{ }}
\providecommand{\latexonlyrule}[3][]{}
\providecommand{\optquad}{\class{optquad}{}}
\providecommand{\smallscrneg}{\class{smallscrneg}{ }}
\providecommand{\bigscr}[1]{\class{bigscr}{#1}}
\providecommand{\smallscr}[1]{\class{smallscr}{#1}}
\providecommand{\smallscrskip}[1]{\class{smallscrskip}{\hskip #1}}

\newcommand{\mydots}{{\cdot}\kern -0.1pt{\cdot}\kern -0.1pt{\cdot}}

\newcommand{\?}{\stackrel{?}{=}}
\newcommand{\sign}{\textsf{sign}}
\newcommand{\order}{\textsf{order}}
\newcommand{\flips}{\textsf{flips}}
\newcommand{\samecycles}{\textsf{same$\\\_$cycles}}
\newcommand{\canon}{\textsf{canon}}
\newcommand{\cs}{\mathsf{cs}}
\newcommand{\dist}{\mathsf{dist}}
\renewcommand{\theenumi}{(\roman{enumi})}

[
Formats:
 [html](http://tylerneylon.com/a/color_notes/color_notes.html) |
 [pdf](http://tylerneylon.com/a/color_notes/color_notes.pdf)
 $\,$
]

This post captures my own notes about color, categorized
according to some key questions I had when I began.

I have a daydream of
one day writing up something like an engineer's guide to
color that is at once engaging, well-designed, educational,
and a pleasure to read. For now I'm just aiming for educational.

# The nature of human vision

* How do we know that color is a 3-dimensional thing?
  - Related: If we have 3 types of cones plus rods, why isn't color
    4-dimensional?
* Why are red, green, and blue special?
* How do we know humans have 3 types of cones?
* How do rods and cones perceive color?
  - Related: What is a mathematical model for how light in the world
    is translated into signals in the brain?
* How do we know the actual cone sensitivies?
* What do negative coefficients mean in color matching experiments,
  and how can I think about those?
* Why do the ends of the rainbow meet up so nicely?
  - Related: Are all the colors we see based on physically real colors?
* Why do we see the light spectrum that we do?
* Why is the chromaticity diagram the shape that it is?
* Are there colors we could theoretically perceive, but can't exist in reality?
* How can I model, with mathematical precision, the common types of color
  blindness?

# Questions about light and color itself

* How do blacklights work?
* How does infrared light interact with heat?

# Reproducing colors

* How do monitors and printers reproduce any color?
* Why can't a monitor display all possible colors?
* What are color spaces?
* What are the HSL and HSV color spaces, and how do they differ?
* What's the difference between chroma and saturation?
* What are the formulas for switching between RGB, HSL, and HSV?
* What does the name sRGB indicate?
