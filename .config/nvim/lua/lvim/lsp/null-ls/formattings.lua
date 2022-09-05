local M = {}

function M.setup(formatting)
    return {
        formatting.autopep8,
        formatting.clang_format.with {
            extra_args = {
                "--style=Google",
            },
        },
        formatting.shfmt,
        formatting.prettier,
        formatting.jq,
        formatting.buf
    }
end

return M
