-- This code is from here:
-- https://girondi.net/post/pandoc_notes/
Span = function(el)
  color = el.attributes['color']
  -- if no color attribute, return unchanged
  if color == nil then return el end
  
  -- transform to <span style="color: red;"></span>
  if FORMAT:match 'html' then
    -- remove color attributes
    el.attributes['color'] = nil
    -- use style attribute instead
    el.attributes['style'] = 'color: ' .. color .. ';'
    -- return full span element
    return el
  elseif FORMAT:match 'latex' then
    -- remove color attributes
    el.attributes['color'] = nil
    -- encapsulate in latex code
    table.insert(
      el.content, 1,
      pandoc.RawInline('latex', '\\textcolor{'..color..'}{')
    )
    table.insert(
      el.content,
      pandoc.RawInline('latex', '}')
    )
    return el.content
  else
    -- for other format return unchanged
    return el
  end
end

function html_repl(text, attrs)
    if attrs == 'bold' then
        return '<b>' .. text .. '</b>'
    end
    color = attrs:match('color="(.-)"')
    return '<span style="color:' .. color .. '"><b>' .. text .. '</b></span>'
end

function latex_repl(text, attrs)
    if attrs == 'bold' then
        return '\\textbf{' .. text .. '}'
    end
    color = attrs:match('color="(.-)"')
    return '\\textcolor{' .. color .. '}{' .. text .. '}'
end

CodeBlock = function(el)
  -- transform to <span style="color: red;"></span>
  if FORMAT:match 'html' then
    text, _ = el.text:gsub('^%{formatted%}', '')
    html = '<pre><code>  ' .. text:gsub('%[(.-)%]%{(.-)%}', html_repl) .. '</code></pre>'
    return pandoc.RawBlock("html", html)
  elseif FORMAT:match 'latex' then

    ltag    = 'verbatim'
    lsuffix = ''

    text, n = el.text:gsub('^%{formatted%}', '')
    if n > 0 then
      ltag = 'Verbatim'
      lsuffix = '[commandchars=\\\\\\{\\}]'
    end

    latex = (
      '\\medskip\n\\begin{' .. ltag .. '}' .. lsuffix .. '\n' ..
      text:gsub('%[(.-)%]%{(.-)%}', latex_repl) ..
      '\n\\end{' .. ltag .. '}\n\\medskip'
    )
    -- html = '<pre><code>' .. el.text:gsub('%[(.-)%]%{(.-)%}', repl) .. '</code></pre>'
    return pandoc.RawBlock("latex", latex)
  else
    -- for other format return unchanged
    return el
  end
end



