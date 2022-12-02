local M = {}

function M.setup(formatting)
	return {
		formatting.autopep8,
		formatting.google_java_format,
		formatting.clang_format.with({
			extra_args = {
				"--style=Google",
			},
		}),
		formatting.shfmt,
		formatting.prettier,
		formatting.jq,
		formatting.buf,
		formatting.stylua,
	}
end

return M
