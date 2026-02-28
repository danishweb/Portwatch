# Portwatch

A native macOS app that shows all listening TCP ports, maps them to processes, and lets you kill them with one click.

No more `lsof -i :3000 | grep LISTEN` followed by `kill -9 <PID>`. Just open Portwatch.

## Features

- **Live port monitoring** — Scans every 5 seconds, auto-updates
- **Process mapping** — See which process owns each port (node, python, postgres, etc.)
- **One-click kill** — Stop (SIGTERM) or force kill (SIGKILL) any process
- **Search & filter** — Filter by port number, process name, or PID
- **Color-coded categories** — Databases (purple), web servers (blue), system services (orange), dev tools (green)
- **Confirmation dialogs** — Force kill requires confirmation to prevent accidents
- **Zero dependencies** — Pure Swift + SwiftUI, nothing to install
- **Lightweight** — ~5MB, minimal CPU/memory usage

## Requirements

- macOS 13.0 (Ventura) or later
- Swift 5.9+

## Install

### Build from source

```bash
git clone https://github.com/danishweb/Portwatch.git
cd Portwatch
make install
```

Then open **Portwatch** from `/Applications` or Spotlight.

### Run without installing

```bash
make run
```

## Usage

1. Open Portwatch
2. All listening TCP ports appear in the list
3. Use the search bar to filter by port, process name, or PID
4. Click the **stop icon** (orange) to gracefully stop a process (SIGTERM)
5. Click the **bolt icon** (red) to force kill — a confirmation dialog will appear

### Port Categories

| Color | Category | Examples |
|-------|----------|----------|
| Purple | Database | PostgreSQL (5432), MySQL (3306), Redis (6379), MongoDB (27017) |
| Blue | Web Server | HTTP (80/443), Express (3000), Django (8000) |
| Orange | System | Ports below 1024 |
| Green | Development | Ports 3000-9999 |
| Gray | Other | Everything else |

## Build Commands

| Command | Description |
|---------|-------------|
| `make build` | Debug build |
| `make release` | Optimized release build |
| `make bundle` | Release build + create signed `.app` bundle |
| `make run` | Build and launch |
| `make install` | Build and copy to `/Applications` |
| `make clean` | Remove build artifacts |

## Project Structure

```
Portwatch/
├── Package.swift                       # SPM config (macOS 13+, zero deps)
├── Makefile                            # Build, bundle, install commands
├── Resources/
│   └── Info.plist                      # App bundle config
└── Sources/Portwatch/
    ├── App/PortwatchApp.swift          # SwiftUI app entry point
    ├── Models/PortEntry.swift          # Port data model + category enum
    ├── Services/PortScanner.swift      # lsof execution + output parsing
    ├── ViewModels/PortListViewModel.swift  # State, timer, kill logic
    └── Views/
        ├── PortListView.swift          # Main window view
        └── PortRowView.swift           # Individual port row
```

7 Swift files. That's it.

## How It Works

1. Runs `/usr/sbin/lsof -i -P -n -sTCP:LISTEN` to find all listening TCP ports
2. Parses the output to extract port, PID, process name, and address
3. Deduplicates entries (same process on IPv4 + IPv6)
4. Uses POSIX `kill()` syscall directly for process termination — no shell involved

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
