Example go-tools/projectA-go-tools.txt
```go
# Normal Go tool
github.com/go-delve/delve/cmd/dlv@latest

# Custom (install via script)
golangci-lint:curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/HEAD/install.sh | sh -s -- -b $(go env GOPATH)/bin v2.2.1
```

 How It Works
If the line has a colon :, it does whatever you put after it as a shell command (so any complex install is supported).

Otherwise, it does go install.

No limits: You can mix and match custom installation logic for any binary/tool, per project or Go version.


If your script expects just the project name, run:
bash ~/go-tools/rebuild-go-tools.sh tg
