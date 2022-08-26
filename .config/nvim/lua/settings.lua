-------------------
-- global config --
-------------------

local tab_number = 4
vim.g.mapleader = " "
vim.g.cursorhold_updatetime = 100
vim.opt.termguicolors = true

vim.opt.number = true
vim.opt.autoindent = true
vim.opt.smarttab = true
vim.opt.tabstop = tab_number
vim.opt.shiftwidth = tab_number
vim.opt.softtabstop = tab_number
vim.opt.expandtab = true
vim.opt.mouse = 'a'
--for linux
vim.opt.clipboard = 'unnamedplus'
-- for wsl
--if vim.fn.has("wsl") then
--    vim.g.clipboard = {
--        name = "clip.exe (Copy Only)",
--        copy = {
--            ["+"] = "clip.exe",
--            ["*"] = "clip.exe"
--        },
--        paste = {
--            ["+"] = "clip.exe",
--            ["*"] = "clip.exe"
--        },
--        cache_enabled = true
--    }
--end
--for windows wsl
--vim.cmd([[
--let g:clipboard = {
--      \   'name': 'win32yank-wsl',
--      \   'copy': {
--      \      '+': 'win32yank.exe -i --crlf',
--      \      '*': 'win32yank.exe -i --crlf',
--      \    },
--      \   'paste': {
--      \      '+': 'win32yank.exe -o --lf',
--      \      '*': 'win32yank.exe -o --lf',
--      \   },
--      \   'cache_enabled': 0,
--      \ }
--]])
vim.o.sessionoptions="blank,buffers,curdir,folds,help,tabpages,winsize,winpos,terminal"

vim.g.tokyonight_italic_keywords = false
vim.cmd[[colorscheme tokyonight]]

vim.api.nvim_create_user_command("Diff", function()
    vim.cmd('w !git diff --no-index % -')
end, {})

