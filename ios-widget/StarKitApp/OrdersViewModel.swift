import Foundation
import SwiftUI

@Observable
class OrdersViewModel {
    var response: WidgetResponse?
    var isLoading = false
    var error: String?
    var lastUpdated: Date?

    func refresh() async {
        isLoading = true
        error = nil
        do {
            response = try await NetworkService.shared.fetchOrders()
            lastUpdated = Date()
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
