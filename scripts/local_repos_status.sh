#!/bin/bash

echo '.---------------------.'
echo '|     nvim status     |'
echo '.---------------------.'
cd ~/.config/nvim || exit
git status
echo '.---------------------.'
echo '|   dotfiles status   |'
echo '.---------------------.'
cd ~/dotfiles || exit
git status
