import SwiftUI
import WidgetKit

struct ContentView: View {
    @Binding var highlightedOrderID: String?
    @State private var viewModel = OrdersViewModel()
    @State private var seenStore = SeenOrdersStore.shared
    @State private var selectedOrder: Order? = nil

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
        .onChange(of: highlightedOrderID) { _, newId in
            guard let id = newId, let data = viewModel.response else { return }
            let all = data.newOrders + data.active + data.upcoming + data.todayPickup + data.todayReturn
            if let order = all.first(where: { $0.id == id }) {
                selectedOrder = order
            }
        }
        .sheet(item: $selectedOrder) { order in
            let isNew = viewModel.response?.newOrders.contains(where: { $0.id == order.id }) == true
                        && !seenStore.seenIds.contains(order.id)
            OrderDetailSheet(order: order, isNew: isNew) {
                seenStore.markSeen(order.id)
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }

    @ViewBuilder
    func ordersList(data: WidgetResponse) -> some View {
        let visibleNew = data.newOrders.filter { !seenStore.seenIds.contains($0.id) }
        let newIds = Set(visibleNew.map(\.id))
        let pickupIds = Set(data.todayPickup.map(\.id))
        let returnIds = Set(data.todayReturn.map(\.id))
        let activeIds = Set(data.active.map(\.id))

        let pickupFiltered  = data.todayPickup.filter { !newIds.contains($0.id) }
        let returnFiltered  = data.todayReturn.filter { !newIds.contains($0.id) && !pickupIds.contains($0.id) }
        let activeFiltered  = data.active.filter    { !newIds.contains($0.id) && !pickupIds.contains($0.id) && !returnIds.contains($0.id) }
        let upcomingFiltered = data.upcoming.filter { !newIds.contains($0.id) && !pickupIds.contains($0.id) && !returnIds.contains($0.id) && !activeIds.contains($0.id) }

        List {
            Section {
                HStack(spacing: 0) {
                    if visibleNew.count > 0 {
                        AppStatBadge(value: visibleNew.count, label: "Nowe", color: .red)
                    }
                    AppStatBadge(value: data.stats.totalActive,   label: "Aktywne",     color: .green)
                    AppStatBadge(value: data.stats.totalUpcoming, label: "Nadchodzące", color: .blue)
                    AppStatBadge(value: data.stats.todayPickup,   label: "Odbiór dziś", color: .purple)
                    AppStatBadge(value: data.stats.todayReturn,   label: "Zwrot dziś",  color: .teal)
                }
                .padding(.vertical, 4)
            }

            if !visibleNew.isEmpty {
                Section {
                    ForEach(visibleNew) { order in
                        AppOrderRow(order: order, isHighlighted: highlightedOrderID == order.id) {
                            selectedOrder = order
                        } onMarkSeen: {
                            seenStore.markSeen(order.id)
                            WidgetCenter.shared.reloadAllTimelines()
                        }
                    }
                } header: {
                    HStack {
                        Label("Nowe zamówienia", systemImage: "bell.fill")
                            .foregroundColor(.red)
                        Spacer()
                        Button("Oznacz wszystkie") {
                            seenStore.markAllSeen(visibleNew.map(\.id))
                            WidgetCenter.shared.reloadAllTimelines()
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .textCase(nil)
                    }
                }
            }

            AppOrderSection(title: "Odbiór dziś",  icon: "arrow.right.circle.fill", color: .purple, orders: pickupFiltered,    highlighted: highlightedOrderID) { selectedOrder = $0 }
            AppOrderSection(title: "Zwrot dziś",   icon: "arrow.left.circle.fill",  color: .teal,   orders: returnFiltered,    highlighted: highlightedOrderID) { selectedOrder = $0 }
            AppOrderSection(title: "Aktywne",      icon: "play.fill",               color: .green,  orders: activeFiltered,    highlighted: highlightedOrderID) { selectedOrder = $0 }
            AppOrderSection(title: "Nadchodzące",  icon: "calendar",                color: .blue,   orders: upcomingFiltered,  highlighted: highlightedOrderID) { selectedOrder = $0 }
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
    let onTap: (Order) -> Void

    var body: some View {
        if !orders.isEmpty {
            Section(header: Label(title, systemImage: icon).foregroundColor(color)) {
                ForEach(orders) { order in
                    AppOrderRow(order: order, isHighlighted: highlighted == order.id) {
                        onTap(order)
                    }
                }
            }
        }
    }
}

// MARK: - Order Row

struct AppOrderRow: View {
    let order: Order
    var isHighlighted: Bool = false
    let onTap: () -> Void
    var onMarkSeen: (() -> Void)? = nil

    var body: some View {
        Button(action: onTap) {
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
        .buttonStyle(.plain)
        .listRowBackground(isHighlighted ? Color.orange.opacity(0.12) : nil)
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            if let markSeen = onMarkSeen {
                Button(action: markSeen) {
                    Label("Widziałem", systemImage: "eye.fill")
                }
                .tint(.blue)
            }
        }
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

// MARK: - Order Detail Sheet

struct OrderDetailSheet: View {
    let order: Order
    let isNew: Bool
    let onMarkSeen: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(order.orderNumber)
                                .font(.title2.bold())
                            Text(order.displayName)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Text(order.formattedPrice)
                            .font(.title2.bold())
                    }
                    .padding(.vertical, 4)
                }

                Section("Termin") {
                    LabeledContent("Start", value: order.formattedStart)
                    LabeledContent("Koniec", value: order.formatDate(String(order.endDate.prefix(10))))
                    if let days = order.daysUntilPickup, days >= 0 {
                        LabeledContent("Odbiór za") {
                            Text(days == 0 ? "dziś" : "\(days) dni")
                                .foregroundColor(.blue)
                                .fontWeight(.semibold)
                        }
                    } else if let days = order.daysUntilReturn, days >= 0 {
                        LabeledContent("Zwrot za") {
                            Text(days == 0 ? "dziś" : "\(days) dni")
                                .foregroundColor(.orange)
                                .fontWeight(.semibold)
                        }
                    }
                }

                Section("Status") {
                    LabeledContent("Zamówienie") {
                        OrderStatusBadge(status: order.orderStatus)
                    }
                    LabeledContent("Płatność") {
                        AppPaymentBadge(status: order.paymentStatus)
                    }
                }

                Section {
                    if isNew {
                        Button {
                            onMarkSeen()
                            dismiss()
                        } label: {
                            Label("Oznacz jako widziane", systemImage: "eye.fill")
                        }
                        .foregroundColor(.blue)
                    }

                    Link(destination: Config.orderAdminWebURL(id: order.id)) {
                        Label("Otwórz w panelu admina", systemImage: "safari")
                    }
                }
            }
            .navigationTitle("Zamówienie")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Zamknij") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Order Status Badge

struct OrderStatusBadge: View {
    let status: String?

    var body: some View {
        if let s = status {
            Text(label(for: s))
                .font(.system(size: 12, weight: .semibold))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(color(for: s).opacity(0.15))
                .foregroundColor(color(for: s))
                .clipShape(Capsule())
        }
    }

    func label(for s: String) -> String {
        switch s {
        case "confirmed": return "potwierdzone"
        case "pending":   return "oczekujące"
        case "new":       return "nowe"
        case "cancelled": return "anulowane"
        case "active":    return "aktywne"
        default:          return s
        }
    }

    func color(for s: String) -> Color {
        switch s {
        case "confirmed":       return .green
        case "pending", "new":  return .orange
        case "cancelled":       return .red
        case "active":          return .blue
        default:                return .gray
        }
    }
}
