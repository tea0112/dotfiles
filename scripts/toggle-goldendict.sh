#!/bin/bash

WINDOW_ID=$(xdotool getactivewindow)
CLASS_NAME=$(xprop -id $WINDOW_ID | rg WM_CLASS | cut -d '"' -f2)

# notify-send "CLASS_NAME" "$CLASS_NAME"

if [[ $CLASS_NAME == "goldendict" ]]; then
	xdotool windowminimize "$(xdotool getactivewindow)"
else
	wmctrl -a "Goldendict"
fi
