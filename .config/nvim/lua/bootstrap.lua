local fn = vim.fn
local install_path = fn.stdpath('data') .. '/site/pack/packer/start/packer.nvim'
if fn.empty(fn.glob(install_path)) > 0 then
    packer_bootstrap = fn.system({ 'git', 'clone', '--depth', '1', 'https://github.com/wbthomason/packer.nvim',
        install_path })
end

return require 'packer'.startup(function(use)
    -- Packer can manage itself
    use "wbthomason/packer.nvim"
    -- better escape
    use {
        "max397574/better-escape.nvim",
    }
    -- nerdtree
    --use("preservim/nerdtree")
    use {
        'kyazdani42/nvim-tree.lua',
        requires = {
            'kyazdani42/nvim-web-devicons', -- optional, for file icon
        },
        tag = 'nightly' -- optional, updated every week. (see issue #1193)
    }
    -- vim surround
    use "tpope/vim-surround"
    -- easymotion
    use "easymotion/vim-easymotion"
    -- fzf
    use "junegunn/fzf"
    -- telescope
    use {
        "nvim-telescope/telescope.nvim",
        requires = { { "nvim-lua/plenary.nvim" } },
    }

    use {
        "nvim-treesitter/nvim-treesitter",
    }

    -- cmp
    use "hrsh7th/cmp-buffer"
    use "hrsh7th/cmp-path"
    use "hrsh7th/cmp-cmdline"
    use "hrsh7th/nvim-cmp" -- Autocompletion plugin
    use "hrsh7th/cmp-nvim-lsp" -- LSP source for nvim-cmp
    use 'L3MON4D3/LuaSnip'
    use "saadparwaiz1/cmp_luasnip" -- Snippets source for nvim-cmp
    -- neovim lsp
    use "neovim/nvim-lspconfig" -- Collection of configurations for built-in LSP client
    -- lualine
    use {
        "nvim-lualine/lualine.nvim",
        requires = { "kyazdani42/nvim-web-devicons", opt = true },
    }
    -- null-ls
    use {
        "jose-elias-alvarez/null-ls.nvim",
        config = function()
            require "null-ls".setup()
        end,
        requires = { "nvim-lua/plenary.nvim" },
    }
    -- git change show
    use {
        'lewis6991/gitsigns.nvim',
        tag = 'release'
    }
    -- git fugitive
    use "tpope/vim-fugitive"
    -- onedark
    use 'navarasu/onedark.nvim'
    -- markdown glow
    use { "ellisonleao/glow.nvim", branch = 'main' }
    -- css color
    use "norcalli/nvim-colorizer.lua"
    -- Fterm
    use "numToStr/FTerm.nvim"
    -- vim go
    use "fatih/vim-go"
    -- which key
    use "folke/which-key.nvim"

    use 'leoluz/nvim-dap-go'

    use { 'nvim-telescope/telescope-dap.nvim' }

    use {
        'mfussenegger/nvim-dap',
        requires = {
            "Pocco81/DAPInstall.nvim",
            "theHamsta/nvim-dap-virtual-text",
            "rcarriga/nvim-dap-ui",
            { "jbyuki/one-small-step-for-vimkind", module = "osv" },
        },
    }

    use 'antoinemadec/FixCursorHold.nvim'

    use 'kosayoda/nvim-lightbulb'

    use 'williamboman/nvim-lsp-installer'

    use {
        'rmagatti/auto-session',
        config = function()
            require('auto-session').setup {
                log_level = 'info',
                auto_session_suppress_dirs = { '~/', '~/Projects' }
            }
        end
    }

    use 'folke/tokyonight.nvim'

    use 'akinsho/bufferline.nvim'

    use "lukas-reineke/indent-blankline.nvim"

    use "rafamadriz/friendly-snippets"

    use "windwp/nvim-autopairs"
    -- Automatically set up your configuration after cloning packer.nvim
    -- Put this at the end after all plugins
    if packer_bootstrap then
        require 'packer'.sync()
    end
end)
