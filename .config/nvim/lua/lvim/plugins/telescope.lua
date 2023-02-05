local M = {}

function M.setup()
	require("telescope").setup({
		defaults = {
			mappings = {
				i = {
					["<Esc>"] = require("telescope.actions").close,
				},
			},
			file_ignore_patterns = { "node_modules" },
		},
		pickers = {
			find_files = {
				hidden = true,
			},
		},
	})
end

return M
