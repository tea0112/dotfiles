local home_dir = os.getenv("HOME")
package.path = home_dir .. "/.config/nvim/lua/?.lua;" .. package.path

-- Make sure to set `mapleader` before lazy so your mappings are correct
vim.g.mapleader = " "

require("lazy_plugins")
require("utils")
require("plugins")
require("settings")
require("lsp")
require("mappings")
