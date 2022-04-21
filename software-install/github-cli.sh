#!/bin/bash

options="-d"
ubuntu_option="${options}=ubuntu"
arch_option="${options}=arch"

install()
{
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt update
  sudo apt install -y gh
}

case $1 in
  $ubuntu_option)
    install
    ;;
  $arch_option)
    sudo pacman -S github-cli
    ;;
  *)
    echo -e "-d=your distro\nfor example:\n\tubuntu\n\tarch"
    ;;
esac
