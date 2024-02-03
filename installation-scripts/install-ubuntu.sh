#!/bin/bash

mkdir ~/.config -p

echo ".------------------------------------------------."
echo "|                  starship                     |"
echo "'------------------------------------------------'"
read -r -p "Download and Install startship?" confirm
case $confirm in
y)
	curl -sS https://starship.rs/install.sh | sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|               tmux tpm plugin                  |"
echo "'------------------------------------------------'"
read -r -p "Clone tmux tpm plugin?" confirm
case $confirm in
y)
	./kiss-installation/tmux-plugin.sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|             Clone zsh plugins                  |"
echo "'------------------------------------------------'"
read -r -p "Clone zsh ohmyzsh, autosuggestions, zsh-syntax-highlighting, powerlevel10k?" confirm
case $confirm in
y)
	./kiss-installation/clone-zsh-plugins.sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|                     font                       |"
echo "'------------------------------------------------'"
read -r -p "Install Caskaydia Cove Nerd Font?" confirm
case $confirm in
y)
	./kiss-installation/font.sh
	;;
*)
	echo "you chose NO"
	;;
esac

./config.sh
