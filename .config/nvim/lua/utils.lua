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

function Substitute(contents, result, key, value, ch, new)
  -- have special character
  if string.find(value, ch) then
    -- replace specific character
    value = string.gsub(value, ch, new)
    if (#result > 0 and result[#result] == new) then
      result[#result] = result[#result] .. " " .. Trim(contents[key])
    else
      table.insert(result, Trim(value))
    end
  else
    result[#result] = result[#result] .. " " .. Trim(value)
  end
end

function Ra()
  local contents = vim.api.nvim_buf_get_lines(0, 0, -1, false)

  local result = {}

  for key, value in ipairs(contents) do
    Substitute(contents, result, key, value, "", "*")
  end
  vim.api.nvim_buf_set_lines(0, 0, -1, true, result)
end

function Indent(number)
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
