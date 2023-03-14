#!/bin/bash

bash -c "$(curl -fsSL https://raw.githubusercontent.com/BambooEngine/ibus-bamboo/master/archlinux/install.sh)"

sudo bash -c 'echo "export GTK_IM_MODULE=ibus" >> "/etc/profile"'
sudo bash -c 'echo "export QT_IM_MODULE=ibus" >> "/etc/profile"'
sudo bash -c 'echo "export XMODIFIERS=@im=ibus" >> "/etc/profile"'
sudo bash -c 'echo "export QT4_IM_MODULE=ibus" >> "/etc/profile"'
sudo bash -c 'echo "export CLUTTER_IM_MODULE=ibus" >> "/etc/profile"'
sudo bash -c 'echo "ibus-daemon -drx" >> "/etc/profile"'
