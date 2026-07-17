# powershell completion for xx

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function __xx_debug {
    if ($env:BASH_COMP_DEBUG_FILE) {
        "$args" | Out-File -Append -FilePath "$env:BASH_COMP_DEBUG_FILE"
    }
}

filter __xx_escapeStringWithSpecialChars {
    $_ -replace '\s|#|@|\$|;|,|''|\{|\}|\(|\)|"|\||<|>|&','`$&'
}

[scriptblock]$__xxCompleterBlock = {
    param(
            $WordToComplete,
            $CommandAst,
            $CursorPosition
        )

    $Command = $CommandAst.CommandElements
    $Command = "$Command"

    __xx_debug ""
    __xx_debug "========= starting completion logic =========="
    __xx_debug "WordToComplete: $WordToComplete Command: $Command CursorPosition: $CursorPosition"

    if ($Command.Length -gt $CursorPosition) {
        $Command = $Command.Substring(0, $CursorPosition)
    }
    __xx_debug "Truncated command: $Command"

    $Program, $Arguments = $Command.Split(" ", 2)

    $QuotedArgs = ($Arguments -split ' ' | ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }) -join ' '
    __xx_debug "QuotedArgs: $QuotedArgs"

    $RequestComp = "& xx complete -- $QuotedArgs"
    __xx_debug "RequestComp: $RequestComp"

    if ($WordToComplete -ne "" ) {
        $WordToComplete = $Arguments.Split(" ")[-1]
    }
    __xx_debug "New WordToComplete: $WordToComplete"

    $IsEqualFlag = ($WordToComplete -Like "--*=*" )
    if ( $IsEqualFlag ) {
        __xx_debug "Completing equal sign flag"
        $Flag, $WordToComplete = $WordToComplete.Split("=", 2)
    }
    $HasTrailingEmptyArg = $QuotedArgs -match "(^| )''$"
    __xx_debug "HasTrailingEmptyArg: $HasTrailingEmptyArg"

    if ( $WordToComplete -eq "" -And ( -Not $IsEqualFlag ) -And ( -Not $HasTrailingEmptyArg )) {
        __xx_debug "Adding extra empty parameter"
        if ($PSVersionTable.PsVersion -lt [version]'7.2.0' -or
            ($PSVersionTable.PsVersion -lt [version]'7.3.0' -and -not [ExperimentalFeature]::IsEnabled("PSNativeCommandArgumentPassing")) -or
            (($PSVersionTable.PsVersion -ge [version]'7.3.0' -or [ExperimentalFeature]::IsEnabled("PSNativeCommandArgumentPassing")) -and
              $PSNativeCommandArgumentPassing -eq 'Legacy')) {
             $RequestComp="$RequestComp" + ' `"'"
        } else {
             $RequestComp = "$RequestComp" + ' ""'
        }
    }

    __xx_debug "Calling $RequestComp"
    $env:ActiveHelp = 0

    Invoke-Expression -OutVariable out "$RequestComp" 2>&1 | Out-Null

    $CurrentGroup = ""
    $AllValues = @()

    $Out | ForEach-Object {
        if ($_ -match '^##(.+)$') {
            $CurrentGroup = $Matches[1]
            __xx_debug "Found group: $CurrentGroup"
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
            __xx_debug "Join the equal sign flag back to the completion value"
            $_.Name = $Flag + "=" + $_.Name
        }
    }

    $Values = $Values | Sort-Object -Property Name

    if ($Values.Length -eq 0) {
        ""
        return
    }

    $Mode = (Get-PSReadLineKeyHandler | Where-Object { $_.Key -eq "Tab" }).Function
    __xx_debug "Mode: $Mode"

    $Values | ForEach-Object {

        $comp = $_

        switch ($Mode) {

            "Complete" {

                if ($Values.Length -eq 1) {
                    __xx_debug "Only one completion left"
                    [System.Management.Automation.CompletionResult]::new($($comp.Name | __xx_escapeStringWithSpecialChars) + " ", "$($comp.Name)", 'ParameterValue', "$($comp.Description)")

                } else {
                    while($comp.Name.Length -lt $Longest) {
                        $comp.Name = $comp.Name + " "
                    }

                    if ($($comp.Description) -eq " " ) {
                        $Description = ""
                    } else {
                        $Description = "  ($($comp.Description))"
                    }

                    [System.Management.Automation.CompletionResult]::new("$($comp.Name)$Description", "$($comp.Name)$Description", 'ParameterValue', "$($comp.Description)")
                }
             }

            "MenuComplete" {
                [System.Management.Automation.CompletionResult]::new($($comp.Name | __xx_escapeStringWithSpecialChars) + " ", "$($comp.Name)", 'ParameterValue', "$($comp.Description)")
            }

            Default {
                [System.Management.Automation.CompletionResult]::new($($comp.Name | __xx_escapeStringWithSpecialChars), "$($comp.Name)", 'ParameterValue', "$($comp.Description)")
            }
        }

    }
}

Register-ArgumentCompleter -CommandName 'xx' -ScriptBlock $__xxCompleterBlock
