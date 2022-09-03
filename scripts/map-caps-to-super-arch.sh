#!/bin/bash

caps_lock_state=$(xset q | grep Caps | awk '{print $4}')

if [[ ${caps_lock_state} == 'off' ]]; then
    setxkbmap -option caps:super
else
    if [[ ! $(bash ~/dotfiles/scripts/package-exist.sh xdotool) ]]; then
        sudo pacman -S xdotool
    fi
    xdotool key Caps_Lock
    setxkbmap -option caps:super
fi
