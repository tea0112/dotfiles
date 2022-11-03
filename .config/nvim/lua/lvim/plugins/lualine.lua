local M = {}

function M.setup()
	require("lualine").setup({
		options = { theme = "nord" },
	})
end

return M
