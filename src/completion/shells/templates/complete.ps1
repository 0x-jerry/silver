# powershell completion for {{name}}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function __{{name}}_debug {
    if ($env:BASH_COMP_DEBUG_FILE) {
        "$args" | Out-File -Append -FilePath "$env:BASH_COMP_DEBUG_FILE"
    }
}

filter __{{name}}_escapeStringWithSpecialChars {
    $_ -replace '\s|#|@|\$|;|,|''|\{|\}|\(|\)|"|\||<|>|&','`$&'
}

[scriptblock]$__{{safeName}}CompleterBlock = {
    param(
            $WordToComplete,
            $CommandAst,
            $CursorPosition
        )

    $Command = $CommandAst.CommandElements
    $Command = "$Command"

    __{{name}}_debug ""
    __{{name}}_debug "========= starting completion logic =========="
    __{{name}}_debug "WordToComplete: $WordToComplete Command: $Command CursorPosition: $CursorPosition"

    if ($Command.Length -gt $CursorPosition) {
        $Command = $Command.Substring(0, $CursorPosition)
    }
    __{{name}}_debug "Truncated command: $Command"

    $Program, $Arguments = $Command.Split(" ", 2)

    $QuotedArgs = ($Arguments -split ' ' | ForEach-Object {
        if ($_ -eq '') {
            return '""'
        }
        return "'" + ($_ -replace "'", "''") + "'"
    }) -join ' '
    __{{name}}_debug "QuotedArgs: $QuotedArgs"

    $RequestComp = '& {{execCmd}} complete -- ' + $QuotedArgs
    __{{name}}_debug "RequestComp: $RequestComp"

    if ($WordToComplete -ne "" ) {
        $WordToComplete = $Arguments.Split(" ")[-1]
    }
    __{{name}}_debug "New WordToComplete: $WordToComplete"

    $IsEqualFlag = ($WordToComplete -Like "--*=*" )
    if ( $IsEqualFlag ) {
        __{{name}}_debug "Completing equal sign flag"
        $Flag, $WordToComplete = $WordToComplete.Split("=", 2)
    }
    $HasTrailingEmptyArg = $QuotedArgs -match '(^| )""$'
    __{{name}}_debug "HasTrailingEmptyArg: $HasTrailingEmptyArg"

    if ( $WordToComplete -eq "" -And ( -Not $IsEqualFlag ) -And ( -Not $HasTrailingEmptyArg )) {
        __{{name}}_debug "Adding extra empty parameter"
        $RequestComp = $RequestComp + ' ""'
    }

    __{{name}}_debug "Calling $RequestComp"
    $env:ActiveHelp = 0

    Invoke-Expression -OutVariable out $RequestComp 2>&1 | Out-Null

    $CurrentGroup = ""
    $AllValues = @()

    $Out | ForEach-Object {
        if ($_ -match '^##(.+)$') {
            $CurrentGroup = $Matches[1]
            __{{name}}_debug "Found group: $CurrentGroup"

            # Handle built-in completion types
            if ($CurrentGroup -eq '_files') {
                __{{name}}_debug "Generating file completions for prefix: $WordToComplete"

                $DirPrefix = ""
                if ($WordToComplete -match '^(.*[/\\])(.*)$') {
                    $DirPrefix = $Matches[1]
                }

                $BasePath = if ($DirPrefix) { $DirPrefix } else { "." }

                # List directories (for navigation, like zsh's _files)
                Get-ChildItem -Path $BasePath -Directory -Name -ErrorAction SilentlyContinue | ForEach-Object {
                    $AllValues += @{ Name = "$DirPrefix$_\"; Description = " " }
                }
                # List files
                Get-ChildItem -Path $BasePath -File -Name -ErrorAction SilentlyContinue | ForEach-Object {
                    $AllValues += @{ Name = "$DirPrefix$_"; Description = " " }
                }
                $CurrentGroup = ""
                return
            }
            if ($CurrentGroup -eq '_dirs') {
                __{{name}}_debug "Generating directory completions for prefix: $WordToComplete"

                $DirPrefix = ""
                if ($WordToComplete -match '^(.*[/\\])(.*)$') {
                    $DirPrefix = $Matches[1]
                }

                $BasePath = if ($DirPrefix) { $DirPrefix } else { "." }

                Get-ChildItem -Path $BasePath -Directory -Name -ErrorAction SilentlyContinue | ForEach-Object {
                    $AllValues += @{ Name = "$DirPrefix$_\"; Description = " " }
                }
                $CurrentGroup = ""
                return
            }

            return
        }

        if ($_ -match '^##' -or $_ -match '^:') {
            return
        }

        $Name, $Description = $_.Split("`t", 2)

        if (-Not $Description) {
            $Description = " "
        }

        if ($CurrentGroup -ne "") {
            $Description = "[$CurrentGroup] $Description"
        }

        $AllValues += @{ Name = "$Name"; Description = "$Description" }
    }

    $Longest = 0
    [Array]$Values = $AllValues | ForEach-Object {
        if ($Longest -lt $_.Name.Length) {
            $Longest = $_.Name.Length
        }
        $_
    }

    $Values = $Values | Where-Object {
        $_.Name -like "$WordToComplete*"

        if ( $IsEqualFlag ) {
            __{{name}}_debug "Join the equal sign flag back to the completion value"
            $_.Name = $Flag + "=" + $_.Name
        }
    }

    $Values = $Values | Sort-Object -Property Name

    if ($Values.Length -eq 0) {
        ""
        return
    }

    $Mode = (Get-PSReadLineKeyHandler | Where-Object { $_.Key -eq "Tab" }).Function
    __{{name}}_debug "Mode: $Mode"

    $Values | ForEach-Object {

        $comp = $_

        switch ($Mode) {

            "Complete" {

                if ($Values.Length -eq 1) {
                    __{{name}}_debug "Only one completion left"

                    $EscapedName = $comp.Name | __{{name}}_escapeStringWithSpecialChars
                    # Don't add trailing space when completing a directory (ends with \ or /)
                    # so the user can press Tab again to navigate into it
                    if ($EscapedName -match '[\\/]$') {
                        $CompletionText = $EscapedName
                    } else {
                        $CompletionText = $EscapedName + " "
                    }

                    [System.Management.Automation.CompletionResult]::new($CompletionText, "$($comp.Name)", 'ParameterValue', "$($comp.Description)")

                } else {
                    $DisplayName = $comp.Name
                    while($DisplayName.Length -lt $Longest) {
                        $DisplayName = $DisplayName + " "
                    }

                    if ($($comp.Description) -eq " " ) {
                        $Description = ""
                    } else {
                        $Description = "  ($($comp.Description))"
                    }

                    [System.Management.Automation.CompletionResult]::new("$DisplayName$Description", "$DisplayName$Description", 'ParameterValue', "$($comp.Description)")
                }
             }

            "MenuComplete" {
                $EscapedName = $comp.Name | __{{name}}_escapeStringWithSpecialChars
                if ($EscapedName -match '[\\/]$') {
                    $CompletionText = $EscapedName
                } else {
                    $CompletionText = $EscapedName + " "
                }
                [System.Management.Automation.CompletionResult]::new($CompletionText, "$($comp.Name)", 'ParameterValue', "$($comp.Description)")
            }

            Default {
                [System.Management.Automation.CompletionResult]::new($($comp.Name | __{{name}}_escapeStringWithSpecialChars), "$($comp.Name)", 'ParameterValue', "$($comp.Description)")
            }
        }

    }
}

Register-ArgumentCompleter -CommandName '{{name}}' -ScriptBlock $__{{safeName}}CompleterBlock
