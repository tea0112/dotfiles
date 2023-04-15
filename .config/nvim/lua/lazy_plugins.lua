local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
    vim.fn.system({
        "git",
        "clone",
        "--filter=blob:none",
        "https://github.com/folke/lazy.nvim.git",
        "--branch=stable", -- latest stable release
        lazypath,
    })
end
vim.opt.rtp:prepend(lazypath)

local plugins = {
    "elkowar/yuck.vim",
    "mfussenegger/nvim-dap",
    "hrsh7th/cmp-nvim-lsp-document-symbol",
    "williamboman/mason-lspconfig.nvim",
    "williamboman/mason.nvim",
    "neovim/nvim-lspconfig",
    "jay-babu/mason-null-ls.nvim",
    "max397574/better-escape.nvim",
    {
        "kyazdani42/nvim-tree.lua",
        dependencies = {
            "kyazdani42/nvim-web-devicons", -- optional, for file icon
        },
        tag = "nightly",           -- optional, updated every week. (see issue #1193)
    },
    -- vim surround
    "tpope/vim-surround",
    -- easymotion
    "easymotion/vim-easymotion",
    -- fzf
    "junegunn/fzf",
    -- telescope
    {
        "nvim-telescope/telescope.nvim",
        dependencies = { { "nvim-lua/plenary.nvim" } },
    },
    { "nvim-treesitter/nvim-treesitter", build = ":TSUpdate" },
    -- cmp
    "hrsh7th/cmp-buffer",
    "hrsh7th/cmp-path",
    "hrsh7th/cmp-cmdline",
    "hrsh7th/nvim-cmp",      -- Autocompletion plugin
    "hrsh7th/cmp-nvim-lsp",  -- LSP source for nvim-cmp
    "L3MON4D3/LuaSnip",
    "saadparwaiz1/cmp_luasnip", -- Snippets source for nvim-cmp
    -- lualine
    {
        "nvim-lualine/lualine.nvim",
        dependencies = { "kyazdani42/nvim-web-devicons", opt = true },
    },
    -- null-ls
    {
        "jose-elias-alvarez/null-ls.nvim",
        dependencies = { "nvim-lua/plenary.nvim" },
    },
    -- git change show
    {
        "lewis6991/gitsigns.nvim",
        tag = "release",
    },
    -- git fugitive
    "tpope/vim-fugitive",
    -- markdown glow
    { "ellisonleao/glow.nvim",           branch = "main" },

    -- css color
    "norcalli/nvim-colorizer.lua",

    -- Fterm
    "numToStr/FTerm.nvim",

    -- vim go
    "fatih/vim-go",

    -- which key
    "folke/which-key.nvim",

    "leoluz/nvim-dap-go",
    {
        "nvim-telescope/telescope-dap.nvim",
    },
    {
        "mfussenegger/nvim-dap",
        dependencies = {
            "Pocco81/DAPInstall.nvim",
            "theHamsta/nvim-dap-virtual-text",
            "rcarriga/nvim-dap-ui",
            { "jbyuki/one-small-step-for-vimkind", module = "osv" },
        },
    },

    "antoinemadec/FixCursorHold.nvim",

    "kosayoda/nvim-lightbulb",

    {
        "rmagatti/auto-session",
        config = function()
            require("auto-session").setup({
                log_level = "info",
                auto_session_suppress_dirs = { "~/", "~/Projects" },
            })
        end,
    },

    "lukas-reineke/indent-blankline.nvim",

    "rafamadriz/friendly-snippets",

    "windwp/nvim-autopairs",

    "lambdalisue/suda.vim",

    "preservim/nerdcommenter",
    {
        "crusj/structrue-go.nvim",
        branch = "main",
    },
    {
        "crusj/hierarchy-tree-go.nvim",
        dependencies = "neovim/nvim-lspconfig",
    },
    "navarasu/onedark.nvim",
    {
        "iamcco/markdown-preview.nvim",
        run = function()
            vim.fn["mkdp#util#install"]()
        end,
    },
    "folke/tokyonight.nvim",
    "EdenEast/nightfox.nvim",
    "vimwiki/vimwiki",
    {
        "mfussenegger/nvim-jdtls",
        ft = { "java" },
    },
    {
        "ellisonleao/gruvbox.nvim",
    },
}

local opts = {}

require("lazy").setup(plugins, opts)
