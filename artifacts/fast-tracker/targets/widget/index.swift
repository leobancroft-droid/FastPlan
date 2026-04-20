import WidgetKit
import SwiftUI

private let APP_GROUP = "group.com.altfast.shared"

struct FastPlanEntry: TimelineEntry {
    let date: Date
    let dayType: String       // "fast" or "eat"
    let streak: Int
    let dateLabel: String     // e.g. "Mon 20 Apr"
    let kcalGoal: Int
    let kcalConsumed: Int
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> FastPlanEntry {
        FastPlanEntry(date: Date(), dayType: "fast", streak: 1, dateLabel: shortDate(Date()), kcalGoal: 2000, kcalConsumed: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (FastPlanEntry) -> Void) {
        completion(readEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FastPlanEntry>) -> Void) {
        let entry = readEntry()
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func readEntry() -> FastPlanEntry {
        let defaults = UserDefaults(suiteName: APP_GROUP)
        let dayType = defaults?.string(forKey: "dayType") ?? "fast"
        let streak = defaults?.integer(forKey: "streak") ?? 0
        let dateLabel = defaults?.string(forKey: "dateLabel") ?? shortDate(Date())
        let kcalGoal = defaults?.integer(forKey: "kcalGoal") ?? 0
        let kcalConsumed = defaults?.integer(forKey: "kcalConsumed") ?? 0
        return FastPlanEntry(
            date: Date(),
            dayType: dayType,
            streak: streak,
            dateLabel: dateLabel,
            kcalGoal: kcalGoal,
            kcalConsumed: kcalConsumed
        )
    }

    private func shortDate(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE d MMM"
        return f.string(from: d)
    }
}

struct FastPlanWidgetView: View {
    var entry: FastPlanEntry

    private var isFast: Bool { entry.dayType == "fast" }
    private var label: String { isFast ? "Fast Day" : "Eat Day" }
    private var iconName: String { isFast ? "moon.stars.fill" : "fork.knife" }
    private var accent: Color { isFast ? Color(red: 0.65, green: 0.38, blue: 0.88) : Color(red: 0.92, green: 0.38, blue: 0.60) }

    var body: some View {
        ZStack {
            Color(red: 0.10, green: 0.06, blue: 0.18)
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("FastPlan")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white.opacity(0.7))
                    Spacer()
                    HStack(spacing: 3) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 11))
                            .foregroundColor(.orange)
                        Text("\(entry.streak)")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                    }
                }

                Spacer(minLength: 0)

                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .stroke(accent.opacity(0.25), lineWidth: 4)
                            .frame(width: 52, height: 52)
                        Circle()
                            .trim(from: 0, to: progress())
                            .stroke(accent, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                            .frame(width: 52, height: 52)
                        Image(systemName: iconName)
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundColor(accent)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(label)
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(.white)
                        Text(entry.dateLabel)
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.6))
                    }
                    Spacer()
                }

                if entry.kcalGoal > 0 {
                    Text("\(entry.kcalConsumed) / \(entry.kcalGoal) kcal")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
            .padding(14)
        }
    }

    private func progress() -> CGFloat {
        guard entry.kcalGoal > 0 else { return isFast ? 0.0 : 0.0 }
        return min(1.0, max(0.0, CGFloat(entry.kcalConsumed) / CGFloat(entry.kcalGoal)))
    }
}

struct FastPlanWidget: Widget {
    let kind: String = "FastPlanWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                FastPlanWidgetView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                FastPlanWidgetView(entry: entry)
            }
        }
        .configurationDisplayName("FastPlan")
        .description("Today's fasting day at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct FastPlanWidgetBundle: WidgetBundle {
    var body: some Widget {
        FastPlanWidget()
    }
}
