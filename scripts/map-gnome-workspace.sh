#!/bin/bash

echo "Please also remove keyboard shortcut 'Hide all normal windows (Super+d)', 'Show the overview (super+s)', "

for i in $(seq 1 9); do gsettings set org.gnome.shell.keybindings switch-to-application-${i} '[]'; done

#for i in $(seq 1 10); do gsettings set org.gnome.shell.extensions.dash-to-dock app-hotkey-${i} '[]'; done

#gsettings set org.gnome.shell.extensions.dash-to-dock hot-keys false

# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-1 "['<Super>1']"
# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-2 "['<Super>2']"
# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-3 "['<Super>3']"
# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-4 "['<Super>4']"
# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-5 "['<Super>5']"
# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-6 "['<Super>6']"
# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-7 "['<Super>7']"
# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-8 "['<Super>8']"
# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-9 "['<Super>9']"
# gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-10 "['<Super>0']"

gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-1 "['<Super>q']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-2 "['<Super>w']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-3 "['<Super>e']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-4 "['<Super>r']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-5 "['<Super>s']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-6 "['<Super>d']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-7 "['<Super>f']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-8 "['<Super>z']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-9 "['<Super>x']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-10 "['<Super>c']"
