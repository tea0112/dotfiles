local M = {}

function M.setup()
	local ns_opts = { noremap = true, silent = true }
	-- move between window
	Utils.map("i", "<A-h>", "<C-\\><C-N>:wincmd h<CR>", ns_opts)

	Utils.map("i", "<A-j>", "<C-\\><C-N>:wincmd j<CR>", ns_opts)

	Utils.map("i", "<A-k>", "<C-\\><C-N>:wincmd k<CR>", ns_opts)

	Utils.map("i", "<A-l>", "<C-\\><C-N>:wincmd l<CR>", ns_opts)
	--
	-- jk to ESC
	Utils.map("i", "jk", "<Esc>", ns_opts)
end

return M
