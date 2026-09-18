"""
Realistic 24-hour Energy Profile Presets
"""
from models import ScenarioData

# 1. Standard Benchmark Scenario (Commercial Building with Solar & Battery)
DEFAULT_SCENARIO = ScenarioData(
    name="Commercial Office & Solar (Benchmark)",
    description="Standard 24-hour commercial load curve with rooftop 40kW solar and 25kWh Battery ESS with Time-of-Use tariff.",
    battery_capacity_kwh=25.0,
    max_charge_kw=6.0,
    max_discharge_kw=6.0,
    initial_soc_kwh=10.0,
    final_soc_target_kwh=8.0,
    battery_efficiency=0.94,
    min_soc_pct=0.15,
    max_soc_pct=0.95,
    degradation_cost_per_kwh=0.004,
    # Hourly demand in kWh (00:00 to 23:00)
    load_profile=[
        3.2, 2.9, 2.8, 2.7, 3.1, 4.5,
        7.8, 12.4, 15.6, 17.2, 18.0, 18.5,
        17.9, 18.2, 17.5, 16.8, 15.0, 12.2,
        9.5, 7.8, 6.2, 5.0, 4.1, 3.5
    ],
    # Solar generation profile in kWh (Peak at noon ~22 kWh)
    solar_profile=[
        0.0, 0.0, 0.0, 0.0, 0.0, 0.2,
        1.8, 5.5, 11.2, 16.8, 20.5, 22.4,
        21.8, 19.5, 15.2, 9.8, 4.2, 1.1,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ],
    # Time-of-Use Grid Purchase Tariff ($/kWh): Off-peak $0.12, Mid-day $0.18, Peak (17:00-21:00) $0.42
    tariff_profile=[
        0.12, 0.12, 0.12, 0.12, 0.12, 0.14,
        0.18, 0.22, 0.24, 0.22, 0.18, 0.16,
        0.16, 0.18, 0.22, 0.28, 0.38, 0.45,
        0.45, 0.42, 0.35, 0.20, 0.15, 0.12
    ],
    # Feed-in Tariff ($/kWh) for export
    feed_in_tariff=[
        0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
        0.06, 0.06, 0.07, 0.07, 0.06, 0.06,
        0.06, 0.06, 0.07, 0.08, 0.10, 0.12,
        0.12, 0.10, 0.08, 0.06, 0.05, 0.05
    ]
)

# 2. Summer Heatwave Peak Scenario
SUMMER_HEATWAVE_SCENARIO = ScenarioData(
    name="Summer Heatwave & AC Spikes",
    description="High evening air-conditioning demand with aggressive peak pricing between 4 PM and 9 PM.",
    battery_capacity_kwh=30.0,
    max_charge_kw=8.0,
    max_discharge_kw=8.0,
    initial_soc_kwh=12.0,
    final_soc_target_kwh=10.0,
    battery_efficiency=0.95,
    min_soc_pct=0.10,
    max_soc_pct=0.95,
    degradation_cost_per_kwh=0.005,
    load_profile=[
        4.5, 4.0, 3.8, 3.8, 4.2, 5.5,
        9.0, 14.5, 18.0, 21.0, 23.5, 25.0,
        26.2, 27.0, 26.5, 25.8, 28.0, 29.5,
        27.0, 23.0, 18.5, 13.0, 8.5, 6.0
    ],
    solar_profile=[
        0.0, 0.0, 0.0, 0.0, 0.0, 0.5,
        3.0, 8.0, 15.0, 22.0, 27.0, 29.0,
        28.5, 25.0, 20.0, 13.0, 6.0, 1.5,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ],
    tariff_profile=[
        0.14, 0.14, 0.14, 0.14, 0.14, 0.16,
        0.20, 0.26, 0.28, 0.26, 0.22, 0.20,
        0.20, 0.24, 0.30, 0.40, 0.52, 0.58,
        0.58, 0.50, 0.42, 0.28, 0.18, 0.14
    ],
    feed_in_tariff=[0.06] * 24
)

# 3. High Solar Microgrid with Cloud Volatility
HIGH_SOLAR_SCENARIO = ScenarioData(
    name="High Solar Farm & EV Fleet",
    description="Large 50kW solar array with fleet EV charging window during work hours.",
    battery_capacity_kwh=40.0,
    max_charge_kw=10.0,
    max_discharge_kw=10.0,
    initial_soc_kwh=15.0,
    final_soc_target_kwh=15.0,
    battery_efficiency=0.96,
    min_soc_pct=0.10,
    max_soc_pct=0.98,
    degradation_cost_per_kwh=0.003,
    load_profile=[
        2.5, 2.2, 2.0, 2.0, 2.5, 3.5,
        6.0, 10.0, 22.0, 24.0, 25.0, 26.0,
        24.0, 22.0, 18.0, 14.0, 10.0, 7.0,
        5.5, 4.5, 3.8, 3.2, 2.8, 2.5
    ],
    solar_profile=[
        0.0, 0.0, 0.0, 0.0, 0.0, 1.0,
        4.5, 12.0, 24.0, 36.0, 44.0, 48.0,
        46.0, 40.0, 30.0, 18.0, 8.0, 2.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ],
    tariff_profile=[
        0.11, 0.11, 0.11, 0.11, 0.11, 0.13,
        0.17, 0.21, 0.22, 0.19, 0.15, 0.12,
        0.12, 0.15, 0.20, 0.28, 0.39, 0.44,
        0.44, 0.38, 0.29, 0.19, 0.14, 0.11
    ],
    feed_in_tariff=[0.05] * 24
)

# Export all presets in a dictionary
SAMPLE_SCENARIOS = {
    "default": DEFAULT_SCENARIO,
    "summer_heatwave": SUMMER_HEATWAVE_SCENARIO,
    "high_solar": HIGH_SOLAR_SCENARIO,
}
