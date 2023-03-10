#!/bin/bash

for i in $(seq 1 9); do gsettings set org.gnome.shell.keybindings switch-to-application-${i} '[]'; done

#for i in $(seq 1 10); do gsettings set org.gnome.shell.extensions.dash-to-dock app-hotkey-${i} '[]'; done

gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-1 "['<Super>q']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-2 "['<Super>w']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-3 "['<Super>e']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-4 "['<Super>d']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-5 "['<Super>1']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-6 "['<Super>2']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-7 "['<Super>3']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-8 "['<Super>f']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-9 "['<Super>r']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-10 "['<Super>4']"
