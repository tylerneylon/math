--[[

dbg.lua

Functions useful for debugging Lua.
It's called dbg because there's already an official 'debug' module.

--]]

local dbg = {}


-- Internal functions.

-- Because val_to_str calls key_val_to_str and back, we define both as local
-- functions first and export them below.
local val_to_str

-- Returns a string for v that works when
-- v is the key in a Lua table literal.
local function key_val_to_str(v, seen)
  if type(v) == 'string' then return v end
  return '[' .. val_to_str(v, seen) .. ']'
end

-- Don't use 'local' here; val_to_str is already local!
val_to_str = function (v, seen)
  seen = seen or {}
  if type(v) == 'table' then
    if seen[v] then
      return '<repeated_table>'
    end
    seen[v] = true
    local exprs = {}
    local is_pure_seq = true
    for _ in pairs(v) do
      local i = #exprs + 1
      if v[i] == nil then
        is_pure_seq = false
        break
      end
      exprs[i] = val_to_str(v[i], seen)
    end
    if not is_pure_seq then
      local last_seq_key = #exprs
      for k2, v2 in pairs(v) do
        -- Ignore keys we've already encoded.
        if type(k2) ~= 'number' or k2 < 1 or k2 > last_seq_key then
          exprs[#exprs + 1] = key_val_to_str(k2, seen) .. '=' ..
                                  val_to_str(v2, seen)
        end
      end
    end
    return '{' .. table.concat(exprs, ', ') .. '}'
  elseif type(v) == 'string' then
    return '"' .. v .. '"'
  else
    -- Return 'true' for true, 'false' for false, etc.
    return tostring(v)
  end
end


-- Public functions.

-- This function returns a valid Lua expression
-- representing the given object. This assumes
-- there are no object cycles, as in:
-- a = {} ; a.a = a;
dbg.val_to_str = val_to_str

-- This is the opposite of dbg.val_to_str.
function dbg.str_to_val(s)
  return loadstring('return ' .. s)()
end

function dbg.pr(...)
  print(string.format(...))
end

function dbg.pr_val(v)
  dbg.pr(val_to_str(v))
end

return dbg
