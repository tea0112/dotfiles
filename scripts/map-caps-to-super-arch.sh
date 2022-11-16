#!/bin/bash

caps_lock_state=$(xset q | grep Caps | awk '{print $4}')

if [[ ${caps_lock_state} == 'off' ]]; then
    setxkbmap -option caps:super
    pkill picom
    picom
    notify-send "DONE!"
else
    xdotool key Caps_Lock
    setxkbmap -option caps:super
    pkill picom
    picom
    notify-send "DONE!"
fi
