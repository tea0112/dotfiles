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
--vim.opt.mouse = "a"
vim.opt.relativenumber = true

--for linux
if IsWSL() then
	vim.cmd([[
    let g:clipboard = {
          \   'name': 'win32yank-wsl',
          \   'copy': {
          \      '+': 'win32yank.exe -i --crlf',
          \      '*': 'win32yank.exe -i --crlf',
          \    },
          \   'paste': {
          \      '+': 'win32yank.exe -o --lf',
          \      '*': 'win32yank.exe -o --lf',
          \   },
          \   'cache_enabled': 0,
          \ }
    ]])
else
	vim.opt.clipboard = "unnamedplus"
end

vim.o.sessionoptions = "blank,buffers,curdir,folds,help,tabpages,winsize,winpos,terminal"

vim.api.nvim_create_user_command("Diff", function()
	vim.cmd("w !git diff --no-index % -")
end, {})

-- improves Go syntax highlighting
vim.g.go_highlight_operators = 1
vim.g.go_highlight_functions = 1
vim.g.go_highlight_function_parameters = 1
vim.g.go_highlight_function_calls = 1
vim.g.go_highlight_types = 1
vim.g.go_highlight_fields = 1

