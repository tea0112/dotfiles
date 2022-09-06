local M = {}

function M.setup()
	require("FTerm").setup({
		border = "double",
		dimensions = {
			height = 1,
			width = 1,
		},
	})
end

return M
