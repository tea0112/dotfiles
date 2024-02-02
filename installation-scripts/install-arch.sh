#!/bin/bash

# if you are using gnome, you should install "extension-manager", "AppIndicator and KStatusNotifierItem Support" in order to show Qt tray icons

if [[ ! -f "/usr/bin/zsh" ]]; then
	echo "ZSH doesn't exist"
	echo "You should run this script by ZSH!"
	exit 0
fi

echo "instal default terminal for things like ranger, neovim"
echo "export TERMINAL=/usr/bin/alacritty" >>"$HOME/.profile"

flatpak remote-add --if-not-exists --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo

echo ".------------------------------------------------."
echo "|             Clone zsh plugins                  |"
echo "'------------------------------------------------'"
read -r -p "Clone zsh ohmyzsh, autosuggestions, zsh-syntax-highlighting, powerlevel10k?" confirm
case $confirm in
y)
	rm -rf ~/.oh-my-zsh
	git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh

	rm -rf ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
	git clone https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions

	rm -rf ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
	git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting

	rm -rf ~/.oh-my-zsh/custom/plugins/zsh-vi-mode
	git clone https://github.com/jeffreytse/zsh-vi-mode ~/.oh-my-zsh/custom/plugins/zsh-vi-mode

	rm -rf ~/.oh-my-zsh/custom/themes/powerlevel10k
	git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ~/.oh-my-zsh/custom/themes/powerlevel10k
	;;
*)
	echo "you chose NO"
	;;
esac
chsh -s "$(which zsh)"

echo ".------------------------------------------------."
echo "|               create config files              |"
echo "'------------------------------------------------'"
./config.sh

echo ".------------------------------------------------."
echo "|                     font                       |"
echo "'------------------------------------------------'"
read -r -p "Install Caskaydia Cove Nerd Font?" confirm
case $confirm in
y)
	echo "******************* Install Font *******************"
	mkdir -p ~/.local/share/fonts/otf
	mkdir -p ~/.local/share/fonts/tff

	TFF_DIR=~/.local/share/fonts/tff
	#OTF_DIR=~/.local/share/fonts/otf

	FONT_FILE="CaskaydiaCoveNerdFont-Regular.ttf"

	if [ -f "${TFF_DIR}/${FONT_FILE}" ]; then
		echo "${FONT_FILE} exists!"
	else
		cp ~/dotfiles/${FONT_FILE} "$TFF_DIR"
		fc-cache -f -v
	fi
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
	rm -rf ~/.tmux/plugins/tpm
	git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|                Install Go                      |"
echo "'------------------------------------------------'"
read -r -p "Install golang?" confirm
case $confirm in
y)
	./kiss-installation/go.sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|                Install Rust                    |"
echo "'------------------------------------------------'"
read -r -p "Install rust?" confirm
case $confirm in
y)
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	source "/home/${USER}/.cargo/env"
	;;
*)
	echo "you chose NO"
	;;
esac
