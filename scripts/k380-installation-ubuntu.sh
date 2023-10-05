#!/bin/bash

sudo apt install build-essential
cd /tmp || exit
git clone https://github.com/jergusg/k380-function-keys-conf
cd k380-function-keys-conf || exit
sudo make install
sudo ./fn_on.sh
cd ..
rm -rf k380-function-keys-conf
