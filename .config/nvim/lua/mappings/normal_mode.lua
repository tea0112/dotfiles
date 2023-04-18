-- Holding control gives F25-F36
-- Holding alt gives F49-F60
-- Holding ctrl + shift gives F37-F48

local M = {}

function M.setup()
	local ns_opts = { noremap = true, silent = true }

	Utils.map("n", "<C-w>", ":bd!<CR>", ns_opts)

	Utils.map("n", "E", "2e", ns_opts)

	Utils.map("n", "<leader>;", ":w<CR>", ns_opts)

	Utils.map("n", "<C-e>", "5<C-e>", ns_opts)
	Utils.map("n", "<C-y>", "5<C-y>", ns_opts)

	--telescope
	Utils.map("n", ";a", ":Telescope find_files<CR>", ns_opts)
	Utils.map("n", ";s", ":Telescope live_grep<CR>", ns_opts)
	Utils.map("n", ";d", ":Telescope buffers<CR>", ns_opts)
	Utils.map("n", ";f", ":Telescope help_tags<CR>", ns_opts)

	-- 'edit alternate file' convenience mapping
	Utils.map("n", "<A-Left>", "gT", ns_opts)
	Utils.map("n", "<A-Right>", "gt", ns_opts)

	-- 'edit alternate file' convenience mapping
	Utils.map("n", "<BS>", "<C-^>", ns_opts)

	-- FTerm
	Utils.map("n", "<A-i>", "<CMD>lua require('FTerm').toggle()<CR>", { noremap = true, silent = false })

	-- run lua command fast
	Utils.map("n", "<C-l>", ":lua ", { noremap = true, silent = false })

	-- source lua neovim
	Utils.map("n", "<Leader>sv", ":luafile $MYVIMRC<CR>", ns_opts)

	-- delete to hole
	Utils.map("n", "d", '"_d', ns_opts)

	-- paste from y using leader
	Utils.map("n", "<Leader>p", '"+p', ns_opts)

	-- copy to plus register
	Utils.map("n", "<Leader>y", '"+y', ns_opts)

	-- turn off highlight
	Utils.map("n", "<Esc>", ":noh<CR><Esc>", ns_opts)

	-- nvim-tree toggle
	Utils.map("n", "<C-n>", ":NvimTreeToggle<CR>", ns_opts)

	-- move between window
	Utils.map("n", "<A-h>", ":wincmd h<CR>", ns_opts)
	Utils.map("n", "<A-j>", ":wincmd j<CR>", ns_opts)
	Utils.map("n", "<A-k>", ":wincmd k<CR>", ns_opts)
	Utils.map("n", "<A-l>", ":wincmd l<CR>", ns_opts)

	-- easymotion
	Utils.map("n", "f", "<leader><leader>f", {})
	Utils.map("n", "F", "<leader><leader>F", {})
end

return M
