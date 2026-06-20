local wezterm = require("wezterm")
local act = wezterm.action
local config = wezterm.config_builder()

-- =========================================================
-- OS detection
-- =========================================================

local function is_windows()
	return wezterm.target_triple:find("windows") ~= nil
end

local function is_linux()
	return wezterm.target_triple:find("linux") ~= nil
end

local function detect_linux_distro()
	local f = io.open("/etc/os-release", "r")
	if not f then
		return nil
	end

	local content = f:read("*a")
	f:close()

	return content:match('\nID="?([^"\n]+)"?') or content:match('^ID="?([^"\n]+)"?')
end

-- =========================================================
-- WSL detection
-- =========================================================

local ignored_wsl_distros = {
	["docker-desktop"] = true,
	["docker-desktop-data"] = true,
}

local function get_wsl_domains()
	if not is_windows() then
		return {}
	end

	local ok, domains = pcall(wezterm.default_wsl_domains)
	if not ok or not domains then
		return {}
	end

	local filtered = {}

	for _, dom in ipairs(domains) do
		if dom.distribution and not ignored_wsl_distros[dom.distribution] then
			table.insert(filtered, dom)
		end
	end

	return filtered
end

local function ubuntu_version_number(distribution)
	local major, minor = distribution:match("^Ubuntu%-(%d+)%.(%d+)$")

	if major and minor then
		return tonumber(major) * 100 + tonumber(minor)
	end

	return nil
end

local function choose_wsl_domain()
	local domains = get_wsl_domains()

	-- 1. Prefer Ubuntu 26.04 explicitly.
	for _, dom in ipairs(domains) do
		if dom.distribution == "Ubuntu-26.04" then
			return dom
		end
	end

	-- 2. Prefer highest versioned Ubuntu, e.g. Ubuntu-24.04, Ubuntu-26.04.
	local best_ubuntu = nil
	local best_ubuntu_version = -1

	for _, dom in ipairs(domains) do
		local version = ubuntu_version_number(dom.distribution)

		if version and version > best_ubuntu_version then
			best_ubuntu = dom
			best_ubuntu_version = version
		end
	end

	if best_ubuntu then
		return best_ubuntu
	end

	-- 3. Generic Ubuntu fallback.
	for _, dom in ipairs(domains) do
		if dom.distribution == "Ubuntu" then
			return dom
		end
	end

	-- 4. Other common Linux distros.
	local fallback_distros = {
		"Debian",
		"Fedora",
	}

	for _, wanted in ipairs(fallback_distros) do
		for _, dom in ipairs(domains) do
			if dom.distribution == wanted then
				return dom
			end
		end
	end

	-- 5. Last resort: first non-Docker WSL distro.
	return domains[1]
end

local function make_wsl_launch_menu()
	local items = {}

	for _, dom in ipairs(get_wsl_domains()) do
		table.insert(items, {
			label = dom.distribution,
			domain = { DomainName = dom.name },
		})
	end

	return items
end

-- =========================================================
-- Theme
-- =========================================================

local function scheme_exists(name)
	local schemes = wezterm.get_builtin_color_schemes()
	return schemes[name] ~= nil
end

local function first_available_scheme(names)
	for _, name in ipairs(names) do
		if scheme_exists(name) then
			return name
		end
	end

	return "Dracula"
end

config.color_scheme = first_available_scheme({
	"Dracula (Official)",
	"Dracula",
})

config.colors = {
	-- Keep Dracula background explicit.
	foreground = "#f8f8f2",
	background = "#282a36",
	cursor_bg = "#f8f8f2",
	cursor_fg = "#282a36",
	cursor_border = "#f8f8f2",
	selection_fg = "#f8f8f2",
	selection_bg = "#44475a",

	tab_bar = {
		background = "#191a21",

		active_tab = {
			bg_color = "#282a36",
			fg_color = "#f8f8f2",
			intensity = "Bold",
		},

		inactive_tab = {
			bg_color = "#191a21",
			fg_color = "#6272a4",
		},

		inactive_tab_hover = {
			bg_color = "#44475a",
			fg_color = "#f8f8f2",
		},

		new_tab = {
			bg_color = "#191a21",
			fg_color = "#bd93f9",
		},

		new_tab_hover = {
			bg_color = "#44475a",
			fg_color = "#f8f8f2",
		},
	},
}

-- =========================================================
-- Platform behavior
-- =========================================================

if is_windows() then
	local wsl = choose_wsl_domain()

	if wsl then
		config.default_domain = wsl.name
	end

	config.launch_menu = make_wsl_launch_menu()

	table.insert(config.launch_menu, {
		label = "PowerShell",
		args = { "pwsh.exe", "-NoLogo" },
	})

	table.insert(config.launch_menu, {
		label = "Command Prompt",
		args = { "cmd.exe" },
	})
elseif is_linux() then
	local distro = detect_linux_distro()

	if distro == "ubuntu" then
	-- Native Ubuntu-specific settings can go here later.
	elseif distro == "fedora" then
		-- Native Fedora-specific settings can go here later.
	end
end

-- =========================================================
-- Appearance
-- =========================================================

