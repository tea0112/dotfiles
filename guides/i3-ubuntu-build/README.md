# clone 
$ git clone https://github.com/i3/i3

# install dependencies
$ ./i3-ubuntu-dependencies.sh

# install Meslo font
$ ./install-meslo-font.sh

# you can remove meson and install latest meson with pip after build
# https://i3wm.org/docs/hacking-howto.html#_building_i3
$ mkdir -p build && cd build
$ meson -Ddocs=true -Dmans=true ..
$ ninja
$ sudo ninja install

# iconv library
https://www.gnu.org/software/libiconv/#TOCdownloading

# create .xinitrc

exec i3

# Add i3 to xsession

/usr/share/xsessions/i3.desktop

[Desktop Entry]
Name=i3
Comment=improved dynamic tiling window manager
Exec=i3
TryExec=i3
Type=Application
X-LightDM-DesktopName=i3
DesktopNames=i3
Keywords=tiling;wm;windowmanager;window;manager;
