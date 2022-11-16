local M = {}

function M.setup()
	require("tokyonight").setup({
		style = "storm",
		transparent = true,
		styles = {
			comments = { italic = false },
			keywords = { italic = false },
		},
	})
end

return M
