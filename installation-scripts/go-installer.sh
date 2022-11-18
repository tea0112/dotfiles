#!/bin/bash

sudo whoami
version=$(curl -s https://go.dev/dl/ | grep 'go.*.linux-amd64.tar.gz' -m1 -o)
wget -O "/tmp/$version" "https://dl.google.com/go/${version}"
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf "/tmp/$version"
