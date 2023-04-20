local M = {}

function M.setup()
	local ns_opts = { noremap = true, silent = true }

	-- move between window
	Utils.map("t", "<A-h>", "<C-\\><C-N><C-w>h", ns_opts)
	Utils.map("t", "<A-j>", "<C-\\><C-N><C-w>j", ns_opts)
	Utils.map("t", "<A-k>", "<C-\\><C-N><C-w>k", ns_opts)
	Utils.map("t", "<A-l>", "<C-\\><C-N><C-w>l", ns_opts)

	-- esc for terminal
	Utils.map("t", "<ESC>", "<C-\\><C-n>", ns_opts)

    Utils.map("t", "<A-i>", "<C-\\><C-n><CMD>ToggleTermToggleAll<CR>", { noremap = true, silent = false })
end

return M
