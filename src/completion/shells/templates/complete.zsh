#compdef {{name}}
compdef _{{name}} {{name}}

# zsh completion for {{name}} -*- shell-script -*-

__{{name}}_debug() {
    local file="$BASH_COMP_DEBUG_FILE"
    if [[ -n ${file} ]]; then
        echo "$*" >> "${file}"
    fi
}

_{{name}}() {
    local lastParam lastChar flagPrefix requestComp out comp

    __{{name}}_debug "\n========= starting completion logic =========="
    __{{name}}_debug "CURRENT: ${CURRENT}, words[*]: ${words[*]}"

    words=( "${=words[1,CURRENT]}" )
    __{{name}}_debug "Truncated words[*]: ${words[*]},"

    lastParam=${words[-1]}
    lastChar=${lastParam[-1]}
    __{{name}}_debug "lastParam: ${lastParam}, lastChar: ${lastChar}"

    setopt local_options BASH_REMATCH
    if [[ "${lastParam}" =~ '-.*=' ]]; then
        flagPrefix="-P ${BASH_REMATCH}"
    fi

    local -a args_to_quote=("${(@)words[2,-1]}")
    if [ "${lastChar}" = "" ] && [ "${args_to_quote[-1]}" != "" ]; then
        __{{name}}_debug "Adding extra empty parameter"
        args_to_quote+=("")
    fi

    local quoted_args=("${(@q)args_to_quote}")

    requestComp="{{execCmd}} complete -- ${quoted_args[*]}"

    __{{name}}_debug "About to call: eval ${requestComp}"

    out=$(eval ${requestComp} 2>/dev/null)
    __{{name}}_debug "completion output: ${out}"

    local -a all_completions
    local current_group=""
    local -a group_names
    local group_idx=-1

    while IFS='\n' read -r comp; do
        if [[ "${comp}" == \#\#* ]]; then
            current_group="${comp#\#\#}"
            (( group_idx++ ))
            group_names+=("${current_group}")
            eval "local -a group_${group_idx}"
            __{{name}}_debug "Found group: ${current_group} (idx=${group_idx})"
            continue
        fi

        if [ -n "$comp" ]; then
            comp=${comp//:/\\:}

            local tab="$(printf '\t')"
            comp=${comp//$tab/:}

            __{{name}}_debug "Adding completion: ${comp}"

            if [[ ${group_idx} -ge 0 ]]; then
                eval "group_${group_idx}+=(\"\${comp}\")"
            else
                all_completions+=("${comp}")
            fi
        fi
    done < <(printf "%s\n" "${out[@]}")

    local has_described=0

    if [[ ${#group_names[@]} -gt 0 ]]; then
        zstyle ':completion:*:*:{{name}}:*' group-name ''
        zstyle ':completion:*:*:{{name}}:*:descriptions' format '%B-- %d --%b'

        local i
        for (( i=0; i<=group_idx; i++ )); do
            local group_name="${group_names[$((i+1))]}"
            local tag_name="${group_name}"
            tag_name=${tag_name// /-}

            if [[ "${group_name}" == "_files" ]]; then
                __{{name}}_debug "Adding file completion"
                _wanted files expl 'files' _files ${flagPrefix}
                has_described=1
                continue
            fi

            if [[ "${group_name}" == "_dirs" ]]; then
                __{{name}}_debug "Adding directory completion"
                _wanted directories expl 'directories' _files -/ ${flagPrefix}
                has_described=1
                continue
            fi

            local -a cur_group
            eval "cur_group=(\"\${group_${i}[@]}\")"

            if [[ ${#cur_group[@]} -gt 0 ]]; then
                __{{name}}_debug "Describing group: ${group_name} (${#cur_group[@]} items)"
                _describe -t "${tag_name}" "${group_name}" cur_group -Q ${flagPrefix}
                has_described=1
            fi
        done

        if [[ ${#all_completions[@]} -gt 0 ]]; then
            _describe "completions" all_completions -Q ${flagPrefix}
            has_described=1
        fi
    else
        if _describe "completions" all_completions -Q ${flagPrefix}; then
            has_described=1
        fi
    fi
}

if [ "${funcstack[1]}" = "_{{name}}" ]; then
    _{{name}}
fi
