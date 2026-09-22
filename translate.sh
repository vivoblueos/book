#!/bin/bash
# Please install https://github.com/pescheckit/python-gpt-po before running this
# script.
# TODO: We have to provide customized html templates to offer language tab on
# the web page.

set -x
set -e

# DEEPSEEK_API_KEY must be exported in your shell environment (e.g. via a
# secrets manager or `export DEEPSEEK_API_KEY=...` typed directly at the
# prompt) before running this script. Do NOT hardcode the key in this file,
# as that risks exposure via shell history and version control.
if [ -z "${DEEPSEEK_API_KEY}" ]; then
  echo "Error: DEEPSEEK_API_KEY environment variable is not set." >&2
  exit 1
fi

MDBOOK_OUTPUT='{"xgettext": {}}' mdbook build -d po
msginit -i po/messages.pot -l zh -o po/zh.po --no-translator
gpt-po-translator --lang zh --folder po/ --model deepseek-chat --bulk \
                  --no-ai-comment
