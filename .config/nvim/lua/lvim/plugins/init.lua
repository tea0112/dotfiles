require("lvim.plugins.lualine").setup()

require("lvim.plugins.treesitter").setup()

require("lvim.plugins.dap_go").setup()

require("lvim.plugins.fterm").setup()

require("lvim.plugins.telescope").setup()

require("lvim.plugins.autopairs").setup()

require("lvim.plugins.better_escape").setup()

require("lvim.plugins.nvim_tree").setup()

require("lvim.plugins.onedark").setup()

require("lvim.plugins.tokyonight").setup()

require("lvim.plugins.nvim_cmp").setup()

require("nvim-lightbulb").setup({ autocmd = { enabled = true } })

require("nvim-autopairs").setup({})

require("structrue-go").setup({})

require("hierarchy-tree-go").setup({})

require("gitsigns").setup({})

require("colorizer").setup()

require("mason").setup()

require("mason-null-ls").setup({
	ensure_installed = nil,
	automatic_installation = true,
	automatic_setup = false,
})

vim.cmd([[colorscheme tokyonight-storm]])
