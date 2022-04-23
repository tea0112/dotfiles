setxkbmap -option caps:super
~/.scripts/apps-exec-startup.sh "flameshot"
#ibus-daemon -drxR

if [ -z "${DISPLAY}" ] && [ "${XDG_VTNR}" -eq 1 ]; then
  exec startx  
fi
