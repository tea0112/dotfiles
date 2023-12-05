#!/bin/bash

cd /tmp || exit
rm -rf font-awesome-5
git clone https://aur.archlinux.org/font-awesome-5.git
cd font-awesome-5 || exit
makepkg -si
