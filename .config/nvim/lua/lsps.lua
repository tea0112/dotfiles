require "nvim-lsp-installer".setup {}

--------------
-- Mappings --
--------------

-- See `:help vim.diagnostic.*` for documentation on any of the below functions
local opts = { noremap = true, silent = true }
vim.api.nvim_set_keymap("n", ",e", "<cmd>lua vim.diagnostic.open_float()<CR>", opts)
vim.api.nvim_set_keymap("n", "[d", "<cmd>lua vim.diagnostic.goto_prev()<CR>", opts)
vim.api.nvim_set_keymap("n", "]d", "<cmd>lua vim.diagnostic.goto_next()<CR>", opts)
vim.api.nvim_set_keymap("n", ",q", "<cmd>lua vim.diagnostic.setloclist()<CR>", opts)

-- Use an on_attach function to only map the following keys
-- after the language server attaches to the current buffer
local on_attach = function(client, bufnr)
    -- Enable completion triggered by <c-x><c-o>
    vim.api.nvim_buf_set_option(bufnr, "omnifunc", "v:lua.vim.lsp.omnifunc")

    -- Mappings.
    -- See `:help vim.lsp.*` for documentation on any of the below functions
    vim.api.nvim_buf_set_keymap(bufnr, "n", "gD", "<cmd>lua vim.lsp.buf.declaration()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "n", "gd", "<cmd>lua vim.lsp.buf.definition()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "n", "K", "<cmd>lua vim.lsp.buf.hover()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "n", "gi", "<cmd>lua vim.lsp.buf.implementation()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "n", "<C-k>", "<cmd>lua vim.lsp.buf.signature_help()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "i", "<C-k>", "<cmd>lua vim.lsp.buf.signature_help()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "n", ",wa", "<cmd>lua vim.lsp.buf.add_workspace_folder()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "n", ",wr", "<cmd>lua vim.lsp.buf.remove_workspace_folder()<CR>", opts)
    vim.api.nvim_buf_set_keymap(
        bufnr,
        "n",
        ",wl",
        "<cmd>lua print(vim.inspect(vim.lsp.buf.list_workspace_folders()))<CR>",
        opts
    )
    vim.api.nvim_buf_set_keymap(bufnr, "n", ",D", "<cmd>lua vim.lsp.buf.type_definition()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "n", ",rn", "<cmd>lua vim.lsp.buf.rename()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "n", ",ca", "<cmd>lua vim.lsp.buf.code_action()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, "n", "gr", "<cmd>lua vim.lsp.buf.references()<CR>", opts)
    vim.api.nvim_buf_set_keymap(bufnr, 'n', ',f', '<cmd>lua vim.lsp.buf.formatting()<CR>', opts)
end

local lspconfig = require("lspconfig")

-- Add additional capabilities supported by nvim-cmp
local capabilities = vim.lsp.protocol.make_client_capabilities()
capabilities = require("cmp_nvim_lsp").update_capabilities(capabilities)
capabilities.offsetEncoding = { "utf-16" }


----------------------------
-- Language Server Config --
----------------------------

-- python lsp --
lspconfig.pyright.setup({
    on_attach = on_attach,
    capabilities = capabilities,
})

-- lua lsp --
local runtime_path = vim.split(package.path, ";")
table.insert(runtime_path, "lua/?.lua")
table.insert(runtime_path, "lua/?/init.lua")

-- cpp --
lspconfig.clangd.setup({
    on_attach = on_attach,
    capabilities = capabilities,
})

-- rust --
lspconfig.rust_analyzer.setup({
    on_attach = on_attach,
    capabilities = capabilities,
})

-- lua --
require'lspconfig'.sumneko_lua.setup {
  settings = {
    Lua = {
      runtime = {
        -- Tell the language server which version of Lua you're using (most likely LuaJIT in the case of Neovim)
        version = 'LuaJIT',
      },
      diagnostics = {
        -- Get the language server to recognize the `vim` global
        globals = {'vim'},
      },
      workspace = {
        -- Make the server aware of Neovim runtime files
        library = vim.api.nvim_get_runtime_file("", true),
      },
      -- Do not send telemetry data containing a randomized but unique identifier
      telemetry = {
        enable = false,
      },
    },
  },
}

-- golang --
lspconfig.gopls.setup({
    on_attach = on_attach,
    capabilities = capabilities,
})

-- typescript --
lspconfig.tsserver.setup({
    on_attach = on_attach,
    capabilities = capabilities,
})

-- bash --
lspconfig.bashls.setup({
    on_attach = on_attach,
    capabilities = capabilities,
})

-----------------------------------------------------------
-----------------------------------------------------------
--                                                       --
-- #    #  #    #  #       #              #        ####  --
-- ##   #  #    #  #       #              #       #      --
-- # #  #  #    #  #       #       #####  #        ####  --
-- #  # #  #    #  #       #              #            # --
-- #   ##  #    #  #       #              #       #    # --
-- #    #   ####   ######  ######         ######   ####  --
--                                                       --
-----------------------------------------------------------
-----------------------------------------------------------

local null_ls = require("null-ls")

local formatting = null_ls.builtins.formatting
local diagnostics = null_ls.builtins.diagnostics
local completion = null_ls.builtins.completion

null_ls.setup({
    sources = {
        -- -- -- -- --
        --  format  --
        -- -- -- -- --
        formatting.autopep8,
        formatting.clang_format.with({
            extra_args = {
                "--style=Google",
            },
        }),
        formatting.shfmt,
        formatting.goimports,
        formatting.golines,
        formatting.gofumpt,
        formatting.prettier,
        -- -- -- -- -- --
        -- diagnostic  --
        -- -- -- -- -- --
        diagnostics.eslint,
        diagnostics.flake8,
        -- -- -- -- -- --
        -- completion  --
        -- -- -- -- -- --
        completion.spell,
        -- -- -- --
        -- hook  --
        -- -- -- --
        capabilities = capabilities,
        on_attach = on_attach,
    },
})
