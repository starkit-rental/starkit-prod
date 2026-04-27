import SwiftUI

@main
struct StarKitApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var deepLinkOrderID: String?

    var body: some Scene {
        WindowGroup {
            ContentView(highlightedOrderID: $deepLinkOrderID)
                .onOpenURL { url in
                    guard url.scheme == Config.appURLScheme else { return }
                    if url.host == "order" {
                        deepLinkOrderID = url.pathComponents.dropFirst().first
                    } else {
                        deepLinkOrderID = nil
                    }
                }
                .onReceive(NotificationCenter.default.publisher(for: .openOrder)) { notif in
                    if let orderId = notif.object as? String {
                        deepLinkOrderID = orderId
                    }
                }
        }
    }
}

// MARK: - AppDelegate (push notifications + widget refresh)

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        PushManager.shared.requestPermission(application: application)
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        PushManager.shared.registerToken(deviceToken)
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("[Push] Registration failed: \(error.localizedDescription)")
    }
}
