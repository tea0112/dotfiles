local M = {}

function M.setup()
	local ns_opts = { noremap = true, silent = true }

	Utils.map("v", "F", "<leader><leader>F", {})
	Utils.map("v", "f", "<leader><leader>f", {})

	-- delete to hole
	Utils.map("v", "d", '"_d', ns_opts)

	-- paste from plus register
	Utils.map("v", "<Leader>p", '"+p', ns_opts)

	-- copy to plus register
	Utils.map("v", "<Leader>y", '"+y', ns_opts)

	-- cut to plus register
	Utils.map("v", "<Leader>x", '"+x', ns_opts)
end

return M
