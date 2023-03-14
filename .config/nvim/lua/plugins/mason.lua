local M = {}

function M.setup()
	require("mason").setup()

	require("mason-lspconfig").setup({
		ensure_installed = {
            "pyright",
			"bashls",
			"lua_ls",
			"rust_analyzer",
			"bashls",
			"tailwindcss",
			"emmet_ls",
			"html",
			"bufls",
			"yamlls",
			"cmake",
			"marksman",
			"tsserver",
		},
	})

	require("mason-null-ls").setup({
		ensure_installed = {
            "google-java-format",
			"shfmt",
			"prettier",
			"buf",
			"stylua",
			"autopep8",
			"flake8",
		},
	})
end

return M
