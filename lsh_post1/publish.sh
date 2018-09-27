#!/bin/bash

./toboth

scp images/*.png images/*.gif neylon@bynomial.com:~/tylerneylon.com/a/lsh1/images
scp tufte-edited.css lsh_post1.html lsh_post1.pdf lsh_post1_for_kindle.pdf neylon@bynomial.com:~/tylerneylon.com/a/lsh1/
ssh neylon@bynomial.com "cp ~/tylerneylon.com/a/lsh1/lsh_post1.html ~/tylerneylon.com/a/lsh1/index.html"

# FUTURE Consider converting links on Unbox to stay local to Unbox rather
#        than pointing over to tylerneylon.com.

patch lsh_post1.html add_unbox_html.patch

cp images/*.png images/*.gif ../../unbox-website/public/articles/images/
cp tufte-edited.css lsh_post1.html lsh_post1.pdf lsh_post1_for_kindle.pdf ../../unbox-website/public/articles/

echo
echo '**************************************************************'
echo   Please run \`gulp upload\` from unbox-website now. Thanks!
echo '**************************************************************'
echo
