local M = {}

function M.setup(diagnostic)
	return {
		--diagnostic.eslint,
		diagnostic.flake8,
		--diagnostic.checkstyle.with({
		--	extra_args = { "-c", "/google_checks.xml" },
		--}),
	}
end

return M
