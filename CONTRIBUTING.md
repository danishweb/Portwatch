# Contributing to Portwatch

Thanks for your interest in contributing!

## Getting Started

1. Fork the repo
2. Clone your fork
3. Create a branch: `git checkout -b my-feature`
4. Make your changes
5. Build and test: `npm run tauri dev`
6. Commit and push
7. Open a Pull Request

## Development

### Prerequisites

- [Node.js 18+](https://nodejs.org/) and npm
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific dependencies:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`
  - **Windows**: [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (ships with Windows 11)

### Commands

```bash
# Install dependencies
npm install

# Start dev server (hot-reload frontend + Rust rebuild)
npm run tauri dev

# Production build
npm run tauri build

# Frontend only (no Tauri)
npm run dev
```

## Guidelines

- Keep it simple. Portwatch is intentionally minimal.
- Follow existing code style (Rust conventions for backend, React/TS for frontend).
- One feature per PR.
- Test on your platform before submitting.

## Architecture

- **Rust backend** (`src-tauri/src/`): Port scanning and process management. OS-specific scanners implement the `PortScanner` trait.
- **React frontend** (`src/`): UI with TypeScript. Communicates with Rust via Tauri's `invoke()`.
- **Tauri bridge**: Commands defined in `lib.rs` are callable from the frontend.

## Adding a New Platform Scanner

1. Create `src-tauri/src/scanner/<platform>.rs`
2. Implement the `PortScanner` trait
3. Add the `cfg` gate in `scanner/mod.rs`

## Reporting Issues

Open an issue with:
- OS and version
- Steps to reproduce
- Expected vs actual behavior
