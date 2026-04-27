import Foundation
import UIKit
import UserNotifications

// MARK: - PushManager

final class PushManager: NSObject, UNUserNotificationCenterDelegate {
    static let shared = PushManager()

    override private init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    // Prosi o zgodę i rejestruje urządzenie
    func requestPermission(application: UIApplication) {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound]
        ) { granted, error in
            if granted {
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
            }
            if let error {
                print("[Push] Brak zgody: \(error.localizedDescription)")
            }
        }
    }

    // Wywoływane po otrzymaniu tokenu – wysyła go do backendu
    func registerToken(_ tokenData: Data) {
        let token = tokenData.map { String(format: "%02x", $0) }.joined()
        print("[Push] Token urządzenia: \(token)")
        Task { await sendTokenToBackend(token) }
    }

    private func sendTokenToBackend(_ token: String) async {
        guard let url = URL(string: "\(Config.apiBaseURL)/api/push/register") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.widgetApiKey, forHTTPHeaderField: "x-widget-api-key")
        request.httpBody = try? JSONEncoder().encode(["token": token, "platform": "ios"])

        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse {
                print("[Push] Token zarejestrowany, status: \(http.statusCode)")
            }
        } catch {
            print("[Push] Rejestracja tokenu nieudana: \(error.localizedDescription)")
        }
    }

    // Powiadomienie gdy aplikacja jest na pierwszym planie
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler handler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        handler([.banner, .sound, .badge])
    }

    // Obsługa kliknięcia w powiadomienie – otwiera zamówienie
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler handler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        if let orderId = userInfo["order_id"] as? String {
            DispatchQueue.main.async {
                NotificationCenter.default.post(name: .openOrder, object: orderId)
            }
        }
        handler()
    }
}

extension Notification.Name {
    static let openOrder = Notification.Name("com.starkit.openOrder")
}
