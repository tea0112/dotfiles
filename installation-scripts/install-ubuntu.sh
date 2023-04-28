#!/bin/bash

echo "_____________________________________________________"
read -p "Download and Install startship?" confirm
case $confirm in
y)
	curl -sS https://starship.rs/install.sh | sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -p "Clone tmux tpm plugin?" confirm
case $confirm in
y)
	rm -rf ~/.tmux/plugins/tpm
	git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
	;;
*)
	echo "you chose NO"
	;;
esac
echo "******************* Config Tmux *******************"
rm -rf ~/.tmux.conf
ln -sf ~/dotfiles/.tmux.conf ~

echo "******************* Config Starship *******************"
if [ -d "${HOME}/.config/starship.toml" ]; then
	rm -rf ~/.config/starship.toml
fi

ln -sf ~/dotfiles/.config/startship.toml ~/.config/

echo "_____________________________________________________"
read -p "Clone zsh ohmyzsh, autosuggestions, zsh-syntax-highlighting, powerlevel10k?" confirm
case $confirm in
y)
	rm -rf ~/.oh-my-zsh
	git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh

	rm -rf ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
	git clone https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions

	rm -rf ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
	git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting

	rm -rf ~/.oh-my-zsh/custom/themes/powerlevel10k
	git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM}/themes/powerlevel10k
	;;
*)
	echo "you chose NO"
	;;
esac
echo "******************* Config Zsh *******************"
ZSH_CUSTOM=/home/$USER/.oh-my-zsh/custom

rm -rf ~/.zshrc
rm -rf ~/.zprofile

dotfiles_dir=~/dotfiles
ln -sf ${dotfiles_dir}/.zshrc ~
ln -sf ${dotfiles_dir}/.zprofile ~

chsh -s $(which zsh)

echo "******************* Config Neovim *******************"
nvim_config_dir="/home/$USER/.config/nvim"
if [ -d "${nvim_config_dir}" ]; then
	rm -rf "${nvim_config_dir}"
fi
ln -sf /home/$USER/dotfiles/.config/nvim/ /home/$USER/.config/
ln -sf $HOME/dotfiles/.shellcheckrc $HOME
ln -sf $HOME/dotfiles/.ideavimrc $HOME

echo "******************* Config Polybar *******************"
if [ -d "~/.config/polybar" ]; then
	rm -rf ~/.config/polybar
fi

ln -sf ~/dotfiles/.config/polybar/ ~/.config/

echo "******************* Config Rofi *******************"
if [ -d "~/.config/rofi" ]; then
	rm -rf ~/.config/rofi
fi

ln -sf ~/dotfiles/.config/rofi/ ~/.config/

echo "******************* Config I3 *******************"
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
if [ -d "/home/thai/.config/i3" ]; then
	rm -rf ~/.config/i3
fi

ln -sf ~/dotfiles/.config/i3/ ~/.config/

echo "******************* Config Imwheel *******************"
if [ -f "~/.imwheelrc" ]; then
	rm ~/.imwheelrc
fi

ln -sf ~/dotfiles/.imwheelrc ~/

echo "******************* Config Mpv *******************"
rm -rf ~/.config/mpv
ln -sf ~/dotfiles/.config/mpv/ ~/.config

echo "========== Config zathura =========="
if [[ -d "$HOME/.config/zathura " ]]; then
	rm -rf ~/.config/zathura
fi

ln -sf ~/dotfiles/.config/zathura/ ~/.config

echo "_____________________________________________________"
read -p "Install Jetbrains Font?" confirm
case $confirm in
y)
	echo "******************* Install Font *******************"
	FONT_DIR="$HOME/.fonts"
	if [ -d "$FONT_DIR" ]; then
		cp $HOME/dotfiles/JetBrains\ Mono\ Nerd\ Font\ Complete\ Regular.ttf $FONT_DIR
		fc-cache -f -v
	else
		mkdir $FONT_DIR
		cp $HOME/dotfiles/JetBrains\ Mono\ Nerd\ Font\ Complete\ Regular.ttf $FONT_DIR
		fc-cache -f -v
	fi
	;;
*)
	echo "you chose NO"
	;;
esac
