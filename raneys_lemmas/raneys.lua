--[[ raneys.lua

     This file empirically checks some properties of some pseudorandomly-chosen
     permutations.

     Run it as `lua raneys.lua` from the command line.

--]]


-------------------------------------------------------------------------------
-- Internal functions.
-------------------------------------------------------------------------------

-- This returns a length-n random sequence of numbers chosen iid uniformly in
-- the range [-1, 1).
local function make_rand_seq(n)
  local seq = {}
  for i = 1, n do
    seq[#seq + 1] = math.random() * 2 - 1
  end
  return seq
end

-- Returns the sequence of cumulative sums of input sequence s.
local function sum_seq(s)
  local sum  = 0
  local sums = {}
  for i = 1, #s do
    sum = sum + s[i]
    sums[#sums + 1] = sum
  end
  return sums
end

-- Returns the postion, in [1, #seq], of seq[i] within seq itself.
-- This expects seq to be an array of unique numbers. As an example, if seq[i]
-- is the smallest number, this returns 1.
local function get_pos_of_ith_item(seq, i)
  -- We'll count the number of items < seq[i] in linear time.
  local pos = 1
  for j = 1, #seq do
    if seq[j] < seq[i] then pos = pos + 1 end
  end
  return pos
end


-------------------------------------------------------------------------------
-- Main.
-------------------------------------------------------------------------------

local n = 10
local pos1s  = {}
local pos10s = {}
for t = 1, 100000 do
  local s = sum_seq(make_rand_seq(n))
  local pos1  = get_pos_of_ith_item(s, 1)
  local pos10 = get_pos_of_ith_item(s, n)
  table.insert(pos1s, pos1)
  table.insert(pos10s, pos10)
end

-- Build histogram data for each.
local pos1_freq  = {}  -- Maps pos -> freq.
local pos10_freq = {}
for _, pos in pairs(pos1s) do
  pos1_freq[pos] = (pos1_freq[pos] or 0) + 1
end
for _, pos in pairs(pos10s) do
  pos10_freq[pos] = (pos10_freq[pos] or 0) + 1
end

-- Print out the results.
print('Position of 1st sum:')

io.write(' pos: ')
for pos = 1, n do io.write(string.format('%4d ', pos)) end
io.write('\n')

io.write('freq: ')
for pos = 1, n do
  io.write(string.format('%4d ', pos1_freq[pos] or 0))
end
io.write('\n')

print('Position of last sum:')

io.write(' pos: ')
for pos = 1, n do io.write(string.format('%4d ', pos)) end
io.write('\n')

io.write('freq: ')
for pos = 1, n do
  io.write(string.format('%4d ', pos10_freq[pos] or 0))
end
io.write('\n')
