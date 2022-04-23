setxkbmap -option caps:super
#ibus-daemon -drxR

if [ -z "${DISPLAY}" ] && [ "${XDG_VTNR}" -eq 1 ]; then
  exec startx  
fi