-- Portable font setup:
-- Do not force a font family. WezTerm has a bundled default stack.
config.font_size = 12
config.line_height = 1.1

config.window_padding = {
	left = 8,
	right = 8,
	top = 8,
	bottom = 8,
}

config.initial_cols = 120
config.initial_rows = 32

config.enable_scroll_bar = true

-- Use the fancy tab bar; stable builds may show tab close buttons by default.
config.enable_tab_bar = true
config.show_tabs_in_tab_bar = true
config.use_fancy_tab_bar = true
config.hide_tab_bar_if_only_one_tab = false
config.tab_bar_at_bottom = false

-- Keep Windows minimize/maximize/close buttons.
if is_windows() then
	config.window_decorations = "INTEGRATED_BUTTONS|RESIZE"
	config.integrated_title_buttons = { "Hide", "Maximize", "Close" }
	config.integrated_title_button_style = "Windows"
else
	config.window_decorations = "RESIZE"
end

config.window_close_confirmation = "NeverPrompt"
config.adjust_window_size_when_changing_font_size = false

-- =========================================================
-- Wayland
-- =========================================================

config.enable_wayland = true

local function is_wayland()
	return os.getenv("WAYLAND_DISPLAY") ~= nil
end

if is_linux() and is_wayland() then
	config.use_ime = true
	config.ime_preedit_rendering = "Builtin"
end

-- =========================================================
-- Behavior
-- =========================================================

config.scrollback_lines = 10000
config.audible_bell = "Disabled"
config.hide_mouse_cursor_when_typing = true
config.check_for_updates = false

-- Keep TERM on the portable default for WSL + tmux.
config.term = "xterm-256color"

-- =========================================================
-- Key bindings
-- =========================================================

config.keys = {
	-- Command palette
	{ key = "P", mods = "CTRL|SHIFT", action = act.ActivateCommandPalette },

	-- Font size
	{ key = "=", mods = "CTRL", action = act.IncreaseFontSize },
	{ key = "+", mods = "CTRL|SHIFT", action = act.IncreaseFontSize },
	{ key = "-", mods = "CTRL", action = act.DecreaseFontSize },
	{ key = "0", mods = "CTRL", action = act.ResetFontSize },

	-- Tabs
	{ key = "t", mods = "CTRL|SHIFT", action = act.SpawnTab("CurrentPaneDomain") },
	{ key = "w", mods = "CTRL|SHIFT", action = act.CloseCurrentTab({ confirm = true }) },
	{ key = "Tab", mods = "CTRL", action = act.ActivateTabRelative(1) },
	{ key = "Tab", mods = "CTRL|SHIFT", action = act.ActivateTabRelative(-1) },

	-- Splits
	{
		key = "\\",
		mods = "CTRL|SHIFT",
		action = act.SplitHorizontal({ domain = "CurrentPaneDomain" }),
	},
	{
		key = "-",
		mods = "CTRL|SHIFT",
		action = act.SplitVertical({ domain = "CurrentPaneDomain" }),
	},

	-- Alt+h/j/k/l pass through so tmux and Neovim can handle split movement.

	-- Pane resizing
	{ key = "LeftArrow", mods = "ALT|SHIFT", action = act.AdjustPaneSize({ "Left", 5 }) },
	{ key = "RightArrow", mods = "ALT|SHIFT", action = act.AdjustPaneSize({ "Right", 5 }) },
	{ key = "UpArrow", mods = "ALT|SHIFT", action = act.AdjustPaneSize({ "Up", 3 }) },
	{ key = "DownArrow", mods = "ALT|SHIFT", action = act.AdjustPaneSize({ "Down", 3 }) },

	-- Search and quick select
	{ key = "f", mods = "CTRL|SHIFT", action = act.Search("CurrentSelectionOrEmptyString") },
	{ key = " ", mods = "CTRL|SHIFT", action = act.QuickSelect },

	-- Reload config
	{ key = "r", mods = "CTRL|SHIFT", action = act.ReloadConfiguration },

	-- Send custom escape sequences for tmux.
	-- Ctrl + Shift + Left / Right often does not survive terminal layers reliably.
	{ key = "LeftArrow", mods = "CTRL|SHIFT", action = act.SendString("\x1b[5;30012~") },
	{ key = "RightArrow", mods = "CTRL|SHIFT", action = act.SendString("\x1b[5;30013~") },
}

-- =========================================================
-- Mouse
-- =========================================================

config.mouse_bindings = {
	-- Normal mouse wheel scroll.
	{
		event = { Down = { streak = 1, button = { WheelUp = 1 } } },
		mods = "NONE",
		action = act.ScrollByCurrentEventWheelDelta,
	},
	{
		event = { Down = { streak = 1, button = { WheelDown = 1 } } },
		mods = "NONE",
		action = act.ScrollByCurrentEventWheelDelta,
	},

	-- CTRL + mouse wheel changes font size.
	{
		event = { Down = { streak = 1, button = { WheelUp = 1 } } },
		mods = "CTRL",
		action = act.IncreaseFontSize,
	},
	{
		event = { Down = { streak = 1, button = { WheelDown = 1 } } },
		mods = "CTRL",
		action = act.DecreaseFontSize,
	},
}

return config
