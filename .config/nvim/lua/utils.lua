local utils = {}

function utils.map(mode, left, right, opts)
	if opts then
		vim.api.nvim_set_keymap(mode, left, right, opts)
	end
end

return utils
