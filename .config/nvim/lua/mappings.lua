------------------------------------------
------------------------------------------
------------- key mappings ---------------
------------------------------------------
------------------------------------------
local wk = require 'which-key'
local mappings = {
    c = {
        l = {"<cmd>bufdo bd<cr>", "Clear All Buffer"}
    },
    d = {
        name = "Debug",
        R = { "<cmd>lua require'dap'.run_to_cursor()<cr>", "Run to Cursor" },
        E = { "<cmd>lua require'dapui'.eval(vim.fn.input '[Expression] > ')<cr>", "Evaluate Input" },
        C = { "<cmd>lua require'dap'.set_breakpoint(vim.fn.input '[Condition] > ')<cr>", "Conditional Breakpoint" },
        U = { "<cmd>lua require'dapui'.toggle()<cr>", "Toggle UI" },
        b = { "<cmd>lua require'dap'.step_back()<cr>", "Step Back" },
        c = { "<cmd>lua require'dap'.continue()<cr>", "Continue" },
        d = { "<cmd>lua require'dap'.disconnect()<cr>", "Disconnect" },
        e = { "<cmd>lua require'dapui'.eval()<cr>", "Evaluate" },
        g = { "<cmd>lua require'dap'.session()<cr>", "Get Session" },
        h = { "<cmd>lua require'dap.ui.widgets'.hover()<cr>", "Hover Variables" },
        S = { "<cmd>lua require'dap.ui.widgets'.scopes()<cr>", "Scopes" },
        i = { "<cmd>lua require'dap'.step_into()<cr>", "Step Into" },
        o = { "<cmd>lua require'dap'.step_over()<cr>", "Step Over" },
        p = { "<cmd>lua require'dap'.pause.toggle()<cr>", "Pause" },
        q = { "<cmd>lua require'dap'.close()<cr>", "Quit" },
        r = { "<cmd>lua require'dap'.repl.toggle()<cr>", "Toggle Repl" },
        s = { "<cmd>lua require'dap'.continue()<cr>", "Start" },
        t = { "<cmd>lua require'dap'.toggle_breakpoint()<cr>", "Toggle Breakpoint" },
        x = { "<cmd>lua require'dap'.terminate()<cr>", "Terminate" },
        u = { "<cmd>lua require'dap'.step_out()<cr>", "Step Out" },
    },
    l = {
        f = { ":lua vim.lsp.buf.formatting()<CR>", "format file" }
    },
    t = {
        d = { ":lua require('dap-go').debug_test()<CR>", "Go debug test" }
    },
    f = {
        f = { "<cmd>Telescope find_files<cr>", "Find files" },
        g = { "<cmd>Telescope live_grep<cr>", "Search string"},
        h = { "<cmd>Telescope help_tags<cr>", "Help" },
    }
}

wk.setup()
wk.register(mappings, {
    mode = "n",
    prefix = "<leader>",
    buffer = nil,
    silent = true,
    noremap = true,
    nowait = false,
})

-- noremap, silent option
local ns_opts = { noremap = true, silent = true }

------------------------------------------
------------------------------------------
------------- normal mode ----------------
------------------------------------------
------------------------------------------

--telescope 
Utils.map("n", "<A-b>", ":Telescope buffers<CR>", ns_opts)

-- buffer line
Utils.map("n", "se", ":BufferLineSortByExtension<CR>", ns_opts)
Utils.map("n", "sd", ":BufferLineSortByDirectory<CR>", ns_opts)


-- 'edit alternate file' convenience mapping
Utils.map("n", "<A-Left>", "gT", ns_opts)
Utils.map("n", "<A-Right>", "gt", ns_opts)

-- 'edit alternate file' convenience mapping
Utils.map("n", "<BS>", "<C-^>", ns_opts)

-- FTerm
Utils.map("n", "<A-i>", "<CMD>lua require('FTerm').toggle()<CR>", { noremap = true, silent = false })

-- run lua command fast
Utils.map("n", "<C-l>", ":lua ", { noremap = true, silent = false })

