local M = {}

function M.setup()
    require("tokyonight").setup({
        style = "storm",
        styles = {
            comments = { italic = false },
            keywords = { italic = false },
        }
    })
end

return M
