#!/bin/bash

# Terminate already running bar instances
killall -q polybar

echo "Polybar launched..."

if type "xrandr"; then
  for m in $(xrandr --query | grep " connected" | cut -d" " -f1); do
    # Launch Polybar, using default config location ~/.config/polybar/config.ini
    MONITOR=$m polybar --reload my_polybar 2>&1 | tee -a /tmp/polybar.log & disown
  done
else
    # Launch Polybar, using default config location ~/.config/polybar/config.ini
  polybar --reload my_polybar 2>&1 | tee -a /tmp/polybar.log & disown
fi
