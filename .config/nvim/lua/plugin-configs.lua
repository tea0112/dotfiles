require("lualine").setup({
    options = { theme = "tokyonight" },
})

require("better_escape").setup({
    mapping = { "jk", "jj" }, -- a table with mappings to use
    --  timeout = vim.o.timeoutlen, -- the time in which the keys must be hit in ms. Use option timeoutlen by default
    timeout = 150, -- the time in which the keys must be hit in ms. Use option timeoutlen by default
    clear_empty_lines = false, -- clear line after escaping if there is only whitespace
    keys = "<Esc>", -- keys used for escaping, if it is a function will use the result everytime
    -- example(recommended)
    -- keys = function()
    --   return vim.api.nvim_win_get_cursor(0)[2] > 1 and '<esc>l' or '<esc>'
    -- end,
})

require("nvim-treesitter.configs").setup({
    -- Install languages synchronously (only applied to `ensure_installed`)
    sync_install = false,

    -- List of parsers to ignore installing
    ignore_install = {},

    highlight = {
        -- -- A list of parser names, or "all"
        ensure_installed = { "all" },

        -- Automatically install missing parsers when entering buffer
        auto_install = true,

        -- NOTE: these are the names of the parsers and not the filetype. (for example if you want to
        --disable highlighting for the `tex` filetype, you need to include `latex` in this list as this is
        --the name of the parser)
        -- list of language that will be disabled
        disable = {},

        -- Setting this to true will run `:h syntax` and tree-sitter at the same time.
        -- Set this to `true` if you depend on 'syntax' being enabled (like for indentation).
        -- Using this option may slow down your editor, and you may see some duplicate highlights.
        -- Instead of true it can also be a list of languages
        additional_vim_regex_highlighting = false,
    },
})

-- Attaches to every FileType mode
require 'colorizer'.setup()

require 'FTerm'.setup {
    border     = 'double',
    dimensions = {
        height = 1,
        width = 1,
    },
}

require 'nvim-tree'.setup({
    actions = {
        open_file = {
            quit_on_open = true
        }
    },
    git = {
        enable = true,
        ignore = false,
        timeout = 500,
    },
})

require('gitsigns').setup {}

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

require 'dap-go'.setup()
local dap = require 'dap'
local dapui = require 'dapui'
dap.adapters.delve = {
    type = 'server',
    port = '${port}',
    executable = {
        command = 'dlv',
        args = { 'dap', '-l', '127.0.0.1:${port}' },
    }
}

-- https://github.com/go-delve/delve/blob/master/Documentation/usage/dlv_dap.md
dap.configurations.go = {
    {
        type = "go",
        name = "Debug",
        request = "launch",
        program = "${file}",
    },
    {
        type = "go",
        name = "Debug Package",
        request = "launch",
        program = "./${relativeFileDirname}",
    },
    {
        type = "go",
        name = "Debug test", -- configuration for debugging test files
        request = "launch",
        mode = "test",
        program = "${file}"
    },
    -- works with go.mod packages and sub packages
    {
        type = "go",
        name = "Debug test package",
        request = "launch",
        mode = "test",
        program = "./${relativeFileDirname}"
    }
}

dapui.setup {} -- use default

dap.listeners.after.event_initialized["dapui_config"] = function()
    dapui.open()
end
dap.listeners.before.event_terminated["dapui_config"] = function()
    dapui.close()
end
dap.listeners.before.event_exited["dapui_config"] = function()
    dapui.close()
end

require 'nvim-lightbulb'.setup { autocmd = { enabled = true } }
require 'nvim-autopairs'.setup {}
