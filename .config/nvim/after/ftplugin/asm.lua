vim.cmd("syntax on")
vim.cmd("set syntax=nasm")
vim.api.nvim_set_keymap("n", ",f", ":w<CR>:!nasmfmt %<CR>", {})
