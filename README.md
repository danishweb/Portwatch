# Portwatch

A cross-platform desktop app that shows all listening TCP ports, maps them to processes, and lets you kill them with one click.

No more `lsof -i :3000 | grep LISTEN` followed by `kill -9 <PID>`. Just open Portwatch.

## Features

- **Live port monitoring** — Scans every 5 seconds, auto-updates
- **Process mapping** — See which process owns each port (node, python, postgres, etc.)
- **One-click kill** — Stop (SIGTERM) or force kill (SIGKILL) any process
- **Search & filter** — Filter by port number, process name, or PID
- **Color-coded categories** — Databases (purple), web servers (blue), system services (orange), dev tools (green)
- **Confirmation dialogs** — Force kill requires confirmation to prevent accidents
- **Cross-platform** — macOS, Linux, and Windows
- **Lightweight** — ~5MB binary, minimal CPU/memory usage

## Requirements

- macOS 10.15+, Linux (any modern distro), or Windows 10+
- [Node.js 18+](https://nodejs.org/) and npm
- [Rust](https://rustup.rs/) (for building from source)

## Install

### Build from source

```bash
git clone https://github.com/danishweb/Portwatch.git
cd Portwatch
npm install
npm run tauri build
```

The built app will be at:
- **macOS**: `src-tauri/target/release/bundle/macos/Portwatch.app`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `appimage/`
- **Windows**: `src-tauri/target/release/bundle/msi/` or `nsis/`

### Development

```bash
npm run tauri dev
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
            └── windows.rs     # netstat parser
```

## How It Works

### macOS
Runs `/usr/sbin/lsof -i -P -n -sTCP:LISTEN` to find all listening TCP ports.

### Linux
Uses `ss -tlnp` (with `/proc/net/tcp` fallback) to enumerate listeners.

### Windows
Parses `netstat -ano` output and maps PIDs to process names via `tasklist`.

### Process termination
- **Stop**: Sends SIGTERM (Unix) or `taskkill` (Windows)
- **Force kill**: Sends SIGKILL (Unix) or `taskkill /F` (Windows)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
