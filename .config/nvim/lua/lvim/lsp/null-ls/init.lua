local M = {}

function M.setup(on_attach, capabilities)
    local null_ls = require("null-ls")

    local formatting = null_ls.builtins.formatting
    local diagnostics = null_ls.builtins.diagnostics
    local completion = null_ls.builtins.completion

    null_ls.setup {
        sources = {
            -- -- -- -- --
            --  format  --
            -- -- -- -- --
            formatting.autopep8,
            formatting.clang_format.with({
                extra_args = {
                    "--style=Google",
                },
            }),
            formatting.shfmt,
            formatting.prettier,
            formatting.jq,
            formatting.buf,
            -- -- -- -- -- --
            -- diagnostic  --
            -- -- -- -- -- --
            diagnostics.buf,
            diagnostics.eslint,
            diagnostics.flake8,
            diagnostics.shellcheck,
            -- -- -- -- -- --
            -- completion  --
            -- -- -- -- -- --
            -- -- -- --
            -- hook  --
            -- -- -- --
            capabilities = capabilities,
            on_attach = on_attach,
        },
    }
end

return M
