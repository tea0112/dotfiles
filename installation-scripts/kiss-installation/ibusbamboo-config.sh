#!/bin/bash

sudo bash -c 'echo "GTK_IM_MODULE=ibus" >> "/etc/environment"'
sudo bash -c 'echo "QT_IM_MODULE=ibus" >> "/etc/environment"'
sudo bash -c 'echo "XMODIFIERS=@im=ibus" >> "/etc/environment"'
sudo bash -c 'echo "QT4_IM_MODULE=ibus" >> "/etc/environment"'
sudo bash -c 'echo "CLUTTER_IM_MODULE=ibus" >> "/etc/environment"'
sudo bash -c 'echo "GLFW_IM_MODULE=ibus" >> "/etc/environment"'
sudo bash -c 'echo "ibus-daemon -drx" >> "/etc/profile"'
