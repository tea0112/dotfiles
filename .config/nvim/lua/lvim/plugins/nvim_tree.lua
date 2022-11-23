local M = {}

function M.setup()
	require("nvim-tree").setup({
		view = {
			adaptive_size = true,
		},
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
		renderer = {
			group_empty = true,
		},
	})
end

return M
