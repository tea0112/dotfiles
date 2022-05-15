#!/bin/bash

dir="/home/$USER"
zshrc_dir="${dir}/.zshrc"
zprofile_dir="${dir}/.zprofile"
tmux_conf_dir="${dir}/.tmux.conf"

config_dir="${dir}/.config"

#i3_config_dir="${config_dir}/i3"
alacritty_config_dir="${config_dir}/alacritty"
polybar_config_dir="${config_dir}/polybar"
nvim_config_dir="${config_dir}/nvim"
zathura_config_dir="${config_dir}/zathura"
rofi_config_dir="${config_dir}/rofi"

# Home
if [ -f "${tmux_conf_dir}" ]; then
    rm -rf "${tmux_conf_dir}"
fi

if [ -f "${zshrc_dir}" ]; then
    rm -rf "${zshrc_dir}"
fi

if [ -f "${zprofile_dir}" ]; then
    rm -rf "${zprofile_dir}"
fi

# XDG config
if [ -d "${alacritty_config_dir}" ]; then
    rm -rf "${alacritty_config_dir}"
fi

if [ -d "${rofi_config_dir}" ]; then
    rm -rf "${rofi_config_dir}"
fi

if [ -d "${nvim_config_dir}" ]; then
    rm -rf "${nvim_config_dir}"
fi

if [ -d "$zathura_config_dir" ]; then
    rm -rf "${zathura_config_dir}"
fi

if [ -d "$polybar_config_dir" ]; then
    rm -rf "${polybar_config_dir}"
fi

dotfiles_dir=$(pwd)

# create symbolic link of alacritty
ln -sf ${dotfiles_dir}/.config/i3 ${config_dir}
# create symbolic link of polybar
ln -sf ${dotfiles_dir}/.config/polybar ${config_dir}
# create symbolic link of alacritty
ln -sf ${dotfiles_dir}/.config/alacritty ${config_dir}
# create symbolic link of neovim
ln -sf ${dotfiles_dir}/.config/nvim ${config_dir}
# create symbolic link of zathura
ln -sf ${dotfiles_dir}/.config/zathura ${config_dir}
# create symbolic link of rofi
ln -sf ${dotfiles_dir}/.config/rofi ${config_dir}

# create symbolic link of zshrc
ln -sf ${dotfiles_dir}/.zshrc ${dir}

# create symbolic link of zprofile
ln -sf ${dotfiles_dir}/.zprofile ${dir}

# create symbolic link of tmux configure
ln -sf ${dotfiles_dir}/.tmux.conf ${dir}

./dependencies-install/neovim-installer.sh
./dependencies-install/tmux-installer.sh
./dependencies-install/zsh-installer.sh
./dependencies-install/github-cli-installer.sh
