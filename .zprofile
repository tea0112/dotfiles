setxkbmap -option caps:super
~/.scripts/flameshot-exec.sh
#ibus-daemon -drxR

if [ -z "${DISPLAY}" ] && [ "${XDG_VTNR}" -eq 1 ]; then
  exec startx  
fi
