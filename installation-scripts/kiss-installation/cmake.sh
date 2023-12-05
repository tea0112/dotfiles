#!/bin/bash

sudo whoami
mkdir -p ~/.local/bin

version=$(curl "https://api.github.com/repos/kitware/cmake/releases/latest" -s | jq -r '.tag_name')
version_number=$(echo "${version}" | cut -c 2-${#version})
#echo "https://github.com/Kitware/CMake/releases/download/${version}/cmake-${version_number}-linux-x86_64.tar.gz"

cmake_file_name="cmake-${version_number}-linux-x86_64.tar.gz"

rm -rf "/tmp/cmake*"
wget -P /tmp "https://github.com/Kitware/CMake/releases/download/${version}/cmake-${version_number}-linux-x86_64.tar.gz"

tar xvf "/tmp/${cmake_file_name}" -C /tmp
extracted_cmake_file_name="cmake-${version_number}-linux-x86_64"
sudo mv "/tmp/$extracted_cmake_file_name" /opt/cmake
