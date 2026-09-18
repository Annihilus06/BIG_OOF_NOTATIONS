export const DEFAULT_SCENARIOS = {
  default: {
    name: "Commercial Office & Solar (Benchmark)",
    description: "Standard 24-hour commercial load curve with rooftop 40kW solar and 25kWh Battery ESS with Time-of-Use tariff.",
    battery_capacity_kwh: 25.0,
    max_charge_kw: 6.0,
    max_discharge_kw: 6.0,
    initial_soc_kwh: 10.0,
    final_soc_target_kwh: 8.0,
    battery_efficiency: 0.94,
    min_soc_pct: 0.15,
    max_soc_pct: 0.95,
    degradation_cost_per_kwh: 0.004,
    load_profile: [
      3.2, 2.9, 2.8, 2.7, 3.1, 4.5,
      7.8, 12.4, 15.6, 17.2, 18.0, 18.5,
      17.9, 18.2, 17.5, 16.8, 15.0, 12.2,
      9.5, 7.8, 6.2, 5.0, 4.1, 3.5
    ],
    solar_profile: [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.2,
      1.8, 5.5, 11.2, 16.8, 20.5, 22.4,
      21.8, 19.5, 15.2, 9.8, 4.2, 1.1,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ],
    tariff_profile: [
      0.12, 0.12, 0.12, 0.12, 0.12, 0.14,
      0.18, 0.22, 0.24, 0.22, 0.18, 0.16,
      0.16, 0.18, 0.22, 0.28, 0.38, 0.45,
      0.45, 0.42, 0.35, 0.20, 0.15, 0.12
    ],
    feed_in_tariff: [
      0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
      0.06, 0.06, 0.07, 0.07, 0.06, 0.06,
      0.06, 0.06, 0.07, 0.08, 0.10, 0.12,
      0.12, 0.10, 0.08, 0.06, 0.05, 0.05
    ]
  },
  summer_heatwave: {
    name: "Summer Heatwave & AC Spikes",
    description: "High evening air-conditioning demand with aggressive peak pricing between 4 PM and 9 PM ($0.58/kWh).",
    battery_capacity_kwh: 30.0,
    max_charge_kw: 8.0,
    max_discharge_kw: 8.0,
    initial_soc_kwh: 12.0,
    final_soc_target_kwh: 10.0,
    battery_efficiency: 0.95,
    min_soc_pct: 0.10,
    max_soc_pct: 0.95,
    degradation_cost_per_kwh: 0.005,
    load_profile: [
      4.5, 4.0, 3.8, 3.8, 4.2, 5.5,
      9.0, 14.5, 18.0, 21.0, 23.5, 25.0,
      26.2, 27.0, 26.5, 25.8, 28.0, 29.5,
      27.0, 23.0, 18.5, 13.0, 8.5, 6.0
    ],
    solar_profile: [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.5,
      3.0, 8.0, 15.0, 22.0, 27.0, 29.0,
      28.5, 25.0, 20.0, 13.0, 6.0, 1.5,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ],
    tariff_profile: [
      0.14, 0.14, 0.14, 0.14, 0.14, 0.16,
      0.20, 0.26, 0.28, 0.26, 0.22, 0.20,
      0.20, 0.24, 0.30, 0.40, 0.52, 0.58,
      0.58, 0.50, 0.42, 0.28, 0.18, 0.14
    ],
    feed_in_tariff: Array(24).fill(0.06)
  },
  high_solar: {
    name: "High Solar Farm & EV Fleet",
    description: "Large 50kW solar array with fleet EV charging window during peak afternoon generation.",
    battery_capacity_kwh: 40.0,
    max_charge_kw: 10.0,
    max_discharge_kw: 10.0,
    initial_soc_kwh: 15.0,
    final_soc_target_kwh: 15.0,
    battery_efficiency: 0.96,
    min_soc_pct: 0.10,
    max_soc_pct: 0.98,
    degradation_cost_per_kwh: 0.003,
    load_profile: [
      2.5, 2.2, 2.0, 2.0, 2.5, 3.5,
      6.0, 10.0, 22.0, 24.0, 25.0, 26.0,
      24.0, 22.0, 18.0, 14.0, 10.0, 7.0,
      5.5, 4.5, 3.8, 3.2, 2.8, 2.5
    ],
    solar_profile: [
      0.0, 0.0, 0.0, 0.0, 0.0, 1.0,
      4.5, 12.0, 24.0, 36.0, 44.0, 48.0,
      46.0, 40.0, 30.0, 18.0, 8.0, 2.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ],
    tariff_profile: [
      0.11, 0.11, 0.11, 0.11, 0.11, 0.13,
      0.17, 0.21, 0.22, 0.19, 0.15, 0.12,
      0.12, 0.15, 0.20, 0.28, 0.39, 0.44,
      0.44, 0.38, 0.29, 0.19, 0.14, 0.11
    ],
    feed_in_tariff: Array(24).fill(0.05)
  }
};

export const QUICK_PROMPT_SUGGESTIONS = [
  "Solar production will drop to 20% between 1 PM and 3 PM.",
  "Keep minimum battery reserve at 40% between 6 PM and 10 PM.",
  "Do not charge the battery between 5 PM and 9 PM during peak tariff.",
  "Limit grid import to 4 kW from 6 PM to 10 PM.",
  "Cloud cover reduces solar by 60% from 12 PM to 4 PM and save 50% battery for evening."
];
