------------------------------------------
------------------------------------------
------------- key mappings ---------------
------------------------------------------
------------------------------------------

-- noremap, silent option
local ns_opts = { noremap = true, silent = true }

------------------------------------------
------------------------------------------
------------- normal mode ----------------
------------------------------------------
------------------------------------------

-- FTerm
Utils.map("n", "<A-i>", "<CMD>lua require('FTerm').toggle()<CR>", {noremap = true, silent = false})

-- run lua command fast
Utils.map("n", "<C-l>", ":lua ", {noremap = true, silent = false})

-- glow
Utils.map("n", "<Leader>m", ":w <CR>:Glow <CR>", ns_opts)

-- new line without enable insert mode
Utils.map("n", "<Leader>o", "o<ESC>", ns_opts)
Utils.map("n", "<Leader>0", "O<ESC>", ns_opts)

-- source lua neovim
Utils.map("n", "<Leader>sv", ":luafile $MYVIMRC<CR>", ns_opts)

-- delete to hole
Utils.map("n", "dd", "\"_dd", ns_opts)

-- paste from y
Utils.map("n", "p", "\"yp", ns_opts)

-- paste from y using leader
Utils.map("n", "<Leader>p", "\"+p", ns_opts)

-- copy to y
Utils.map("n", "yy", "\"yyy", ns_opts)

-- cut to y
Utils.map("n", "x", "\"yx", ns_opts)

-- copy to plus register
Utils.map("n", "<Leader>y", "\"+y", ns_opts)

-- turn off highlight
Utils.map("n", "<Esc>", ":noh<CR><Esc>", ns_opts)

-- show and select buffer
Utils.map("n", "<Leader>lb", ":ls<CR>:b ", ns_opts)

-- nvim-tree toggle
Utils.map("n", "<C-n>", ":NvimTreeToggle<CR>", ns_opts)
Utils.map("n", "<Leader>r", ":NvimTreeRefresh<CR> ", ns_opts)

-- move between window
Utils.map("n", "<A-h>", ":wincmd h<CR>", ns_opts)
Utils.map("n", "<A-j>", ":wincmd j<CR>", ns_opts)
Utils.map("n", "<A-k>", ":wincmd k<CR>", ns_opts)
Utils.map("n", "<A-l>", ":wincmd l<CR>", ns_opts)

-- easymotion
Utils.map("n", "f", "<leader><leader>f", {})
Utils.map("n", "<Leader>f", "<leader><leader>F", {})

-- telescope
Utils.map("n", "<A-f>", "<cmd>Telescope find_files<cr>", ns_opts)
Utils.map("n", "<A-g>", "<cmd>Telescope live_grep<cr>", ns_opts)
Utils.map("n", "<A-b>", "<cmd>Telescope buffers<cr>", ns_opts)

-- lsp
Utils.map("n", "<Leader>lf", ":lua vim.lsp.buf.formatting()<CR>", ns_opts)

------------------------------------------
------------------------------------------
------------- insert mode ----------------
------------------------------------------
------------------------------------------

-- move between window
Utils.map("i", "<A-h>", "<C-\\><C-N>:wincmd h<CR>", ns_opts)
Utils.map("i", "<A-j>", "<C-\\><C-N>:wincmd j<CR>", ns_opts)
Utils.map("i", "<A-k>", "<C-\\><C-N>:wincmd k<CR>", ns_opts)
Utils.map("i", "<A-l>", "<C-\\><C-N>:wincmd l<CR>", ns_opts)

Utils.map("i", "\"", "\"\"<left>", ns_opts)
Utils.map("i", "\'", "\'\'<left>", ns_opts)
Utils.map("i", "(", "()<left>", ns_opts)
Utils.map("i", "[", "[]<left>", ns_opts)
Utils.map("i", "{", "{}<left>", ns_opts)
Utils.map("i", "{<CR>", "{<CR>}<ESC>O", ns_opts)
Utils.map("i", "{;<CR>", "{<CR>};<ESC>O", ns_opts)

-- jk to ESC
Utils.map("i", "jk", "<Esc>", ns_opts)

------------------------------------------
------------------------------------------
------------- visual mode ----------------
------------------------------------------
------------------------------------------

-- copy to y
Utils.map("v", "y", "\"yy", ns_opts)

Utils.map("v", "<Leader>f", "<leader><leader>F", {})
Utils.map("v", "f", "<leader><leader>f", {})

-- delete to hole
Utils.map("v", "d", "\"_d", ns_opts)

-- paste from y
Utils.map("v", "p", "\"yp", ns_opts)

-- paste from y using leader
Utils.map("v", "<Leader>p", "\"+p", ns_opts)

-- copy to plus register
Utils.map("v", "<Leader>y", "\"+y", ns_opts)

-- cut to plus register
Utils.map("v", "<Leader>x", "\"+x", ns_opts)

-- cut to y
Utils.map("v", "x", "\"yx", ns_opts)

------------------------------------------
------------------------------------------
------------------------------------------

-- move between window
Utils.map("t", "<A-h>", "<C-\\><C-N><C-w>h", ns_opts)
Utils.map("t", "<A-j>", "<C-\\><C-N><C-w>j", ns_opts)
Utils.map("t", "<A-k>", "<C-\\><C-N><C-w>k", ns_opts)
Utils.map("t", "<A-l>", "<C-\\><C-N><C-w>l", ns_opts)

Utils.map("t", "<A-i>", "<C-\\><C-n><CMD>lua require('FTerm').toggle()<CR>", ns_opts)
