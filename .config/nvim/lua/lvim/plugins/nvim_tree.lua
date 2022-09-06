local M = {}

function M.setup()
	require("nvim-tree").setup({
		actions = {
			open_file = {
				quit_on_open = true,
			},
		},
		git = {
			enable = true,
			ignore = false,
			timeout = 500,
		},
	})
end

return M
