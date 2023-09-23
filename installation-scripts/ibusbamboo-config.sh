#!/bin/bash

sudo bash -c 'echo "export GTK_IM_MODULE=ibus" >> "/etc/profile"'
sudo bash -c 'echo "export QT_IM_MODULE=ibus" >> "/etc/profile"'
sudo bash -c 'echo "export XMODIFIERS=@im=ibus" >> "/etc/profile"'
sudo bash -c 'echo "export QT4_IM_MODULE=ibus" >> "/etc/profile"'
sudo bash -c 'echo "export CLUTTER_IM_MODULE=ibus" >> "/etc/profile"'
sudo bash -c 'echo "ibus-daemon -drx" >> "/etc/profile"'
