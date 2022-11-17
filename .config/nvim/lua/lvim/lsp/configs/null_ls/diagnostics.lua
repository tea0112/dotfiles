local M = {}

function M.setup(diagnostic)
	return {
		--diagnostic.luacheck,
		diagnostic.buf,
		--diagnostic.eslint,
		diagnostic.flake8,
        --diagnostic.shellcheck,
	}
end

return M
