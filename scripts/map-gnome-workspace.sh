#!/bin/bash

# Ensure enough workspaces exist for the bindings below (1..11).
# Bump num-workspaces only if it's currently lower — never shrink.
REQUIRED_WS=11
CURRENT_WS=$(gsettings get org.gnome.desktop.wm.preferences num-workspaces | tr -dc '0-9')
if [ -z "$CURRENT_WS" ] || [ "$CURRENT_WS" -lt "$REQUIRED_WS" ]; then
  gsettings set org.gnome.desktop.wm.preferences num-workspaces "$REQUIRED_WS"
fi

# Also force fixed-workspaces mode so the count above is honored
# (uncomment if you want the script to override dynamic workspaces too):
# gsettings set org.gnome.desktop.wm.preferences workspaces-only-on-primary false
# gsettings set org.gnome.mutter dynamic-workspaces false

# Override GNOME defaults that collide with workspace keys (q/w/e/r/s/d/f/z/x/c).
# Without these, the workspace bindings silently shadow built-in shortcuts
# (show-desktop, quick-settings, dash-to-dock) instead of replacing them.
gsettings set org.gnome.desktop.wm.keybindings show-desktop "[]"
gsettings set org.gnome.shell.keybindings toggle-quick-settings "[]"
gsettings set org.gnome.shell.keybindings toggle-application-view "[]"
# Unbind Super+v from the message-tray toggle (default is Super+v + Super+m).
# Keep Super+m working.
gsettings set org.gnome.shell.keybindings toggle-message-tray "['<Super>m']"
gsettings set org.gnome.shell.extensions.dash-to-dock shortcut "[]"
gsettings set org.gnome.shell.extensions.dash-to-dock shortcut-text ""

# Free Super+1..9 so the OS-level app launcher keys don't fight us either.
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
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-5 "['<Super>a']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-6 "['<Super>s']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-7 "['<Super>d']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-8 "['<Super>f']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-9 "['<Super>z']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-10 "['<Super>x']"
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-11 "['<Super>c']"
