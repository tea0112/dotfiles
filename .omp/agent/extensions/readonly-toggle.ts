import type { ExtensionAPI, ExtensionContext, ToolCallEvent } from "@oh-my-pi/pi-coding-agent";

export default function readonlyToggleExtension(pi: ExtensionAPI) {
	let isReadOnly = true;

	// Hard blocked write/execute tools in Read-Only mode
	const BLOCKED_TOOLS: Record<string, true> = {
		write: true,
		edit: true,
		ast_edit: true,
		eval: true,
		task: true,
		manage_skill: true,
	};

	// Mutating keywords for MCP tools
	const MCP_MUTATING_KEYWORDS = [
		"write",
		"edit",
		"modify",
		"delete",
		"remove",
		"drop",
		"insert",
		"update",
		"create",
		"exec",
		"run",
		"send",
		"post",
		"put",
		"patch",
	];

	// Safe PowerShell cmdlets & aliases for inspection/reading
	const PWSH_READ_CMDS =
		"(Get|Test|Select|Format|Measure|Compare|Sort|Group|Show|Find)-[a-z0-9]+|Out-(String|Host|Null|Default|GridView)|Write-(Output|Host|Information|Verbose)|gc|gci|gi|gp|gcm|gsv|gps|gl|ghy|gal|gmo|gv|gcim|gwmi|sls|ft|fl|fw|pwd|select|measure|compare|sort|group";

	// Safe Windows inspection commands
	const WIN_READ_TOOLS =
		"tasklist|netstat|ipconfig|systeminfo|whoami|hostname|fc|comp|attrib|reg\\s+query|sc\\s+query|net\\s+(user|localgroup|share|start|view)";

	// Regex for definitely safe read-only bash / powershell / windows commands
	// Supports direct execution or wrapper: powershell -Command "Get-Process"
	const SAFE_BASH_PATTERN = new RegExp(
		`^\\s*((powershell|pwsh)(\\.exe)?\\s+(-[a-zA-Z0-9:]+\\s+)*['"]?\\s*(&\\s*\\{\\s*)?)?(` +
		`git\\s+(status|diff|log|show|branch|remote|tag|rev-parse)|` +
		`cargo\\s+(check|test)|npm\\s+test|pnpm\\s+test|bun\\s+test|go\\s+test|pytest|tsc(\\s+--noEmit)?|` +
		`ls|cat|head|tail|wc|grep|sed|awk|find|which|file|ps|uptime|uname|curl|jq|diff|stat|rg|fd|tree|bat|type|dir|echo|printenv|env|less|more|findstr|where|` +
		`${PWSH_READ_CMDS}|${WIN_READ_TOOLS}` +
		`)\\b`,
		"i",
	);

	// Regex for explicit dangerous bash commands, file mutations, and mutating PowerShell cmdlets
	const DANGEROUS_BASH_PATTERN =
		/(\b(rm|mv|cp|mkdir|touch|chmod|chown|unlink|truncate|sed\s+(-[a-zA-Z]*i|--in-place)|git\s+(commit|push|merge|rebase|reset|checkout\s+-b|restore|clean|stash\s+(drop|pop))|npm\s+(install|i|uninstall|update)|pnpm\s+(add|remove|install)|bun\s+(add|remove|install)|cargo\s+(add|install)|pip\s+install|apt(-get)?\s+install|(Remove|Set|New|Rename|Clear|Reset)-[a-z0-9]+|Stop-Process|Stop-Service|Restart-Service|Restart-Computer|Out-File|del|erase|rd|rmdir|ni|sc|ac|clc|rni|spps)\b|[>]{1,2}|\|\s*tee\b)/i;

	const updateUI = (ctx: ExtensionContext) => {
		if (isReadOnly) {
			ctx.ui.setStatus("readonly-mode", "🔒 READ-ONLY");
			ctx.ui.notify("🔒 [Read-Only ON] Đã khóa các tool sửa code. Bấm Alt+W để mở.", "warning");
		} else {
			ctx.ui.setStatus("readonly-mode", undefined);
			ctx.ui.notify("⚡ [Read-Only OFF] Đã bật lại chế độ YOLO.", "info");
		}
	};

	const toggle = (ctx: ExtensionContext) => {
		isReadOnly = !isReadOnly;
		updateUI(ctx);
	};

	// 1. Phím tắt Alt+W
	pi.registerShortcut("alt+w", {
		description: "Toggle Read-Only / Normal Mode",
		handler: toggle,
	});

	// 2. Slash command /readonly
	pi.registerCommand("readonly", {
		description: "Bật/Tắt chế độ chỉ đọc (Read-Only)",
		handler: async (_args, ctx) => {
			toggle(ctx);
		},
	});

	// 3. Hiển thị trạng thái khi bắt đầu session mới
	pi.on("session_start", async (_event, ctx) => {
		if (isReadOnly) {
			ctx.ui.setStatus("readonly-mode", "🔒 READ-ONLY");
		}
	});

	// 4. Intercept tool calls
	pi.on("tool_call", async (event: ToolCallEvent, ctx: ExtensionContext) => {
		if (!isReadOnly) return;

		const toolName = event.toolName;

		// A. Block core mutating tools
		if (BLOCKED_TOOLS[toolName]) {
			return {
				block: true,
				reason: `[Read-Only Mode] Tool '${toolName}' bị khóa để bảo vệ code. Bấm Alt+W nếu muốn mở quyền ghi.`,
			};
		}

		// B. Inspect MCP tools
		if (toolName.startsWith("mcp__")) {
			const lowerTool = toolName.toLowerCase();
			const isMutating = MCP_MUTATING_KEYWORDS.some((kw) => lowerTool.includes(kw));
			if (isMutating) {
				return {
					block: true,
					reason: `[Read-Only Mode] MCP Tool '${toolName}' bị chặn vì nghi ngờ gây thay đổi dữ liệu. Bấm Alt+W để mở quyền ghi.`,
				};
			}
		}

		// C. Inspect Bash commands
		if (toolName === "bash") {
			const input = (event as { input?: { command?: string } }).input;
			const command = (input?.command ?? "").trim();

			// Nếu là lệnh an toàn rõ ràng (git status, cargo check, ls, grep...) -> cho chạy
			if (SAFE_BASH_PATTERN.test(command) && !DANGEROUS_BASH_PATTERN.test(command)) {
				return;
			}

			// Nếu chứa lệnh nguy hiểm rõ ràng -> chặn thẳng
			if (DANGEROUS_BASH_PATTERN.test(command)) {
				return {
					block: true,
					reason: `[Read-Only Mode] Lệnh bash '${command}' bị chặn do có nguy cơ sửa đổi file/hệ thống. Bấm Alt+W để mở quyền ghi.`,
				};
			}

			// Lệnh không rõ an toàn/nguy hiểm: hỏi xác nhận người dùng nếu có UI
			if (ctx.hasUI && typeof ctx.ui.confirm === "function") {
				const allowed = await ctx.ui.confirm(
					"Xác nhận lệnh Bash (Read-Only Mode)",
					`Agent muốn chạy lệnh:\n  ${command}\n\nBạn có cho phép chạy lệnh này không?`,
				);
				if (!allowed) {
					return {
						block: true,
						reason: `[Read-Only Mode] Người dùng đã từ chối thực thi lệnh: ${command}`,
					};
				}
				return;
			}

			// Headless hoặc không có UI: chặn để an toàn
			return {
				block: true,
				reason: `[Read-Only Mode] Lệnh bash '${command}' bị chặn vì an toàn. Bấm Alt+W để mở quyền.`,
			};
		}
	});
}
