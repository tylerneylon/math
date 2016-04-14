#!/usr/local/bin/lua

local dbg  = require 'dbg'
local json = require 'json'


-- Internal functions.

local function kind_of(obj)
  if type(obj) ~= 'table' then return type(obj) end
  local i = 1
  for _ in pairs(obj) do
    if obj[i] ~= nil then i = i + 1 else return 'table' end
  end
  return 'array'
end

-- This expects a json object, typically the output of json.parse, and a
-- use_item function, which is called with:
-- use_item(item, item_key, item_type)
local function walk(json, use_item, json_key, json_parent)
  local json_type = kind_of(json)
  use_item(json, json_key, json_type, json_parent)
  if json_type == 'table' then
    for item_key, item in pairs(json) do
      walk(item, use_item, item_key, json)
    end
  elseif json_type == 'array' then
    for item_key, item in ipairs(json) do
      walk(item, use_item, item_key, json)
    end
  end
end

local function process_json_str(s)
  local j = json.parse(s)
  walk(j, function (item, item_key, item_type, parent)
    if item_type == 'array' and item[2] == 'fig:' then
      table.remove(parent, item_key)
      table.insert(parent, 1, item)
    end
  end)
  print(json.stringify(j))
  --io.stderr:write(json.stringify(j) .. '\n')
  --dbg.pr_val(j)
end


-- Main body.

--[[
if arg[1] == nil then
  dbg.pr('Usage: lua %s <json_filename>', arg[0])
  os.exit(0)
end
--]]

for line in io.lines() do
  process_json_str(line)
end
