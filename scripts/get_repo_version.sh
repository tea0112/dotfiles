#!/bin/bash

repo=$1
curl "https://api.github.com/repos/${repo}/releases/latest" -s | jq -r '.name'
