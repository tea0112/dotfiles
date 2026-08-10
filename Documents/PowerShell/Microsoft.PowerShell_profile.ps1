# Set up PSReadLine for better command line editing and history
Import-Module PSReadLine
Set-PSReadLineOption -PredictionSource HistoryAndPlugin -ErrorAction SilentlyContinue
Set-PSReadLineOption -PredictionViewStyle ListView -ErrorAction SilentlyContinue
Set-PSReadLineOption -ShowToolTips
Set-PSReadLineOption -EditMode Emacs

# Enable auto-completion suggestions behavior
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
Set-PSReadLineKeyHandler -Key RightArrow -Function ForwardChar

# Common Aliases
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

# Claude Code model aliases (mirrors .custom_environment.sh.example)
# ccn  -> MiniMax M3 (1M context), replace base URL/token with your gateway
function ccn {
    $env:ANTHROPIC_MODEL = "MiniMax/MiniMax-M3[1m]"
    $env:ANTHROPIC_DEFAULT_FABLE_MODEL = "MiniMax/MiniMax-M3[1m]"
    $env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "MiniMax/MiniMax-M3[1m]"
    $env:ANTHROPIC_DEFAULT_OPUS_MODEL = "MiniMax/MiniMax-M3[1m]"
    $env:ANTHROPIC_DEFAULT_SONNET_MODEL = "MiniMax/MiniMax-M3[1m]"
    $env:ANTHROPIC_BASE_URL = "https://base-url.com"
    $env:ANTHROPIC_AUTH_TOKEN = "sk-key"
    claude @args
}

# cco -> opencode-go deepseek-v4-flash (1M context)
function cco {
    $env:ANTHROPIC_MODEL = "opencode-go/deepseek-v4-flash[1m]"
    $env:ANTHROPIC_DEFAULT_FABLE_MODEL = "opencode-go/deepseek-v4-flash[1m]"
    $env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "opencode-go/deepseek-v4-flash[1m]"
    $env:ANTHROPIC_DEFAULT_OPUS_MODEL = "opencode-go/deepseek-v4-flash[1m]"
    $env:ANTHROPIC_DEFAULT_SONNET_MODEL = "opencode-go/deepseek-v4-flash[1m]"
    $env:ANTHROPIC_BASE_URL = "https://opencode.ai/zen/go"
    $env:ANTHROPIC_AUTH_TOKEN = "sk-key"
    claude @args
}

# General Envs
#$env:ANTHROPIC_BASE_URL = "https://netmind.viettel.vn/gateway"
#$env:ANTHROPIC_AUTH_TOKEN = "sk-..."
#$env:ANTHROPIC_MODEL = "MiniMax/MiniMax-M3[1m]"

$env:ANTHROPIC_BASE_URL = "https://opencode.ai/zen/go"
$env:ANTHROPIC_API_KEY = "sk-..."
$env:ANTHROPIC_MODEL = "deepseek-v4-flash[1m]"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "deepseek-v4-flash[1m]"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "deepseek-v4-flash[1m]"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "deepseek-v4-flash[1m]"
$env:CLAUDE_CODE_USE_POWERSHELL_TOOL = "1"

$env:AI_GATEWAY_BASE_URL="https://AI.comn/gateway/v1"
$env:AI_GATEWAY_API_KEY="sk-...."

$env:NO_PROXY="localhost,127.0.0.1"

