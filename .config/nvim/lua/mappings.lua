------------------------------------------
------------------------------------------
------------- key mappings ---------------
------------------------------------------
------------------------------------------

local utils = require("utils")

-- noremap, silent option
local ns_opts = { noremap = true, silent = true }

------------------------------------------
------------------------------------------
------------- normal mode ----------------
------------------------------------------
------------------------------------------

-- format file
-- utils.map("n", "<space>f", ":lua vim.lsp.buf.formatting()<CR>", ns_opts)

-- turn off highlight
utils.map("n", "<Esc>", ":noh<CR><Esc>", ns_opts)

-- show and select buffer
utils.map("n", "<Leader>l", ":ls<CR>:b ", ns_opts)

-- NERDTree toggle
utils.map("n", "<C-t>", ":NERDTreeToggle<CR>", ns_opts)

-- move between window
utils.map("n", "<A-h>", ":wincmd h<CR>", ns_opts)
utils.map("n", "<A-j>", ":wincmd j<CR>", ns_opts)
utils.map("n", "<A-k>", ":wincmd k<CR>", ns_opts)
utils.map("n", "<A-l>", ":wincmd l<CR>", ns_opts)

-- easymotion
utils.map("n", "F", "<leader><leader>F", {})
utils.map("n", "f", "<leader><leader>f", {})

-- toggle terminal
--utils.map("n", "<Leader>t", ":FloatermToggle --height=0.6 --width=0.4<CR>", ns_opts)
utils.map("n", "<Leader>t", ":FloatermShow<CR>", ns_opts)

-- open terminal
utils.map("n", "<F1>", ":FloatermNew! --height=0.6 --width=0.4 cd %:p:h<CR>", ns_opts)

-- telescope
utils.map("n", "<Leader>ff", "<cmd>Telescope find_files<cr>", ns_opts)
utils.map("n", "<Leader>fg", "<cmd>Telescope live_grep<cr>", ns_opts)
utils.map("n", "<Leader>fb", "<cmd>Telescope buffers<cr>", ns_opts)
utils.map("n", "<Leader>fh", "<cmd>Telescope help_tags<cr>", ns_opts)

-- delete to hole register

------------------------------------------
------------------------------------------
------------- insert mode ----------------
------------------------------------------
------------------------------------------

-- move between window
utils.map("i", "<A-h>", "<C-\\><C-N>:wincmd h<CR>", ns_opts)
utils.map("i", "<A-j>", "<C-\\><C-N>:wincmd j<CR>", ns_opts)
utils.map("i", "<A-k>", "<C-\\><C-N>:wincmd k<CR>", ns_opts)
utils.map("i", "<A-l>", "<C-\\><C-N>:wincmd l<CR>", ns_opts)

utils.map("i", "\"", "\"\"<left>", ns_opts)
utils.map("i", "\'", "\'\'<left>", ns_opts)
utils.map("i", "(", "()<left>", ns_opts)
utils.map("i", "[", "[]<left>", ns_opts)
utils.map("i", "{", "{}<left>", ns_opts)
utils.map("i", "{<CR>", "{<CR>}<ESC>O", ns_opts)
utils.map("i", "{;<CR>", "{<CR>};<ESC>O", ns_opts)

-- jk to ESC
utils.map("i", "jk", "<Esc>", ns_opts)

------------------------------------------
------------------------------------------
------------- visual mode ----------------
------------------------------------------
------------------------------------------

utils.map("v", "F", "<leader><leader>F", {})
utils.map("v", "f", "<leader><leader>f", {})

------------------------------------------
------------------------------------------
------------- terminal mode --------------
------------------------------------------
------------------------------------------

-- move between window
utils.map("t", "<A-h>", "<C-\\><C-N><C-w>h", ns_opts)
utils.map("t", "<A-j>", "<C-\\><C-N><C-w>j", ns_opts)
utils.map("t", "<A-k>", "<C-\\><C-N><C-w>k", ns_opts)
utils.map("t", "<A-l>", "<C-\\><C-N><C-w>l", ns_opts)

-- turn off terminal
utils.map("t", "<Esc>", "<C-\\><C-n>:FloatermHide<CR>", ns_opts)
