#!/bin/bash

bash -c "$(curl -fsSL https://raw.githubusercontent.com/BambooEngine/ibus-bamboo/master/archlinux/install.sh)"

{
echo "export GTK_IM_MODULE=ibus"
echo "export QT_IM_MODULE=ibus"
echo "export XMODIFIERS=@im=ibus"
echo "export QT4_IM_MODULE=ibus"
echo "export CLUTTER_IM_MODULE=ibus"
echo "ibus-daemon -drx"
} >> "$HOME/.profile"
