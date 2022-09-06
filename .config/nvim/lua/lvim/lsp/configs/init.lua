local M = {}

function M.setup(lspconfig, on_attach, capabilities)
	require("lvim.lsp.configs.sumneko_lua_ls").setup(lspconfig)
	require("lvim.lsp.configs.null_ls").setup(on_attach, capabilities)

	lspconfig.pyright.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.clangd.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.rust_analyzer.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.gopls.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.tsserver.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.bashls.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.jdtls.setup({
		cmd = { "jdtls" },
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.tailwindcss.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.emmet_ls.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.html.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	lspconfig.bufls.setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})
end

return M
