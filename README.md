# Portwatch

[![Build](https://github.com/danishweb/Portwatch/actions/workflows/build.yml/badge.svg)](https://github.com/danishweb/Portwatch/actions/workflows/build.yml)

A cross-platform desktop app that shows all listening TCP ports, maps them to processes, and lets you kill them with one click.

No more `lsof -i :3000 | grep LISTEN` followed by `kill -9 <PID>`. Just open Portwatch.

## Features

- **Live port monitoring** — Scans every 5 seconds, auto-updates
- **Process mapping** — See which process owns each port (node, python, postgres, etc.)
- **One-click kill** — Stop (SIGTERM) or force kill (SIGKILL) any process
- **Search & filter** — Filter by port number, process name, or PID
- **Color-coded categories** — Databases (purple), web servers (blue), system services (orange), dev tools (green)
- **Confirmation dialogs** — Force kill requires confirmation to prevent accidents
- **Cross-platform** — macOS, Linux, and Windows with native APIs
- **Lightweight** — ~5MB binary, minimal CPU/memory usage
- **Dark mode** — System, light, and dark theme support
- **Keyboard shortcuts** — Cmd/Ctrl+R (refresh), Cmd/Ctrl+F (search), arrow keys (navigate)
- **Port grouping** — Toggle between flat list and group-by-process views

## Requirements

- macOS 10.15+, Linux (any modern distro), or Windows 10+
- [Node.js 18+](https://nodejs.org/) and [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/) (for building from source)

## Install

### Homebrew (macOS)

```bash
brew install danishweb/tap/portwatch
```

### Windows

Download the `.exe` (NSIS installer) or `.msi` from [GitHub Releases](https://github.com/danishweb/Portwatch/releases). The NSIS installer supports per-user or per-machine installation.

### Download

Grab the latest release for any platform from [GitHub Releases](https://github.com/danishweb/Portwatch/releases).

### Build from source

```bash
git clone https://github.com/danishweb/Portwatch.git
cd Portwatch
pnpm install
pnpm tauri build
```

The built app will be at:
- **macOS**: `src-tauri/target/release/bundle/macos/Portwatch.app`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `appimage/`
- **Windows**: `src-tauri/target/release/bundle/msi/` or `nsis/`

### Development

```bash
pnpm tauri dev
```

## Usage

1. Open Portwatch
2. All listening TCP ports appear in the list
3. Use the search bar to filter by port, process name, or PID
4. Click the **stop button** (orange) to gracefully stop a process (SIGTERM)
5. Click the **force kill button** (red) — a confirmation dialog will appear

### Port Categories

| Color | Category | Examples |
|-------|----------|----------|
| Purple | Database | PostgreSQL (5432), MySQL (3306), Redis (6379), MongoDB (27017) |
| Blue | Web Server | HTTP (80/443), Express (3000), Django (8000) |
| Orange | System | Ports below 1024 |
| Green | Development | Ports 3000-9999 |
| Gray | Other | Everything else |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri v2](https://v2.tauri.app/) |
| Backend | Rust |
| Frontend | React + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS |

## Project Structure

```
Portwatch/
├── package.json               # Frontend deps + scripts
├── vite.config.ts             # Vite config
├── tsconfig.json
├── index.html                 # HTML entry
├── src/                       # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── PortList.tsx       # Table with search, headers, status bar
│   │   └── PortRow.tsx        # Single port row + kill buttons
│   ├── hooks/
│   │   └── usePortScanner.ts  # Polling hook (scan every 5s)
│   ├── types/
│   │   └── port.ts            # TypeScript interfaces
│   └── index.css              # Tailwind imports
└── src-tauri/                 # Rust backend
    ├── Cargo.toml
    ├── tauri.conf.json
    └── src/
        ├── lib.rs             # Tauri commands (scan_ports, kill_process)
        ├── main.rs            # Desktop entry point
        ├── models.rs          # PortEntry, PortCategory
        └── scanner/
            ├── mod.rs         # Scanner trait + OS factory
            ├── macos.rs       # lsof parser
            ├── linux.rs       # ss / /proc/net/tcp parser
            └── windows.rs     # Win32 API scanner (netstat fallback)
```

## How It Works

### macOS
Runs `/usr/sbin/lsof -i -P -n -sTCP:LISTEN` to find all listening TCP ports.

### Linux
Uses `ss -tlnp` (with `/proc/net/tcp` fallback) to enumerate listeners.

### Windows
Uses Win32 API (`GetExtendedTcpTable` + `CreateToolhelp32Snapshot`) for fast, native port scanning. Falls back to `netstat -ano` + `tasklist` if the API is unavailable.

> **Note**: Running Portwatch as administrator shows all system processes. Without admin privileges, some system-level ports may be hidden — the app displays a "Limited view" indicator in this case.

### Process termination
- **Stop**: Sends SIGTERM (Unix) or `TerminateProcess` (Windows)
- **Force kill**: Sends SIGKILL (Unix) or `TerminateProcess` (Windows)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
