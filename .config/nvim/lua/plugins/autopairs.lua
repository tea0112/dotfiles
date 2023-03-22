local M = {}

function M.setup()
    local ok, npairs = pcall(require, "nvim-autopairs")
    if not ok then
        print("Something went wrong", npairs)
        return
    else
        npairs.setup({
            disable_filetype = { "TelescopePrompt" },
            fast_wrap = {
                map = "<M-e>",
                chars = { "{", "[", "(", '"', "'" },
                pattern = [=[[%'%"%)%>%]%)%}%,]]=],
                end_key = "$",
                keys = "qwertyuiopzxcvbnmasdfghjkl",
                check_comma = true,
                highlight = "Search",
                highlight_grey = "Comment",
            },
        })

        local cmp_autopairs = require("nvim-autopairs.completion.cmp")
        local cmp = require("cmp")
        cmp.event:on("confirm_done", cmp_autopairs.on_confirm_done())
    end
end

return M
