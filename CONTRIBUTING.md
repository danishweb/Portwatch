# Contributing to Portwatch

Thanks for your interest in contributing!

## Getting Started

1. Fork the repo
2. Clone your fork
3. Create a branch: `git checkout -b my-feature`
4. Make your changes
5. Build and test: `make run`
6. Commit and push
7. Open a Pull Request

## Development

```bash
# Debug build (faster compilation)
make build

# Run the app
make run

# Clean build artifacts
make clean
```

### Requirements

- macOS 13.0+
- Swift 5.9+
- Xcode Command Line Tools (`xcode-select --install`)

## Guidelines

- Keep it simple. Portwatch is intentionally minimal.
- No external dependencies unless absolutely necessary.
- Follow existing code style (Swift standard conventions).
- One feature per PR.

## Ideas for Contribution

- Homebrew formula / cask
- App icon
- Launch at login option
- Keyboard shortcuts
- Copy port/PID to clipboard
- Group ports by process
- Notifications when new ports appear
- Custom refresh interval

## Reporting Issues

Open an issue with:
- macOS version
- Steps to reproduce
- Expected vs actual behavior
