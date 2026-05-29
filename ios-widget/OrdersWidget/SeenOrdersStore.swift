import Foundation
import Observation

// Shared between StarKitApp and OrdersWidget via App Groups.
// In Xcode: add this file to BOTH targets.
// Requires "App Groups" capability with group ID: group.pl.starkit.widget

@Observable
final class SeenOrdersStore {
    static let shared = SeenOrdersStore()

    private let defaults: UserDefaults
    private let key = "seenOrderIds"

    private(set) var seenIds: Set<String>

    private init() {
        self.defaults = UserDefaults(suiteName: "group.pl.starkit.widget") ?? .standard
        self.seenIds = Set(self.defaults.stringArray(forKey: "seenOrderIds") ?? [])
    }

    func markSeen(_ id: String) {
        guard !seenIds.contains(id) else { return }
        seenIds.insert(id)
        persist()
    }

    func markAllSeen(_ ids: [String]) {
        seenIds.formUnion(ids)
        persist()
    }

    private func persist() {
        var arr = Array(seenIds)
        if arr.count > 200 { arr = Array(arr.suffix(200)) }
        defaults.set(arr, forKey: key)
    }
}
