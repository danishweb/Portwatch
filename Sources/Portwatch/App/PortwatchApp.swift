import SwiftUI

@main
struct PortwatchApp: App {
    @StateObject private var viewModel = PortListViewModel()

    var body: some Scene {
        WindowGroup {
            PortListView(viewModel: viewModel)
                .frame(minWidth: 500, minHeight: 400)
        }
        .windowStyle(.titleBar)
        .defaultSize(width: 600, height: 500)
    }
}
