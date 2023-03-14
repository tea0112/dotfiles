local home_dir = os.getenv("HOME")
package.path = home_dir .. "/.config/nvim/lua/?.lua;" .. package.path

-- Make sure to set `mapleader` before lazy so your mappings are correct
vim.g.mapleader = " "

require("plugins")
require("lvim.utils")
require("lvim.settings")
require("lvim.lsp")
require("lvim.plugins")
require("lvim.mappings")
