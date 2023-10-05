#!/bin/bash

# if you are using gnome, you should install "extension-manager", "AppIndicator and KStatusNotifierItem Support" in order to show Qt tray icons

if [[ ! -f "/usr/bin/zsh" ]]; then
	echo "ZSH doesn't exist"
	echo "You should run this script by ZSH!"
	exit 0
fi

echo "instal default terminal for things like ranger, neovim"
echo "export TERMINAL=/usr/bin/alacritty" >>"$HOME/.profile"

sudo pacman -S curl mpv gcc wget ripgrep-all rofi polybar jq aria2 eza xclip fd zsh zoxide starship ripgrep zathura zathura-cb zathura-djvu zathura-ps zathura-pdf-mupdf xsel rofimoji gnome-disk-utility wmctrl xdotool ttf-font-awesome noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra vlc telegram-desktop qbittorrent unzip gnome-keyring gvfs-mtp zip gwenview tumbler gnome-calculator fzf alacritty tmux flatpak okular breeze-icons cmake meson docker

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

	rm -rf ~/.oh-my-zsh/custom/themes/powerlevel10k
	git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "${ZSH_CUSTOM}/themes/powerlevel10k"
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|                  Config Zsh                    |"
echo "'------------------------------------------------'"
ZSH_CUSTOM=~/.oh-my-zsh/custom
rm -rf ~/.zshrc
rm -rf ~/.zprofile
ln -sf ~/dotfiles/.zshrc ~
ln -sf ~/dotfiles/.zprofile ~

chsh -s "$(which zsh)"

echo ".------------------------------------------------."
echo "|                     clangd                     |"
echo "'------------------------------------------------'"
rm -rf ~/.config/clangd
ln -sf ~/dotfiles/.config/clangd/ ~/.config/

echo ".------------------------------------------------."
echo "|                     ranger                     |"
echo "'------------------------------------------------'"
rm -rf ~/.config/ranger/
ln -sf ~/dotfiles/.config/ranger/ "$XDG_CONFIG_HOME/"

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
echo "|                   Config Mpv                   |"
echo "'------------------------------------------------'"
rm -rf ~/.config/mpv
ln -sf ~/dotfiles/.config/mpv/ ~/.config/

echo ".------------------------------------------------."
echo "|                    Config i3                   |"
echo "'------------------------------------------------'"
# rofimoji
# arandr
# gnome-disk-utility
# wmctrl
# xdotool
# lxqt-policykit
# network-manager-applet
# blueman
# autorandr
# feh
# xfce4-notifyd
# ttf-font-awesome
rm -rf ~/.config/i3
ln -sf ~/dotfiles/.config/i3/ ~/.config/

echo ".------------------------------------------------."
echo "|                  Config Rofi                   |"
echo "'------------------------------------------------'"
rm -rf "$HOME/.config/rofi"
ln -sf ~/dotfiles/.config/rofi/ ~/.config/

echo ".------------------------------------------------."
echo "|               Config Polybar                   |"
echo "'------------------------------------------------'"
rm -rf "$HOME/.config/polybar"
ln -sf "$HOME/dotfiles/.config/polybar/" "$HOME/.config/"

echo ".------------------------------------------------."
echo "|               Config Starship                  |"
echo "'------------------------------------------------'"
rm -rf ~/.config/starship.toml
ln -sf ~/dotfiles/.config/startship.toml ~/.config/

echo ".------------------------------------------------."
echo "|                  Zathura                       |"
echo "'------------------------------------------------'"
rm -rf ~/.config/zathura
ln -sf ~/dotfiles/.config/zathura/ ~/.config/

echo ".------------------------------------------------."
echo "|                  Config Neovim                 |"
echo "'------------------------------------------------'"
rm -rf ~/.config/nvim
ln -sf ~/dotfiles/.config/nvim/ ~/.config/
ln -sf ~/dotfiles/.shellcheckrc ~
ln -sf ~/dotfiles/.ideavimrc ~

echo ".------------------------------------------------."
echo "|                   Config Picom                 |"
echo "'------------------------------------------------'"
rm -rf ~/.config/picom
ln -sf ~/dotfiles/.config/picom/ ~/.config/

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
echo "|                 Config tmux                    |"
echo "'------------------------------------------------'"
rm -rf ~/.tmux.conf
ln -sf ~/dotfiles/.tmux.conf ~

echo ".------------------------------------------------."
echo "|               Configure Alacritty              |"
echo "'------------------------------------------------'"
rm -rf ~/.config/alacritty
ln -sf ~/dotfiles/.config/alacritty/ ~/.config/

echo ".------------------------------------------------."
echo "|                Install Go                      |"
echo "'------------------------------------------------'"
read -r -p "Install golang?" confirm
case $confirm in
y)
	./install-go.sh
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

	cargo install eza
	cargo install zoxide
	cargo install --locked ripgrep_all
	;;
*)
	echo "you chose NO"
	;;
esac
