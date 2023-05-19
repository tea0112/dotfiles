local M = {}

function M.setup()
    require("tokyonight").setup({
        style = "moon",
        transparent = true,
        styles = {
            comments = { italic = false },
            keywords = { italic = false },
        },
    })
end

return M
