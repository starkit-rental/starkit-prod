import Foundation

actor NetworkService {
    static let shared = NetworkService()

    func fetchOrders() async throws -> WidgetResponse {
        var request = URLRequest(url: Config.ordersURL)
        request.httpMethod = "GET"
        request.setValue(Config.widgetApiKey, forHTTPHeaderField: "x-widget-api-key")
        request.timeoutInterval = 15

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        guard http.statusCode == 200 else {
            throw NetworkError.httpError(http.statusCode)
        }

        let decoder = JSONDecoder()
        return try decoder.decode(WidgetResponse.self, from: data)
    }
}

enum NetworkError: LocalizedError {
    case invalidResponse
    case httpError(Int)

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Nieprawidłowa odpowiedź serwera"
        case .httpError(let code): return "Błąd HTTP \(code)"
        }
    }
}
