local M = {}

function M.setup()
    require("mason").setup()

    require("mason-lspconfig").setup({
        ensure_installed = {
            "pyright",
            "bashls",
            "lua_ls",
            "rust_analyzer",
            "tailwindcss",
            "emmet_ls",
            "html",
            "bufls",
            "yamlls",
            "marksman",
            "tsserver",
            "angularls",
        },
    })

    require("mason-null-ls").setup({
        ensure_installed = {
            "google-java-format",
            "shfmt",
            "shellcheck",
            "prettier",
            "buf",
            "stylua",
            "autopep8",
            "flake8",
            "spell"
        },
    })
end

return M
