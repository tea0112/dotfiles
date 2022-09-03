#!/bin/bash

caps_lock_state=$(xset q | grep Caps | awk '{print $4}')

if [[ ${caps_lock_state} == 'off' ]]; then
    setxkbmap -option caps:super
else
    if [[ ! $(bash ~/dotfiles/scripts/package-exist-ubuntu.sh xdotool) ]]; then
        sudo apt install -y xdotool
    fi
    xdotool key Caps_Lock
    setxkbmap -option caps:super
fi
