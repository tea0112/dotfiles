local M = {}

function M.setup()
    require("mason").setup()

    require("mason-lspconfig").setup({
        ensure_installed = {
            "bashls",
            "sumneko_lua",
            "rust_analyzer",
            "clangd",
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
            "shfmt",
            "prettier",
            "buf",
            "stylua",
            "autopep8",
            "flake8",
            "",
            "",
            "",
            "",
            "",
            
        },
    })
end

return M
