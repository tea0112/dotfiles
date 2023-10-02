#!/bin/bash

font=Meslo
fontpath="$HOME/.local/share/fonts"
version="3.0.2"

wget https://github.com/ryanoasis/nerd-fonts/releases/download/v"$version"/$font.zip
mkdir -p "$fontpath"
unzip $font.zip -d "$fontpath"
rm "$fontpath"/*Windows*
rm $font.zip
fc-cache -fv
