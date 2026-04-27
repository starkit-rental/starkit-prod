import WidgetKit
import SwiftUI

// MARK: - Main Widget Definition

@main
struct OrdersWidgetBundle: WidgetBundle {
    var body: some Widget {
        OrdersWidget()
    }
}

struct OrdersWidget: Widget {
    let kind: String = "OrdersWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: OrdersProvider()) { entry in
            OrdersWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Zamówienia StarKit")
        .description("Pokaż aktywne i nadchodzące zamówienia.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Preview

#Preview(as: .systemSmall) {
    OrdersWidget()
} timeline: {
    OrderEntry.placeholder
}

#Preview(as: .systemMedium) {
    OrdersWidget()
} timeline: {
    OrderEntry.placeholder
}

#Preview(as: .systemLarge) {
    OrdersWidget()
} timeline: {
    OrderEntry.placeholder
}
