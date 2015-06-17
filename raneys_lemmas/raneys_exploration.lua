--[[ raneys_exploration.lua

     This file contains exploratory code related to the notes in
     raneys_lemmas.md (and .html and .pdf).
     This file isn't meant to be read directly, and is more of a
     scratch pad for work that will be filtered in a more readable
     format into raneys.lua and, to a lesser extend, into raneys_lemmas.md.

     Run it as `lua raneys_exploration.lua` from the command line.

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
    -- Switch on the next statement to see what a discrete version looks like.
    --seq[#seq + 1] = math.random(0, 1) - 0.5
  end
  return seq
end

-- This returns a length-n random sequence of numbers chosen iid uniformly in
-- the range (0, 1].
local function make_rand_01_seq(n)
  local seq = {}
  for i = 1, n do
    seq[#seq + 1] = 1 - math.random()  -- random() returns a value in [0, 1).
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

local function diff_seq(s)
  local diff = {}
  for i = 1, #s - 1 do
    diff[i] = s[i + 1] - s[i]
  end
  return diff
end

local function H(n)
  local s = 0
  for i = 1, n do
    s = s + 1 / i
  end
  return s
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

-- This modifies x in place and returns the did_shift boolean indicating whether
-- or not a shift was needed to make x sum-positive. This expects that the total
-- sum of x is already positive so this is possible.
local function shift_to_positive(x)
  local s = sum_seq(x)

  -- Find the minimum partial sum.
  local min, min_ind = s[#s], #s
  for i = #s - 1, 1, -1 do
    if s[i] < min then
      min, min_ind = s[i], i
    end
  end

  -- If no shift is needed, return did_shift = false.
  if min > 0 then return false end

  -- Make a copy of x to more easily shift it.
  local y = {}
  for i = 1, #x do y[i] = x[i] end
  for i = 1, #y do
    local j = (i + min_ind - 1) % #y + 1
    x[i] = y[j]
  end

  return true  -- true --> yes we did shift x
end

-- This function returns sigma(x) = #positive-sum shifts for the sequence x.
-- If the optional s value is supplied, it's used as the partial sums of x.
local function sigma(x, s)
  if shift_to_positive(x) or not s then
    s = sum_seq(x)
  end
  local m = s[#s]
  if m <= 0 then return 0 end
  local sigma = 1
  for i = #s, 1, -1 do
    if s[i] < m then
      sigma = sigma + 1
      m = s[i]
    end
  end
  return sigma
end

local function pr_vec(x)
  for i = 1, #x do
    io.write(string.format('%4g ', x[i]))
  end
  io.write('\n')
end

local function wr(...)
  io.write(string.format(...))
end

-- This prints out a numerical-valued array on a single line.
local function print_arr(arr, label)
  wr('%10s: ', label)
  for i = 1, #arr do
    wr('%7.3g ', arr[i])
  end
  wr('\n')
end


-------------------------------------------------------------------------------
-- Functions to explore specific behavior.
-------------------------------------------------------------------------------

local function check_sigma_with_rand_partial_sums(num_trials)
  num_trials = num_trials or 10000
  local   n_arr = {}
  local avg_arr = {}
  local  Hn_arr = {}
  for n = 1, 20 do
    table.insert(n_arr, n)
    local sigma_sum = 0
    for trial = 1, num_trials do
      local s = make_rand_01_seq(n)
      local s_no_zero = {}
      for i = 1, #s do s_no_zero[i] = s[i] end  -- Non-shallow copy.
      table.insert(s, 1, 0)  -- Insert a new first value = 0.
      local x = diff_seq(s)
      sigma_sum = sigma_sum + sigma(x, s_no_zero)
    end
    table.insert(avg_arr, sigma_sum / num_trials)
    table.insert( Hn_arr, H(n))
  end
  print_arr(  n_arr, 'n')
  print_arr(avg_arr, 'avg')
  print_arr( Hn_arr, 'H(n)')
end

-- This expects the input n to be a nonnegative integer.
-- The return value is n * (n - 2) * (n - 4) * ... * (n % 2 + 2).
local function double_fact(n)
  assert(n >= 0)
  local product = 1
  for k = n, 1, -2 do
    product = product * k
  end
  return product
end

-- s_k = (2k-1)!! / (2k)!!.
local function s(k)
  assert(k > 0)
  return double_fact(2 * k - 1) / double_fact(2 * k)
end

local function check_sigma_with_rand_x_vals(num_trials)
  num_trials = num_trials or 10000
  local   n_arr = {}
  local avg_arr = {}
  local prd_arr = {}  -- These are predicted values.
  for n = 1, 20 do
    table.insert(n_arr, n)
    local sigma_sum = 0
    for trial = 1, num_trials do
      local x = make_rand_seq(n)
      sigma_sum = sigma_sum + sigma(x)
    end
    table.insert(avg_arr, sigma_sum / num_trials)
    table.insert(prd_arr, s(n) * n)
  end
  print_arr(  n_arr, 'n')
  print_arr(avg_arr, 'avg sigma')
  print_arr(prd_arr, 'predicted')
end


-------------------------------------------------------------------------------
-- Main.
-------------------------------------------------------------------------------

math.randomseed(os.time())

check_sigma_with_rand_x_vals(100000)


-------------------------------------------------------------------------------
-- Old main.
-------------------------------------------------------------------------------

--[[
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
for pos = 1, n do io.write(string.format('%6d ', pos)) end
io.write('\n')

io.write('freq: ')
for pos = 1, n do
  io.write(string.format('%6d ', pos1_freq[pos] or 0))
end
io.write('\n')

print('Position of last sum:')

io.write(' pos: ')
for pos = 1, n do io.write(string.format('%6d ', pos)) end
io.write('\n')

io.write('freq: ')
for pos = 1, n do
  io.write(string.format('%6d ', pos10_freq[pos] or 0))
end
io.write('\n')
--]]
