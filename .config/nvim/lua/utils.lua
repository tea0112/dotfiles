function Trim(s)
  return (string.gsub(s, "^%s*(.-)%s*$", "%1"))
end

function Dump(tb)
  print('-----------------')
  if (type(tb) == "table") then
    for k, v in ipairs(tb) do
      print(k .. " - " .. v)
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

local utils = {}

function utils.map(mode, left, right, opts)
  if opts then
    vim.api.nvim_set_keymap(mode, left, right, opts)
  end
end

return utils
