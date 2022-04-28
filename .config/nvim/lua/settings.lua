-------------------
-- global config --
-------------------
local tab_number = 4

vim.g.mapleader = ","

local set = vim.opt
set.number = true
set.autoindent = true
set.smarttab = true
set.tabstop = tab_number
set.shiftwidth = tab_number
set.softtabstop = tab_number
set.expandtab = true
set.mouse = 'a'

vim.api.nvim_command([[
]])
