#!/bin/bash

read -r -p "Do you want to install RPM Fusion?[y]" answer

case $answer in
y)
	sudo dnf install https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
	sudo dnf makecache
	sudo dnf groupupdate core
	sudo dnf config-manager --set-enabled fedora-cisco-openh264
	sudo dnf install gstreamer1-plugin-openh264 mozilla-openh264
	;;
*) ;;
esac

sudo dnf install zsh eza neovim zoxide make automake gcc gcc-c++ kernel-devel mpv gnome-tweaks ripgrep
