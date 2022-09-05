local M = {}

function M.setup(diagnostic)
    return {
        diagnostic.buf,
        diagnostic.eslint,
        diagnostic.flake8,
        diagnostic.shellcheck,
    }
end

return M
