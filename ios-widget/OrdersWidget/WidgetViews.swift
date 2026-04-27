import SwiftUI
import WidgetKit

// MARK: - Brand Color

private extension Color {
    static let starOrange = Color(red: 0.98, green: 0.45, blue: 0.08)
}

// MARK: - Entry View Router

struct OrdersWidgetEntryView: View {
    var entry: OrderEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:  SmallView(entry: entry)
        case .systemMedium: MediumView(entry: entry)
        default:            LargeView(entry: entry)
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - Small Widget (2×2)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

struct SmallView: View {
    let entry: OrderEntry
    var body: some View {
        Group {
            if let data = entry.response {
                SmallContent(data: data)
            } else if let error = entry.error {
                ErrorTile(message: error)
            } else {
                LoadingTile()
            }
        }
        .widgetURL(Config.allOrdersDeepLink)
    }
}

private struct SmallContent: View {
    let data: WidgetResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 4) {
                Image(systemName: "shippingbox.fill")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.starOrange)
                Text("StarKit")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.primary)
            }

            Spacer()

            let main = mainStat(data)
            Text("\(main.value)")
                .font(.system(size: 48, weight: .black, design: .rounded))
                .foregroundColor(.starOrange)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
            Text(main.label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.secondary)

            Spacer()

            HStack(spacing: 0) {
                StatDot(value: data.stats.totalActive, label: "aktyw", color: .green)
                StatDot(value: data.stats.totalUpcoming, label: "nadch", color: .blue)
                StatDot(value: data.stats.todayPickup, label: "odbr", color: .purple)
                if data.stats.newOrders > 0 {
                    StatDot(value: data.stats.newOrders, label: "nowe", color: .red)
                }
            }
        }
        .padding(14)
    }

    func mainStat(_ d: WidgetResponse) -> (value: Int, label: String) {
        if d.stats.newOrders > 0    { return (d.stats.newOrders,   "nowe zamówienia") }
        if d.stats.todayPickup > 0  { return (d.stats.todayPickup, "odbiór dziś") }
        if d.stats.totalActive > 0  { return (d.stats.totalActive, "aktywne") }
        return (d.stats.totalUpcoming, "nadchodzące")
    }
}

private struct StatDot: View {
    let value: Int
    let label: String
    let color: Color
    var body: some View {
        VStack(spacing: 1) {
            Text("\(value)")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 8, weight: .medium))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - Medium Widget (4×2)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

struct MediumView: View {
    let entry: OrderEntry
    var body: some View {
        if let data = entry.response {
            MediumContent(data: data)
        } else if let error = entry.error {
            ErrorTile(message: error)
        } else {
            LoadingTile()
        }
    }
}

private struct MediumContent: View {
    let data: WidgetResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack(spacing: 0) {
                HStack(spacing: 4) {
                    Image(systemName: "shippingbox.fill")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.starOrange)
                    Text("StarKit")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.primary)
                }
                Spacer()
                HStack(spacing: 8) {
                    ChipStat(value: data.stats.totalActive, label: "akt", color: .green)
                    ChipStat(value: data.stats.totalUpcoming, label: "nad", color: .blue)
                    ChipStat(value: data.stats.todayPickup, label: "odb", color: .purple)
                    if data.stats.newOrders > 0 {
                        ChipStat(value: data.stats.newOrders, label: "nowe", color: .red)
                    }
                }
            }
            .padding(.bottom, 8)

            // Orders
            let orders = priorityOrders(data)
            if orders.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    Text("Brak zamówień")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                }
                Spacer()
            } else {
                ForEach(orders.prefix(3)) { order in
                    Link(destination: Config.orderDeepLink(id: order.id)) {
                        CompactRow(order: order)
                    }
                    if order.id != orders.prefix(3).last?.id {
                        Divider().padding(.leading, 14)
                    }
                }
                Spacer(minLength: 0)
            }
        }
        .padding(14)
    }

    func priorityOrders(_ d: WidgetResponse) -> [Order] {
        if !d.newOrders.isEmpty   { return d.newOrders }
        if !d.todayPickup.isEmpty { return d.todayPickup }
        if !d.active.isEmpty      { return d.active }
        return d.upcoming
    }
}

private struct ChipStat: View {
    let value: Int
    let label: String
    let color: Color
    var body: some View {
        HStack(spacing: 2) {
            Text("\(value)")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 9, weight: .medium))
                .foregroundColor(.secondary)
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - Large Widget (4×4)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

struct LargeView: View {
    let entry: OrderEntry
    var body: some View {
        if let data = entry.response {
            LargeContent(data: data)
        } else if let error = entry.error {
            ErrorTile(message: error)
        } else {
            LoadingTile()
        }
    }
}

private struct SectionData: Identifiable {
    var id: String { title }
    let title: String
    let icon: String
    let color: Color
    let orders: [Order]
}

private struct LargeContent: View {
    let data: WidgetResponse

