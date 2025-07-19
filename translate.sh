#!/bin/bash
# Please install https://github.com/pescheckit/python-gpt-po before running this
# script.
# TODO: We have to provide customized html templates to offer language tab on
# the web page.

set -x
set -e

# Fill API key of deepseek.
#export DEEPSEEK_API_KEY=

MDBOOK_OUTPUT='{"xgettext": {}}' mdbook build -d po
msginit -i po/messages.pot -l zh -o po/zh.po --no-translator
gpt-po-translator --lang zh --folder po/ --model deepseek-chat --bulk \
									--no-ai-comment
