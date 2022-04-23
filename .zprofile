ibus-daemon -drxR

setxkbmap -option caps:super

if [ -z "${DISPLAY}" ] && [ "${XDG_VTNR}" -eq 1 ]; then
  exec startx
fi
