#!/bin/bash

echo '.---------------------.'
echo '|     nvim status     |'
echo '.---------------------.'
cd ~/dotfiles/.config/nvim || exit
git pull
git status

echo '.---------------------.'
echo '|   dotfiles status   |'
echo '.---------------------.'
cd ~/dotfiles || exit
git pull
git status
