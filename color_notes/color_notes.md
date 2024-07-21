% Notes on Color
% Tyler Neylon
% 352.2024

% Started: 352.2024

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


# Questions about light and color itself

## What is color, physically?

Every photon has a wavelength, traditionally denoted by $\lambda$ and measured
in nm (nanometers) in the context of color. This wavelength corresponds
inversely with the photon's frequency, traditionally denoted by $\nu$, and
measured in hertz ($1/s$).

For example, suppose we see light consisting entirely of photons with the
wavelength $\lambda = 700$nm. This appears red to our eyes. The wavelength and
frequency of a photon are related by the formula

$$ c = \lambda \nu,$$

where $c = 3\times 10^8 m/s$ is the speed of light.
Equation XXX is sometimes called the *wave equation*, and is a result of the
fact that the speed of light is a constant.

TODO HERE: Figure out how to number equations and refer back to them. I forget
how to do that in pandoc.


## MY NOTES ON QUESTIONS FOR THIS SECTION

* What is color, physically?
* How do blacklights work?
* How does infrared light interact with heat?

# The nature of human vision

## How do we know human color vision is 3-dimensional?

There are two main pieces of evidence that human color vision is
3-dimensional. One is a classic color-matching experiment, and the other is
based on human retinal anatomy --- the fact that we have three types
of cones in our retinas.

### Color-matching experiments

Here's the setup for the classic color-matching experiment:
A human sits staring at a wall in a dark room.
They see a circle of colored light. The light on the left
side is a single pure wavelength --- this is called a *spectral color*.
The light on the right hand side is a weighted combination of
three primary colors (colors of fixed, known wavelengths).

The poor human is tasked with adjusting the intensities of the three
primaries in order to make the right-hand side match the color of the
left-hand side.

One thing to note is that, if humans were completely color-blind, and only saw
in black and white, then this experiment could succeed with only a single
primary color. In fact, you can do this experiment with a single primary color
in extremely low light, and indeed you can match any color in that setting (TODO
REFERENCE). The fact that this experiment succeeds --- that you can always find
a perfect match --- with three primary colors is a huge piece of evidence that
our color vision is fundamentally 3-dimensional. I am a very skeptical person,
so I will point out that the traditional experiments did not perform a
systematic investigation of different intensities of the target color, and I
would prefer to see that kind of investigation before fully agreeing that human
color vision is three-dimensional.

I have slightly simplified my explanation of the color-matching experiment
above, and now I'll come clean and try to provide the detail I had left out. If
the experiment above worked exactly as I described, then for every wavelength
(of the target color on the left), you'd have three non-negative coefficients
for the primary colors on the right. Those coefficients would describe
quantitatively how the target color is capture by the primary colors.

However, there are some cases where a match is not possible in the traditional
way; but there's an easy fix. Suppose your target color is some kind of teal
color, and you're mixing green and blue on the right, but the right side always
looks a little more yellow-ish than the right side. Well, if you add a little
red to the *left* side (which would move it toward yellow),
then you can achieve a match. This actually happens. But the matches are still
always possible. The result is that we allow for *negative* coefficients in the
color matching data.

You might naturally ask: Why can't we just choose the right primary colors so
that we never need negative coefficients? And it turns out that's impossible, as
I'll explain below.[^1] But the experiment still shows that there's always a
linear dependency between any wavelength and the primary colors of the
experiment.
If we write the target color as a vector $T$, and the primary colors as $R, G,
B$, then we can always find coefficients (possibly negative) to satisfy this
equation:

$$T = a R + b G + c B.$$

[^1]: As a spoiler that might not make sense yet but will later:
It turns out that the geometry of spectral
colors is a shape that is never the convex hull of three points.
For any three
primary colors you choose,
you can use non-negative combinations of those colors to
represent any color in the triangle between them (inside
their convex hull).
But there will always be spectral
colors outside this triangle.

The argument goes: If we had obviously 4-dimensional color perception, then
there would be some target color $T$ such that no values of $a,b,c$ could match
it, just as no combination of red and green can match blue.
By the way, I've chosen the somewhat-awkward variables $a,b,c$ (awkward
since you might think $b$ matches "blue," but it doesn't) because this
researcher named John Guild published pivotal color vision data about such an
experiment in 1931, which (along with other work), led to the creation of the
famous chromaticity diagram that I'll describe below.

I transcribed the original data from Guild's 1931 paper --- his Table II ---
and re-plotted his RGB coefficients below [@guild1931colorimetric].

![John Guild's original 1931 color-matching data.
Each vertical line through this graph provides three values that add up to 1;
the coefficients have been normalized (scaled together per x-value) to ensure
this. As a reminder, low wavelengths (near 400nm) indicate blue shades, and
high values (near 700nm) indicate red shades, with the full spectrum between.
Related files: [Mathematica code to make this
image](color_matching/plot_color_matching_coeffs.htm) |
[Mathematica notebook](color_matching/plot_color_matching_coeffs.nb) |
[text data from Guild's Table
II](color_matching/guild_color_matching_data.math).
](img/color_matching_coeffs.png)

To arrive at this data, Guild worked with seven (yes, a small number!) of test
subjects (aka people), and averaged their numbers together. One thing he found
is that there is not much variance between (non-color-blind) people.
In the 1931 paper,
he referred to his primary colors as the "working primaries" to differentiate
them from nearby colors that were considered "standard" at the time.
As far as I can tell, Guild did not directly describe the wavelenghts of his
working primary colors, but did describe how to convert those to standard
primary colors. (TODO THINK ABOUT THIS MORE)

If you're like me, you might be thinking that we're close to seeing cone
sensitivities. But the transformation from this graph to cone sensitivities
is not simple because each cone has a
non-linear sensitivity to a entire range of wavelengths --- more on that below.

In case you're curious about the variance across different people, here's
Guild's original figure showing the same curve for all seven of his subjects:

![Guild's original diagram showing the similar results from color-matching
experiments across seven subjects.
[@guild1931colorimetric]
](img/Guild_different_subjects.jpg)

As you can see, the curves are fairly consistent, except perhaps for the
extremes of the middle-wavelength primary (green-ish primary, top of figure)
the bottom of the
long-wavelength primary (red-ish primary, bottom of figure). I also see more
variation in the
red/green portions on the lower-left, as opposed to the high consistency in the
blue saturation (top-left) and in all primary coefficients on the right of the
figure.

### We have three kinds of cones

HERE

# If we have three kinds of cones and also rods, why don't we have 4-dimensional color vision?

AND HERE NEXT


* How do we know that color is a 3-dimensional thing?
  - Related: If we have 3 types of cones plus rods, why isn't color
    4-dimensional?
* Why are red, green, and blue special?
* How do we know humans have 3 types of cones?
* How do rods and cones perceive color?
  - Related: What is a mathematical model for how light in the world
    is translated into signals in the brain?
* How do we know the actual cone sensitivies?
* Why do the ends of the rainbow meet up so nicely?
  - Related: Are all the colors we see based on physically real colors?
* Why do we see the light spectrum that we do?
* Why is the chromaticity diagram the shape that it is?
* Why do we always need to allow for negative coefficients in color matching?
* Are there colors we could theoretically perceive, but can't exist in reality?
* How can I model, with mathematical precision, the common types of color
  blindness?

# Reproducing colors

* How do monitors and printers reproduce any color?
* Why can't a monitor display all possible colors?
* What are color spaces?
* What are the HSL and HSV color spaces, and how do they differ?
* What's the difference between chroma and saturation?
* What are the formulas for switching between RGB, HSL, and HSV?
* What does the name sRGB indicate?

___

# Bibliography
