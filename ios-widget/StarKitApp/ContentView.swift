import SwiftUI
import WidgetKit

struct ContentView: View {
    @Binding var highlightedOrderID: String?
    @State private var viewModel = OrdersViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if let data = viewModel.response {
                    ordersList(data: data)
                } else if viewModel.isLoading {
                    VStack(spacing: 12) {
                        ProgressView()
                        Text("Ładowanie zamówień…")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = viewModel.error {
                    VStack(spacing: 16) {
                        Image(systemName: "wifi.exclamationmark")
                            .font(.system(size: 48))
                            .foregroundColor(.red)
                        Text("Błąd połączenia")
                            .font(.headline)
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                        Button("Spróbuj ponownie") {
                            Task { await viewModel.refresh() }
                        }
                        .buttonStyle(.bordered)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .navigationTitle("StarKit")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 8) {
                        if let date = viewModel.lastUpdated {
                            Text(date, style: .time)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                        Button {
                            Task { await viewModel.refresh() }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(viewModel.isLoading)
                    }
                }
            }
        }
        .task {
            await viewModel.refresh()
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    @ViewBuilder
    func ordersList(data: WidgetResponse) -> some View {
        // Deduplicate: each order appears in highest-priority section only
        let newIds = Set(data.newOrders.map(\.id))
        let pickupIds = Set(data.todayPickup.map(\.id))
        let returnIds = Set(data.todayReturn.map(\.id))
        let activeIds = Set(data.active.map(\.id))

        let pickupFiltered = data.todayPickup.filter { !newIds.contains($0.id) }
        let returnFiltered = data.todayReturn.filter { !newIds.contains($0.id) && !pickupIds.contains($0.id) }
        let activeFiltered = data.active.filter { !newIds.contains($0.id) && !pickupIds.contains($0.id) && !returnIds.contains($0.id) }
        let upcomingFiltered = data.upcoming.filter { !newIds.contains($0.id) && !pickupIds.contains($0.id) && !returnIds.contains($0.id) && !activeIds.contains($0.id) }

        List {
            // Stats row – "Nowe" first when > 0 so it's always visible
            Section {
                HStack(spacing: 0) {
                    if data.stats.newOrders > 0 {
                        AppStatBadge(value: data.stats.newOrders, label: "Nowe", color: .red)
                    }
                    AppStatBadge(value: data.stats.totalActive,   label: "Aktywne",     color: .green)
                    AppStatBadge(value: data.stats.totalUpcoming, label: "Nadchodzące", color: .blue)
                    AppStatBadge(value: data.stats.todayPickup,   label: "Odbiór dziś", color: .purple)
                    AppStatBadge(value: data.stats.todayReturn,   label: "Zwrot dziś",  color: .teal)
                }
                .padding(.vertical, 4)
            }

            AppOrderSection(title: "Nowe zamówienia", icon: "bell.fill",               color: .red,    orders: data.newOrders,    highlighted: highlightedOrderID)
            AppOrderSection(title: "Odbiór dziś",     icon: "arrow.right.circle.fill", color: .purple, orders: pickupFiltered,    highlighted: highlightedOrderID)
            AppOrderSection(title: "Zwrot dziś",      icon: "arrow.left.circle.fill",  color: .teal,   orders: returnFiltered,    highlighted: highlightedOrderID)
            AppOrderSection(title: "Aktywne",         icon: "play.fill",               color: .green,  orders: activeFiltered,    highlighted: highlightedOrderID)
            AppOrderSection(title: "Nadchodzące",     icon: "calendar",                color: .blue,   orders: upcomingFiltered,  highlighted: highlightedOrderID)
        }
        .listStyle(.insetGrouped)
        .refreshable { await viewModel.refresh() }
    }
}

// MARK: - Stats Badge

struct AppStatBadge: View {
    let value: Int
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text("\(value)")
                .font(.title2.bold())
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Order Section

struct AppOrderSection: View {
    let title: String
    let icon: String
    let color: Color
    let orders: [Order]
    let highlighted: String?

    var body: some View {
        if !orders.isEmpty {
            Section(header: Label(title, systemImage: icon).foregroundColor(color)) {
                ForEach(orders) { order in
                    AppOrderRow(order: order, isHighlighted: highlighted == order.id)
                }
            }
        }
    }
}

// MARK: - Order Row

struct AppOrderRow: View {
    let order: Order
    var isHighlighted: Bool = false

    var body: some View {
        Link(destination: Config.orderAdminWebURL(id: order.id)) {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(statusColor)
                    .frame(width: 4, height: 52)

                VStack(alignment: .leading, spacing: 3) {
                    HStack {
                        Text(order.orderNumber)
                            .font(.subheadline.bold())
                            .foregroundColor(.primary)
                        Spacer()
                        Text(order.formattedPrice)
                            .font(.subheadline.bold())
                            .foregroundColor(.primary)
                    }
                    HStack {
                        Text(order.displayName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                        Spacer()
                        AppPaymentBadge(status: order.paymentStatus)
                    }
                    HStack {
                        Text(order.shortDate)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        if let days = order.daysUntilPickup, days >= 0 {
                            Text("odbiór za \(days)d")
                                .font(.caption.bold())
                                .foregroundColor(.blue)
                        } else if let days = order.daysUntilReturn, days >= 0 {
                            Text("zwrot za \(days)d")
                                .font(.caption.bold())
                                .foregroundColor(.orange)
                        }
                    }
                }

                Image(systemName: "chevron.right")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 4)
        }
        .listRowBackground(isHighlighted ? Color.orange.opacity(0.12) : nil)
    }

    var statusColor: Color {
        switch order.orderStatus {
        case "confirmed": return .green
        case "pending", "new": return .orange
        case "cancelled": return .red
        default: return .gray
        }
    }
}

// MARK: - Payment Badge

struct AppPaymentBadge: View {
    let status: String?

    var body: some View {
        if let s = status {
            Text(label(for: s))
                .font(.system(size: 10, weight: .semibold))
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(badgeColor(for: s).opacity(0.15))
                .foregroundColor(badgeColor(for: s))
                .clipShape(Capsule())
        }
    }

    func label(for s: String) -> String {
        switch s {
        case "paid":    return "opłacone"
        case "unpaid":  return "nieopłacone"
        case "partial": return "częściowo"
        default:        return s
        }
    }

    func badgeColor(for s: String) -> Color {
        switch s {
        case "paid":    return .green
        case "unpaid":  return .red
        case "partial": return .orange
        default:        return .gray
        }
    }
}
