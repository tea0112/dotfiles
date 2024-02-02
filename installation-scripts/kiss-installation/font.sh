#!/bin/bash

echo "******************* Install Font *******************"
mkdir -p ~/.local/share/fonts/otf
mkdir -p ~/.local/share/fonts/tff

TFF_DIR=~/.local/share/fonts/tff
#OTF_DIR=~/.local/share/fonts/otf

FONT_FILE="CaskaydiaCoveNerdFont-Regular.ttf"

if [ -f "${TFF_DIR}/${FONT_FILE}" ]; then
    echo "${FONT_FILE} exists!"
else
    cp ~/dotfiles/${FONT_FILE} "$TFF_DIR"
    fc-cache -f -v
fi
