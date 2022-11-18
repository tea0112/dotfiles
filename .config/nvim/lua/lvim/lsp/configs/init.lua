local M = {}

function M.setup(lspconfig, on_attach, capabilities)
	require("lvim.lsp.configs.sumneko_lua_ls").setup(lspconfig)
	require("lvim.lsp.configs.null_ls").setup(on_attach, capabilities)

	local utils = require("lvim.utils")
	local neovim_config = utils.GetConfig("$HOME/.neovim-config.json")
	--example config file
	--{
	--  "lsp": {
	--    "off": [
	--      "tsserver"
	--    ]
	--  }
	--}

	local function default_attach_capabilities()
		return {
			on_attach = on_attach,
			capabilities = capabilities,
		}
	end

	local lsp_mapping_table = {}

	lsp_mapping_table["pyright"] = lspconfig.pyright

	lsp_mapping_table["clangd"] = lspconfig.clangd

	lsp_mapping_table["rust_analyzer"] = lspconfig.rust_analyzer

	lsp_mapping_table["gopls"] = lspconfig.gopls

	lsp_mapping_table["bashls"] = lspconfig.bashls

	lsp_mapping_table["tailwindcss"] = lspconfig.tailwindcss

	lsp_mapping_table["emmet_ls"] = lspconfig.emmet_ls

	lsp_mapping_table["html"] = lspconfig.html

	lsp_mapping_table["bufls"] = lspconfig.bufls

	lsp_mapping_table["yamlls"] = lspconfig.yamlls

	lsp_mapping_table["cmake"] = lspconfig.cmake

	lsp_mapping_table["marksman"] = lspconfig.marksman

	lsp_mapping_table["jsonnet_ls"] = lspconfig.jsonnet_ls

	lsp_mapping_table["tsserver"] = lspconfig.tsserver

	if #neovim_config.lsp.off > 0 then
		for _, off in pairs(neovim_config.lsp.off) do
			for key, lsp in pairs(lsp_mapping_table) do
				if key ~= off then
					print(key, off)
					lsp.setup(default_attach_capabilities())
				end
			end
		end
	else
		for _, lsp in pairs(lsp_mapping_table) do
			lsp.setup(default_attach_capabilities())
		end
	end
end

return M
