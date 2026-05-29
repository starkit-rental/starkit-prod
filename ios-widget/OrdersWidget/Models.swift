import Foundation
import WidgetKit

// MARK: - API Response Models

struct WidgetResponse: Codable {
    let today: String
    let stats: Stats
    let upcoming: [Order]
    let active: [Order]
    let todayPickup: [Order]
    let todayReturn: [Order]
    let newOrders: [Order]

    enum CodingKeys: String, CodingKey {
        case today, stats, upcoming, active
        case todayPickup = "today_pickup"
        case todayReturn = "today_return"
        case newOrders = "new_orders"
    }
}

struct Stats: Codable {
    let totalActive: Int
    let totalUpcoming: Int
    let todayPickup: Int
    let todayReturn: Int
    let newOrders: Int

    enum CodingKeys: String, CodingKey {
        case totalActive = "total_active"
        case totalUpcoming = "total_upcoming"
        case todayPickup = "today_pickup"
        case todayReturn = "today_return"
        case newOrders = "new_orders"
    }
}

struct Order: Codable, Identifiable {
    let id: String
    let orderNumber: String
    let customerName: String?
    let startDate: String
    let endDate: String
    let createdAt: String?
    let orderStatus: String?
    let paymentStatus: String?
    let totalRentalPrice: Double
    let daysUntilPickup: Int?
    let daysUntilReturn: Int?
    let isUpcoming: Bool
    let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case orderNumber = "order_number"
        case customerName = "customer_name"
        case startDate = "start_date"
        case endDate = "end_date"
        case createdAt = "created_at"
        case orderStatus = "order_status"
        case paymentStatus = "payment_status"
        case totalRentalPrice = "total_rental_price"
        case daysUntilPickup = "days_until_pickup"
        case daysUntilReturn = "days_until_return"
        case isUpcoming = "is_upcoming"
        case isActive = "is_active"
    }

    var displayName: String {
        customerName ?? "Brak klienta"
    }

    var formattedPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        return "\(formatter.string(from: NSNumber(value: totalRentalPrice)) ?? "\(Int(totalRentalPrice))") zł"
    }

    var statusColor: String {
        switch orderStatus {
        case "confirmed": return "green"
        case "pending", "new": return "orange"
        case "cancelled": return "red"
        default: return "gray"
        }
    }

    var shortDate: String {
        let start = String(startDate.prefix(10))
        let end = String(endDate.prefix(10))
        return "\(formatDate(start)) – \(formatDate(end))"
    }

    var formattedStart: String {
        formatDate(String(startDate.prefix(10)))
    }

    func formatDate(_ iso: String) -> String {
        let parts = iso.split(separator: "-")
        guard parts.count == 3 else { return iso }
        return "\(parts[2]).\(parts[1])"
    }
}

// MARK: - Seen Filtering

extension WidgetResponse {
    func filteringSeen(_ seenIds: Set<String>) -> WidgetResponse {
        let filtered = newOrders.filter { !seenIds.contains($0.id) }
        let newStats = Stats(
            totalActive: stats.totalActive,
            totalUpcoming: stats.totalUpcoming,
            todayPickup: stats.todayPickup,
            todayReturn: stats.todayReturn,
            newOrders: filtered.count
        )
        return WidgetResponse(
            today: today,
            stats: newStats,
            upcoming: upcoming,
            active: active,
            todayPickup: todayPickup,
            todayReturn: todayReturn,
            newOrders: filtered
        )
    }
}

// MARK: - Entry for WidgetKit

struct OrderEntry: TimelineEntry {
    let date: Date
    let response: WidgetResponse?
    let error: String?
    let isPlaceholder: Bool

    static let placeholder = OrderEntry(
        date: Date(),
        response: WidgetResponse(
            today: "2026-04-27",
            stats: Stats(totalActive: 3, totalUpcoming: 5, todayPickup: 2, todayReturn: 1, newOrders: 1),
            upcoming: [
                Order(id: "1", orderNumber: "SK-001", customerName: "Jan Kowalski",
                      startDate: "2026-04-28", endDate: "2026-05-02", createdAt: nil,
                      orderStatus: "confirmed", paymentStatus: "paid",
                      totalRentalPrice: 480, daysUntilPickup: 1, daysUntilReturn: nil,
                      isUpcoming: true, isActive: false),
                Order(id: "2", orderNumber: "SK-002", customerName: "Anna Nowak",
                      startDate: "2026-04-30", endDate: "2026-05-05", createdAt: nil,
                      orderStatus: "confirmed", paymentStatus: "paid",
                      totalRentalPrice: 600, daysUntilPickup: 3, daysUntilReturn: nil,
                      isUpcoming: true, isActive: false),
            ],
            active: [
                Order(id: "3", orderNumber: "SK-003", customerName: "Piotr Wiśniewski",
                      startDate: "2026-04-25", endDate: "2026-04-27", createdAt: nil,
                      orderStatus: "confirmed", paymentStatus: "paid",
                      totalRentalPrice: 240, daysUntilPickup: nil, daysUntilReturn: 0,
                      isUpcoming: false, isActive: true),
            ],
            todayPickup: [],
            todayReturn: [],
            newOrders: []
        ),
        error: nil,
        isPlaceholder: true
    )
}
