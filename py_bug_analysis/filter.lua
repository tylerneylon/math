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

local filter = {

    traverse = 'topdown',

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
    end,

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
    end,

    BulletList = function(el)

        local filter_done = false

        -- This walks the bullet list. It stops changing things as soon as the
        -- first change is made. The first change is made if it sees a Plain
        -- that begins with '{+}', in which case it wraps the Plain in a
        -- BulletList, effectively increasing the nesting level of that Plain.
        return el:walk({Plain = function(el)
            if filter_done then return el end
            local do_indent = false
            local first_str_done = false
            el = el:walk({Str = function(el)
                if not first_str_done then
                    el.text, n = el.text:gsub('^%{%+%}', '')
                    do_indent = (n > 0)
                    first_str_done = true
                end
                return el
            end})
            if do_indent then
                filter_done = true
                return pandoc.BulletList(el)
            end
            -- print('\n', el)
            -- return el
        end})

        --[=[

        print('\n')
        print('1', el)
        print('2', el.content)
        print('3', el.content[1])
        print('4', el.content[1][1])
        print('5', el.content[1][1].content)
        print('6', el.content[1][1].content[1])
        print('7', el.content[1][1].content[1].text)

        --[[ text, n = el.content[1][1].content[1].text:gsub('^%{%+%}', '')

        if n > 0 then
            print('{+} noticed')
        end
        ]]

        if FORMAT:match 'html' then
            return el
        elseif FORMAT:match 'latex' then
            return el
        else
            return el
        end

        ]=]

    end
}

return {filter}
