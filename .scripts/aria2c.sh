#!/bin/bash

package=aria2
if ! pacman -Qs $package > /dev/null ; then
    sudo pacman -S aria2
fi

aria2c -c -s 16 -x 16 -k 1M -j 1 "$1"

