local M = {}

function M.setup()
	local autopairs = require("nvim-autopairs")
	autopairs.setup({
		disable_filetype = { "TelescopePrompt", "vim" },
		check_ts = true,
		disable_in_macro = false, -- disable when recording or executing a macro
		disable_in_visualblock = false, -- disable when insert after visual block mode
		ignored_next_char = string.gsub([[ [%w%%%'%[%"%.] ]], "%s+", ""),
		enable_moveright = true,
		enable_afterquote = true, -- add bracket pairs after quote
		enable_check_bracket_line = true, --- check bracket in same line
		enable_bracket_in_quote = true, --
	})
	require("nvim-treesitter.configs").setup({ autopairs = { enable = true } })
end

return M
