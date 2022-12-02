local home_dir = os.getenv("HOME")
package.path = home_dir .. "/.config/nvim/lua/?.lua;" .. package.path

require("lvim.utils")
require("lvim.bootstrap")
require("lvim.settings")
require("lvim.lsp")
require("lvim.plugins")
require("lvim.mappings")
