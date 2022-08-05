local home_dir = os.getenv("HOME")
package.path = home_dir .. "/.config/nvim/lua/?.lua;" .. package.path

require("utils")
require("bootstrap")
require('onedark').load()
require("settings")
require("mappings")
require("lsps")
require("plugin-configs")
require("nvim-cmp")
