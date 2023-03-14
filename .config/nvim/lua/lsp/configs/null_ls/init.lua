local M = {}
local utils = require("utils")

function M.setup(on_attach, capabilities)
	local null_ls = require("null-ls")

	local formatting = null_ls.builtins.formatting
	local diagnostic = null_ls.builtins.diagnostics
	local completion = null_ls.builtins.completion

	local formatting_configs = require("lsp.configs.null_ls.formattings").setup(formatting)
	local diagnostics_configs = require("lsp.configs.null_ls.diagnostics").setup(diagnostic)

	local sources = {
		capabilities = capabilities,
		on_attach = on_attach,
	}

	utils.MergeTable(sources, formatting_configs)
	utils.MergeTable(sources, diagnostics_configs)

	null_ls.setup({ sources = sources })
end

return M
