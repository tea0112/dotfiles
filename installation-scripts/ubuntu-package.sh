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
	sudo apt install curl jq wget fd-find ripgrep python3-pip wmctrl python3-pip python3-virtualenv python3-venv xclip aria2 unzip build-essential zsh tmux xsel goldendict gettext fzf nodejs fonts-noto-color-emoji libxcb-cursor0 xdotool ripgrep -y
	;;
*)
	echo "you chose NO"
	;;
esac

# Go
echo "_____________________________________________________"
read -p "Install golang?" confirm
case $confirm in
y)
	./install-go.sh
	;;
*)
	echo "you chose NO"
	;;
esac

# rust
echo "_____________________________________________________"
read -p "Install rust?" confirm
case $confirm in
y)
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	source "/home/${USER}/.cargo/env"

	cargo install eza
	cargo install zoxide
	;;
*)
	echo "you chose NO"
	;;
esac
