--- Check if a file or directory exists in this path
function Exists(file)
    local ok, err, code = os.rename(file, file)
    if not ok then
        if code == 13 then
            -- Permission denied, but it exists
            return true
        end
    end
    return ok, err
end

function Trim(s)
    return (string.gsub(s, "^%s*(.-)%s*$", "%1"))
end

function Dump(tb, have_k)
    print('-----------------')
    if (type(tb) == "table") then
        if have_k then
            for k, v in ipairs(tb) do
                print(k .. " - " .. v)
            end
        else
            for _, v in ipairs(tb) do
                print(v)
            end
        end
    end
    print('-----------------')
end

-- set indent
function SetIndent(number)
    vim.opt.tabstop = number
    vim.opt.shiftwidth = number
    vim.opt.softtabstop = number
end

function IsWSL()
    local output = vim.fn.systemlist "uname -r"
    return not not string.find(output[1] or "", "WSL")
end

Utils = {}

function Utils.map(mode, left, right, opts)
    if opts then
        vim.api.nvim_set_keymap(mode, left, right, opts)
    end
end

local M = {}

function M.MergeTable(first, second)
    for _, v in pairs(second) do
        table.insert(first, v)
    end
end

return M
