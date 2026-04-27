import Foundation

enum Config {
    // ZMIEŃ na swój adres produkcyjny i klucz API
    static let apiBaseURL = "https://twoja-domena.pl"
    static let widgetApiKey = "twoj-tajny-klucz-12345"
    static let appURLScheme = "starkit"

    static var ordersURL: URL {
        URL(string: "\(apiBaseURL)/api/widget/orders")!
    }

    // Deep linki otwierające aplikację StarKit
    static var allOrdersDeepLink: URL {
        URL(string: "\(appURLScheme)://orders")!
    }

    static func orderDeepLink(id: String) -> URL {
        URL(string: "\(appURLScheme)://order/\(id)")!
    }

    // URL panelu admina (otwiera przeglądarkę z aplikacji)
    static func orderAdminWebURL(id: String) -> URL {
        URL(string: "\(apiBaseURL)/admin/orders/\(id)")!
    }
}
