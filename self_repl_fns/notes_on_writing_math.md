* Use a unicode em-dash in the md file rather than ---

* \rule exists in latex and \Rule exists in mathjax.
  I'm using custom templates to work with that.

* You can include custom \newcommand lines in your md file.

* Include ending punctuation within the math delimiters.

* In one place I ended a line with $<math>\;$ $<other_math>$, which allows a
  line break but sadly adds extra space at the end of the first line if there is
  a line break. I want there to be extra space if they're on the same line, but
  not otherwise. How can I do this? I'm thinking about the latex output
  specifically.
