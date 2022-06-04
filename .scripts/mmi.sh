#!/bin/bash

current_directory=$(pwd)
echo ${current_directory}
# manually make package for arch
# $1 url do not include '.git'
if [ $(echo ${1} | grep -i '.git') ]; then
    echo "Url do not include '.git'"
    exit 1
fi
package_name=$(echo ${1} | grep -oP '[^\/]+$')
rm -rf /tmp/${package_name}
git clone ${1} /tmp/${package_name}
cd /tmp/${package_name}
makepkg -si
cd ..
rm -rf /tmp/${package_name}
cd ${current_directory}
