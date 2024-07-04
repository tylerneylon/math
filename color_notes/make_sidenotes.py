#!/usr/bin/env python3
# coding: utf-8
''' make_sidenotes.py

    Usage:
        ./make_sidenotes.py <html_file>

    This expects an html file as produced by pandoc with some footnotes in it.
    This will convert those footnotes into tufte-style sidenotes.
'''


# ______________________________________________________________________
# Imports

import re
import sys


# ______________________________________________________________________
# Functions

""" This accepts a 0-based index i and returns the html that can
    replace the old in-text links with the new tufte.css-powered
    sidenote. """
def make_note_html(i):
    global notes
    s  = f'<label for="sn{i}" class="margin-toggle sidenote-number"></label>'
    s += f'<input type="checkbox" id="sn{i}" class="margin-toggle"/>'
    s += f'<span class="sidenote">{notes[i]}</span>'
    return s


# ______________________________________________________________________
# Main

if __name__ == '__main__':

    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    # 1. Read in the file contents.
    f = open(sys.argv[1])
    content = f.read()

    # 2. Find the note starts and contents.
    note_starts = list(re.finditer(r'<li id="fn\d+', content))
    note_starts = [ns.start() for ns in note_starts]
    notes = [
            re.search(r'<p>(.*?)<a', content[ns:], re.S).group(1)
            for ns in note_starts
    ]

    # 3. Find the spans for the in-text links we'll replace.
    link_starts = list(re.finditer(r'<a href="#fn\d', content))
    link_starts = [ls.start() for ls in link_starts]
    link_spans = [
            (m := re.search(r'<a href.*?</a>', content[ls:], re.S), ls +
             m.start(), ls + m.end()) for ls in link_starts]
    link_spans = [(x, y) for _, x, y in link_spans]

    # 4. Modify the contents with the replacement html.
    #    Do this in reverse order so that the first replacements don't mess up
    #    the indexes used for the later replacements.
    for i in range(len(link_spans) - 1, -1, -1):
        ls = link_spans[i]
        content = content[:ls[0]] + make_note_html(i) + content[ls[1]:]

    # 5. Find and delete the old footnote section.

    # Re-find the note starts since we updated `content`.
    note_starts = list(re.finditer(r'<li id="fn\d+', content))
    first_note_idx = note_starts[0].start()

    # Search backwards to find <section>.
    section_start = list(re.finditer(
        '<section', content[:first_note_idx]
    ))[-1].start()

    # Search forwards to find </section>.
    section_end = re.search(
            r'</section>', content[first_note_idx:]
    ).end() + first_note_idx

    # Delete the section.
    content = content[:section_start] + '\n' + content[section_end:]

    # Finally, save the new contents out to the same filename.
    f = open(sys.argv[1], 'w')
    f.write(content)

