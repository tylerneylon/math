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

-- This function returns sigma(x) = #positive-sum shifts for the sequence x.
-- If the optional s value is supplied, it's used as the partial sums of x.
local function sigma(x, s)
  s = s or sum_seq(x)
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

local function wr(...)
  io.write(string.format(...))
end

-- This prints out a numerical-valued array on a single line.
local function print_arr(arr, label)
  wr('%10s: ', label)
  for i = 1, #arr do
    wr('%6.3g ', arr[i])
  end
  wr('\n')
end


-------------------------------------------------------------------------------
-- Main.
-------------------------------------------------------------------------------

math.randomseed(os.time())

-- These are useful for printing out the values later.
local   n_arr = {}
local avg_arr = {}
local  Hn_arr = {}

local num_trials = 10000

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
print_arr(avg_arr, 'avg sigma')
print_arr( Hn_arr, 'H(n)')

