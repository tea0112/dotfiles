#!/bin/bash

mkdir -p ~/.local/bin
# if [[ ! -f "/usr/bin/zsh" ]]; then
#     echo "ZSH doesn't exist"
#     echo "You should run this script by ZSH!"
#     exit 0
# fi

# template
#echo "_____________________________________________________"
#read -p "?" confirm
#case $confirm in
#y)
#    ;;
#*)
#    echo "you chose NO"
#    ;;
#esac

echo "_____________________________________________________"
read -p "Generate en_US.UTF-8?" confirm
case $confirm in
y)
	sudo locale-gen "en_US.UTF-8"
	;;
*)
	echo "You didn't choose!"
	;;
esac

echo "_____________________________________________________"
read -p "Install package?" confirm
case $confirm in
y)
	# sudo apt install blueman
	sudo add-apt-repository ppa:aslatter/ppa -y
	sudo apt install build-essential pandoc poppler-utils ffmpeg ripgrep copyq flameshot picom curl jq wget fd-find ripgrep python3-pip wmctrl python3-pip python3-virtualenv python3-venv xclip aria2 unzip build-essential zsh tmux xsel goldendict gettext fzf nodejs fonts-noto-color-emoji libxcb-cursor0 xdotool ripgrep vim vim-gtk polybar rofi feh gnome-clocks flatpak -y

	# sudo apt install gnome-software-plugin-flatpak -y

	# flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
	;;
*)
	echo "you chose NO"
	;;
esac

# Go
echo "_____________________________________________________"
read -r -p "Install golang?" confirm
case $confirm in
y)
	./kiss-installation/install-go.sh
	;;
*)
	echo "you chose NO"
	;;
esac

# rust
echo "_____________________________________________________"
read -r -p "Install rust?" confirm
case $confirm in
y)
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	source "/home/${USER}/.cargo/env"

	cargo install eza
	cargo install zoxide
	cargo install --locked ripgrep_all
	;;
*)
	echo "you chose NO"
	;;
esac