    private var visibleSections: [SectionData] {
        var result: [SectionData] = []
        var remaining = 4

        let all: [(String, String, Color, [Order])] = [
            ("Nowe zamówienia", "bell.fill", .red, data.newOrders),
            ("Odbiór dziś", "arrow.right.circle.fill", .purple, data.todayPickup),
            ("Aktywne", "play.fill", .green, data.active),
            ("Nadchodzące", "calendar", .blue, data.upcoming),
        ]

        for (title, icon, color, orders) in all where !orders.isEmpty && remaining > 0 {
            let take = min(2, remaining, orders.count)
            result.append(SectionData(title: title, icon: icon, color: color, orders: Array(orders.prefix(take))))
            remaining -= take
        }

        return result
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // ── Header ──
            HStack(spacing: 0) {
                HStack(spacing: 5) {
                    Image(systemName: "shippingbox.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.starOrange)
                    Text("StarKit")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.primary)
                }
                Spacer()
                HStack(spacing: 10) {
                    ChipStat(value: data.stats.totalActive, label: "aktyw", color: .green)
                    ChipStat(value: data.stats.totalUpcoming, label: "nadch", color: .blue)
                    ChipStat(value: data.stats.todayPickup, label: "odbr", color: .purple)
                    if data.stats.newOrders > 0 {
                        ChipStat(value: data.stats.newOrders, label: "nowe", color: .red)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 10)

            Divider().padding(.horizontal, 16)

            // ── Sections ──
            ForEach(visibleSections) { section in
                SectionLabel(title: section.title, icon: section.icon, color: section.color)
                ForEach(section.orders) { order in
                    Link(destination: Config.orderDeepLink(id: order.id)) {
                        DetailRow(order: order)
                    }
                }
            }

            Spacer(minLength: 0)

            // ── Footer ──
            Divider().padding(.horizontal, 16)
            Link(destination: Config.allOrdersDeepLink) {
                HStack {
                    Spacer()
                    Text("Wszystkie zamówienia")
                        .font(.system(size: 11, weight: .semibold))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 10, weight: .semibold))
                }
                .foregroundColor(.starOrange)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
            }
        }
    }
}

private struct SectionLabel: View {
    let title: String
    let icon: String
    let color: Color
    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 9, weight: .semibold))
            Text(title)
                .font(.system(size: 10, weight: .bold))
        }
        .foregroundColor(color)
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 4)
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - Order Rows
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/// 2-line compact row for Medium widget
private struct CompactRow: View {
    let order: Order

    var body: some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 2)
                .fill(statusColor)
                .frame(width: 3, height: 30)

            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(order.orderNumber)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.primary)
                    Spacer()
                    Text(order.formattedPrice)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.primary)
                }
                HStack {
                    Text(order.displayName)
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                    Spacer()
                    paymentBadge
                    daysLabel
                }
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 8, weight: .semibold))
                .foregroundColor(Color.secondary.opacity(0.4))
        }
        .padding(.vertical, 3)
    }

    @ViewBuilder var paymentBadge: some View {
        if let s = order.paymentStatus {
            let (label, color) = paymentDisplay(s)
            Text(label)
                .font(.system(size: 8, weight: .semibold))
                .padding(.horizontal, 4)
                .padding(.vertical, 1)
                .background(color.opacity(0.12))
                .foregroundColor(color)
                .clipShape(Capsule())
        }
    }

    @ViewBuilder var daysLabel: some View {
        if let d = order.daysUntilPickup, d >= 0 {
            Text("za \(d)d")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.blue)
        } else if let d = order.daysUntilReturn, d >= 0 {
            Text("zwrot \(d)d")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.orange)
        }
    }

    var statusColor: Color { orderStatusColor(order.orderStatus) }
}

/// 3-line detail row for Large widget (matches app style)
private struct DetailRow: View {
    let order: Order

    var body: some View {
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 2)
                .fill(statusColor)
                .frame(width: 4, height: 42)

            VStack(alignment: .leading, spacing: 2) {
                // Line 1: order number + price
                HStack {
                    Text(order.orderNumber)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.primary)
                    Spacer()
                    Text(order.formattedPrice)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.primary)
                }
                // Line 2: customer + payment badge + days
                HStack(spacing: 4) {
                    Text(order.displayName)
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                    Spacer()
                    paymentBadge
                    daysLabel
                }
                // Line 3: date range
                Text(order.shortDate)
                    .font(.system(size: 9))
                    .foregroundColor(.secondary)
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(Color.secondary.opacity(0.4))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 5)
    }

    @ViewBuilder var paymentBadge: some View {
        if let s = order.paymentStatus {
            let (label, color) = paymentDisplay(s)
            Text(label)
                .font(.system(size: 9, weight: .semibold))
                .padding(.horizontal, 5)
                .padding(.vertical, 2)
                .background(color.opacity(0.12))
                .foregroundColor(color)
                .clipShape(Capsule())
        }
    }

    @ViewBuilder var daysLabel: some View {
        if let d = order.daysUntilPickup, d >= 0 {
            Text("za \(d)d")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.blue)
        } else if let d = order.daysUntilReturn, d >= 0 {
            Text("zwrot \(d)d")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.orange)
        }
    }

    var statusColor: Color { orderStatusColor(order.orderStatus) }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - Shared Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

private func orderStatusColor(_ status: String?) -> Color {
    switch status {
    case "confirmed": return .green
    case "pending", "new": return .orange
    case "cancelled": return .red
    default: return .gray
    }
}

private func paymentDisplay(_ status: String) -> (String, Color) {
    switch status {
    case "paid":    return ("opłacone",    .green)
    case "unpaid":  return ("nieopłacone", .red)
    case "partial": return ("częściowo",   .orange)
    default:        return (status,        .gray)
    }
}

// MARK: - Utility Views

struct ErrorTile: View {
    let message: String
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "wifi.exclamationmark")
                .font(.title3).foregroundColor(.red)
            Text(message)
                .font(.caption2).foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

struct LoadingTile: View {
    var body: some View {
        VStack(spacing: 6) {
            ProgressView()
            Text("Ładowanie…")
                .font(.caption2).foregroundColor(.secondary)
        }
    }
}
