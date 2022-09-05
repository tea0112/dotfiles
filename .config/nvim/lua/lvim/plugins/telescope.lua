local M = {}

function M.setup()
    require 'telescope'.setup {
        defaults = {
            mappings = {
                i = {
                    ["<Esc>"] = require 'telescope.actions'.close,
                },
            },
            file_ignore_patterns = { "node_modules" },
        }
    }
end

return M