-- source lua neovim
Utils.map("n", "<Leader>sv", ":luafile $MYVIMRC<CR>", ns_opts)

-- delete to hole
Utils.map("n", "dd", "\"_dd", ns_opts)

-- paste from y
Utils.map("n", "p", "\"yp", ns_opts)

-- paste from y using leader
Utils.map("n", "<Leader>p", "\"+p", ns_opts)

-- copy to y
Utils.map("n", "yy", "\"yyy", ns_opts)

-- cut to y
Utils.map("n", "x", "\"yx", ns_opts)

-- copy to plus register
Utils.map("n", "<Leader>y", "\"+y", ns_opts)

-- turn off highlight
Utils.map("n", "<Esc>", ":noh<CR><Esc>", ns_opts)

-- nvim-tree toggle
Utils.map("n", "<C-n>", ":NvimTreeToggle<CR>", ns_opts)

-- move between window
Utils.map("n", "<A-h>", ":wincmd h<CR>", ns_opts)
Utils.map("n", "<A-j>", ":wincmd j<CR>", ns_opts)
Utils.map("n", "<A-k>", ":wincmd k<CR>", ns_opts)
Utils.map("n", "<A-l>", ":wincmd l<CR>", ns_opts)

-- easymotion
Utils.map("n", "f", "<leader><leader>f", {})
Utils.map("n", "F", "<leader><leader>F", {})

------------------------------------------
------------------------------------------
------------- insert mode ----------------
------------------------------------------
------------------------------------------

-- move between window
Utils.map("i", "<A-h>", "<C-\\><C-N>:wincmd h<CR>", ns_opts)
Utils.map("i", "<A-j>", "<C-\\><C-N>:wincmd j<CR>", ns_opts)
Utils.map("i", "<A-k>", "<C-\\><C-N>:wincmd k<CR>", ns_opts)
Utils.map("i", "<A-l>", "<C-\\><C-N>:wincmd l<CR>", ns_opts)

--Utils.map("i", "\"", "\"\"<left>", ns_opts)
--Utils.map("i", "\'", "\'\'<left>", ns_opts)
--Utils.map("i", "(", "()<left>", ns_opts)
--Utils.map("i", "[", "[]<left>", ns_opts)
--Utils.map("i", "{", "{}<left>", ns_opts)
--Utils.map("i", "{<CR>", "{<CR>}<ESC>O", ns_opts)
--Utils.map("i", "{;<CR>", "{<CR>};<ESC>O", ns_opts)

-- jk to ESC
Utils.map("i", "jk", "<Esc>", ns_opts)

------------------------------------------
------------------------------------------
------------- visual mode ----------------
------------------------------------------
------------------------------------------

-- copy to y
Utils.map("v", "y", "\"yy", ns_opts)

Utils.map("v", "F", "<leader><leader>F", {})
Utils.map("v", "f", "<leader><leader>f", {})

-- delete to hole
Utils.map("v", "d", "\"_d", ns_opts)

-- paste from y
Utils.map("v", "p", "\"yp", ns_opts)

-- paste from y using leader
Utils.map("v", "<Leader>p", "\"+p", ns_opts)

-- copy to plus register
Utils.map("v", "<Leader>y", "\"+y", ns_opts)

-- cut to plus register
Utils.map("v", "<Leader>x", "\"+x", ns_opts)

-- cut to y
Utils.map("v", "x", "\"yx", ns_opts)

------------------------------------------
------------------------------------------
------------------------------------------

-- move between window
Utils.map("t", "<A-h>", "<C-\\><C-N><C-w>h", ns_opts)
Utils.map("t", "<A-j>", "<C-\\><C-N><C-w>j", ns_opts)
Utils.map("t", "<A-k>", "<C-\\><C-N><C-w>k", ns_opts)
Utils.map("t", "<A-l>", "<C-\\><C-N><C-w>l", ns_opts)

Utils.map("t", "<A-i>", "<C-\\><C-n><CMD>lua require('FTerm').toggle()<CR>", ns_opts)
