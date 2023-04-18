-- Holding control gives F25-F36
-- Holding alt gives F49-F60
-- Holding ctrl + shift gives F37-F48
vim.api.nvim_set_keymap("n", "<F8>", ":GoBreakToggle<CR>", { silent = true, noremap = true })
