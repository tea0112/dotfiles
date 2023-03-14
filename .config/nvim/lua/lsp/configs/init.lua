local M = {}

function M.setup(lspconfig, on_attach, capabilities)
	require("lsp.configs.lua_ls").setup(lspconfig)
	require("lsp.configs.null_ls").setup(on_attach, capabilities)

	require("lspconfig")["pyright"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["clangd"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["rust_analyzer"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["gopls"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["bashls"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["tailwindcss"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["emmet_ls"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["html"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["bufls"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["yamlls"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["cmake"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["marksman"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["jsonnet_ls"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

	require("lspconfig")["tsserver"].setup({
		on_attach = on_attach,
		capabilities = capabilities,
	})

    --require("lspconfig")["jdtls"].setup({
        --on_attach = on_attach,
        --capabilities = capabilities,
    --})
end

return M
