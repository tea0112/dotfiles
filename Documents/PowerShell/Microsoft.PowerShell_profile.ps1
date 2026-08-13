# Set up PSReadLine for better command line editing and history
Import-Module PSReadLine
Set-PSReadLineOption -PredictionSource HistoryAndPlugin -ErrorAction SilentlyContinue
Set-PSReadLineOption -PredictionViewStyle InlineView -ErrorAction SilentlyContinue
Set-PSReadLineOption -ShowToolTips
Set-PSReadLineOption -EditMode Emacs

# Enable auto-completion suggestions behavior
Set-PSReadLineKeyHandler -Key RightArrow -Function ForwardChar

# Fish-style Ctrl+F: accept suggestion if present, else move cursor forward one char
Set-PSReadLineKeyHandler -Chord 'Ctrl+f' -ScriptBlock {
    $before = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$before, [ref]$null)
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptSuggestion()
    $after = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$after, [ref]$null)
    if ($before -eq $after) {
        [Microsoft.PowerShell.PSConsoleReadLine]::ForwardChar()
    }
}

# Fish-style Tab: accept suggestion if visible, else fall back to MenuComplete
Set-PSReadLineKeyHandler -Key Tab -ScriptBlock {
    $before = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$before, [ref]$null)
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptSuggestion()
    $after = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$after, [ref]$null)
    if ($before -eq $after) {
        [Microsoft.PowerShell.PSConsoleReadLine]::MenuComplete()
    }
}

# fzf integration - fuzzy directory picker & history search
$env:FZF_DEFAULT_OPTS = "--height 40% --layout=reverse --border --info=inline --preview-window=right:60%"

function fe {
    $dir = Get-ChildItem -Directory -Force -ErrorAction SilentlyContinue |
           ForEach-Object { $_.Name } |
           fzf --prompt "dir> "
    if ($dir) { Set-Location -LiteralPath $dir }
}

function fh {
    $historyPath = (Get-PSReadLineOption).HistorySavePath
    $cmd = Get-Content $historyPath -ErrorAction SilentlyContinue |
           Select-Object -Unique |
           fzf --prompt "history> " --tac --no-sort
    if ($cmd) { [Microsoft.PowerShell.PSConsoleReadLine]::Insert($cmd) }
}

Set-PSReadLineKeyHandler -Chord 'Ctrl+r' -ScriptBlock { fh }
Set-PSReadLineKeyHandler -Chord 'Alt+c'  -ScriptBlock { fe }

function killport {
    param([int]$Port)
    if (-not $Port) {
        Write-Host "Usage: killport <port>" -ForegroundColor Yellow
        return
    }
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $conn) {
        Write-Host "No process listening on port $Port" -ForegroundColor Yellow
        return
    }
    $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        Stop-Process -Id $procId -Force
        Write-Host "Killed PID $procId on port $Port" -ForegroundColor Green
    }
}

# Common Aliases
Set-Alias -Name oc -Value opencode
Set-Alias ll Get-ChildItem
Set-Alias grep Select-String
Set-Alias touch New-Item
function gs { git status @args }

# Clipboard helpers
function cpwd {
    $path = (Get-Location).Path
    Set-Clipboard -Value $path
    Write-Host "Copied: $path" -ForegroundColor Green
}
Set-Alias pwc cpwd

function ccd {
    param([string]$Path)
    if (-not $Path) {
        $Path = Get-Clipboard
    }
    Set-Location -LiteralPath $Path
}

# Custom Prompt (Simple and clean)
function prompt {
    $path = (Get-Location).Path
    $time = Get-Date -Format "HH:mm:ss"
    Write-Host "[$time] " -NoNewline -ForegroundColor DarkGray
    Write-Host "$path " -NoNewline -ForegroundColor Green
    Write-Host "> " -NoNewline -ForegroundColor White
    return " "
}

# Golang Environment Variables
$env:GOROOT = "$HOME\scoop\apps\go\current"
$env:GOPATH = "$HOME\go"
$env:GOBIN = "$HOME\go\bin"
if ($env:PATH -notlike "*$env:GOBIN*") {
    $env:PATH = "$env:GOBIN;$env:PATH"
}

# Add to PATH
$ClaudePath = "$HOME\.local\bin"
if ($env:Path -notlike "*$ClaudePath*") {
    $env:Path += ";$ClaudePath"
}

# Rust / Cargo / just environment
$RustPath = "$HOME\.cargo\bin"
if ($env:PATH -notlike "*$RustPath*") {
    $env:PATH = "$RustPath;$env:PATH"
}

################
# General Envs #
################
$env:ANTHROPIC_MODEL = $null
$env:ANTHROPIC_DEFAULT_FABLE_MODEL = $null
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = $null
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = $null
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = $null
$env:ANTHROPIC_BASE_URL = $null
$env:ANTHROPIC_AUTH_TOKEN = $null
$env:ANTHROPIC_API_KEY = $null

$env:CLAUDE_CODE_USE_POWERSHELL_TOOL = "1"

$env:AI_GATEWAY_BASE_URL="https://base-url.com/gateway/v1"
$env:AI_GATEWAY_API_KEY="sk-..."

# Claude Code model aliases (mirrors .custom_environment.sh.example)
# ccn  -> MiniMax M3 (1M context), replace base URL/token with your gateway
function ccn {
    $env:ANTHROPIC_AUTH_TOKEN             = "sk-..."
    $env:ANTHROPIC_BASE_URL               = "https://netmind.viettel.vn/gateway"  # no /v1
    $env:ANTHROPIC_MODEL                  = "MiniMax/MiniMax-M3[1m]"
    $env:ANTHROPIC_DEFAULT_FABLE_MODEL    = "MiniMax/MiniMax-M3[1m]"
    $env:ANTHROPIC_DEFAULT_HAIKU_MODEL    = "MiniMax/MiniMax-M3[1m]"
    $env:ANTHROPIC_DEFAULT_OPUS_MODEL     = "MiniMax/MiniMax-M3[1m]"
    $env:ANTHROPIC_DEFAULT_SONNET_MODEL   = "MiniMax/MiniMax-M3[1m]"
    claude @args
}

# cco -> opencode-go deepseek-v4-flash (1M context)
function cco {
    $env:ANTHROPIC_API_KEY                = "sk-..."
    $env:ANTHROPIC_BASE_URL               = "https://opencode.ai/zen/go"
    $env:ANTHROPIC_MODEL = "deepseek-v4-flash[1m]"
    $env:ANTHROPIC_DEFAULT_FABLE_MODEL = "deepseek-v4-flash[1m]"
    $env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "deepseek-v4-flash[1m]"
    $env:ANTHROPIC_DEFAULT_OPUS_MODEL = "deepseek-v4-flash[1m]"
    $env:ANTHROPIC_DEFAULT_SONNET_MODEL = "deepseek-v4-flash[1m]"
    claude @args
}

$env:NO_PROXY="localhost,127.0.0.1"

$env:GEMINI_API_KEY = "AQ...."
