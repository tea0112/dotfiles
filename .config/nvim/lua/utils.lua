function Dump(tb)
  print('-----------------')
  if (type(tb) == "table") then
    for k, v in ipairs(tb) do
      print(k .. " - " .. v)
    end
  end
  print('-----------------')
end

function Ra()
  local contents = vim.api.nvim_buf_get_lines(0, 0, -1, false)

  local result = {}

  for key, value in ipairs(contents) do
    -- have special character
    if string.find(value, "") then
      -- replace specific character
      value = string.gsub(value, "", "*")
      if (#result > 0 and result[#result] == "*") then
        result[#result] = result[#result] .. " " .. contents[key]
      else
        table.insert(result, value)
      end
    else
      result[#result] = result[#result] .. " " .. value
    end
  end
  vim.api.nvim_buf_set_lines(0, 0, -1, true, result)
end


local utils = {}

function utils.map(mode, left, right, opts)
  if opts then
    vim.api.nvim_set_keymap(mode, left, right, opts)
  end
end

return utils
