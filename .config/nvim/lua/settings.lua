-------------------
-- global config --
-------------------
local tab_number = 4

vim.g.mapleader = " "

vim.opt.number = true
vim.opt.autoindent = true
vim.opt.smarttab = true
vim.opt.tabstop = tab_number
vim.opt.shiftwidth = tab_number
vim.opt.softtabstop = tab_number
vim.opt.expandtab = true
vim.opt.mouse = 'a'
vim.opt.clipboard = 'unnamedplus'
--vim.opt.termguicolors = true

vim.api.nvim_create_autocmd("FileType", {
    pattern = { "cpp", "js", "json" },
    callback = function()
        SetIndent(2)
    end
})

