#!/bin/bash

go install github.com/google/yamlfmt/cmd/yamlfmt@latest
go install mvdan.cc/sh/v3/cmd/shfmt@latest
npm install -g prettier
