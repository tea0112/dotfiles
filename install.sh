#!/bin/bash

dir="/home/$USER"
zshrc_dir="${dir}/.zshrc"
zprofile_dir="${dir}/.zprofile"
tmux_conf_dir="${dir}/.tmux.conf"

config_dir="${dir}/.config"

#i3_config_dir="${config_dir}/i3"
alacritty_config_dir="${config_dir}/alacritty"
nvim_config_dir="${config_dir}/nvim"

if [ -f $tmux_conf_dir ]; then
    rm -rf $tmux_conf_dir
fi

if [ -f $zshrc_dir ]; then
    rm -rf $zshrc_dir 
fi

if [ -f $zprofile_dir ]; then
    rm -rf $zprofile_dir
fi

if [ -d $alacritty_config_dir ]; then
    rm -rf $alacritty_config_dir
fi

if [ -d $nvim_config_dir ]; then
    rm -rf $nvim_config_dir
fi

dotfiles_dir=$(pwd)

# create symbolic link of alacritty
ln -sf $dotfiles_dir/.config/alacritty ${config_dir}
# create symbolic link of neovim
ln -sf $dotfiles_dir/.config/nvim ${config_dir}

# create symbolic link of zshrc
ln -sf $dotfiles_dir/.zshrc $dir
# create symbolic link of zprofile
ln -sf $dotfiles_dir/.zprofile $dir
# create symbolic link of tmux configure
ln -sf $dotfiles_dir/.tmux.conf $dir
