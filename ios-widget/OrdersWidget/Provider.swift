import WidgetKit
import Foundation

struct OrdersProvider: TimelineProvider {

    func placeholder(in context: Context) -> OrderEntry {
        OrderEntry.placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (OrderEntry) -> Void) {
        if context.isPreview {
            completion(OrderEntry.placeholder)
            return
        }
        Task {
            let entry = await fetchEntry()
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<OrderEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            // Odśwież co 15 minut
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    private func fetchEntry() async -> OrderEntry {
        do {
            let response = try await NetworkService.shared.fetchOrders()
            return OrderEntry(date: Date(), response: response, error: nil, isPlaceholder: false)
        } catch {
            return OrderEntry(date: Date(), response: nil, error: error.localizedDescription, isPlaceholder: false)
        }
    }
}
