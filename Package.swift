// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Portwatch",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "Portwatch",
            path: "Sources/Portwatch"
        )
    ]
)
