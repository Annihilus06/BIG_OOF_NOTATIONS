"""
Realistic 24-hour Energy Profile Presets with BDT (৳) Currency and 40kWh BESS
"""
from models import ScenarioData

# 1. Standard Benchmark Scenario (Commercial Office with 40kWh Battery & Solar in BDT)
DEFAULT_SCENARIO = ScenarioData(
    name="Commercial Office & Solar (Benchmark)",
    description="24-hour commercial facility with rooftop 35kW solar and 40kWh Battery ESS with Time-of-Use tariff in BDT (৳).",
    battery_capacity_kwh=40.0,
    max_charge_kw=10.0,
    max_discharge_kw=10.0,
    initial_soc_kwh=20.0,
    final_soc_target_kwh=20.0,
    battery_efficiency=0.95,
    min_soc_pct=0.15,
    max_soc_pct=0.95,
    degradation_cost_bdt_per_kwh=0.25,
    # Hourly demand profile (kWh)
    load_profile=[
        4.2, 3.8, 3.5, 3.5, 4.0, 6.5,
        12.0, 18.5, 22.0, 24.5, 25.0, 25.5,
        24.8, 25.0, 24.0, 22.5, 20.0, 16.5,
        13.0, 10.5, 8.5, 6.8, 5.5, 4.5
    ],
    # Solar generation profile (kWh)
    solar_profile=[
        0.0, 0.0, 0.0, 0.0, 0.0, 0.5,
        2.5, 8.0, 16.0, 24.0, 29.0, 31.5,
        30.0, 26.5, 21.0, 13.5, 5.8, 1.5,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ],
    # Time-of-Use Grid Purchase Tariff in BDT (৳/kWh)
    tariff_profile=[
        10.50, 10.50, 10.50, 10.50, 10.50, 12.00,
        15.50, 18.00, 19.50, 18.00, 15.00, 13.50,
        13.50, 15.00, 18.50, 22.00, 28.50, 32.00,
        32.00, 29.50, 24.00, 16.00, 12.50, 10.50
    ],
    # Feed-in Tariff (৳/kWh)
    feed_in_tariff=[
        5.00, 5.00, 5.00, 5.00, 5.00, 5.00,
        6.00, 6.00, 7.00, 7.00, 6.00, 6.00,
        6.00, 6.00, 7.00, 8.00, 10.00, 12.00,
        12.00, 10.00, 8.00, 6.00, 5.00, 5.00
    ]
)

# 2. Summer Heatwave Peak Scenario
SUMMER_HEATWAVE_SCENARIO = ScenarioData(
    name="Summer Heatwave & AC Spikes",
    description="High evening air-conditioning demand with aggressive peak pricing in BDT between 4 PM and 9 PM (৳38.50/kWh).",
    battery_capacity_kwh=40.0,
    max_charge_kw=10.0,
    max_discharge_kw=10.0,
    initial_soc_kwh=20.0,
    final_soc_target_kwh=20.0,
    battery_efficiency=0.95,
    min_soc_pct=0.15,
    max_soc_pct=0.95,
    degradation_cost_bdt_per_kwh=0.30,
    load_profile=[
        5.5, 5.0, 4.8, 4.8, 5.2, 7.5,
        14.0, 20.5, 25.0, 28.0, 30.5, 32.0,
        32.2, 33.0, 32.5, 31.8, 34.0, 35.5,
        33.0, 28.0, 22.5, 16.0, 11.5, 8.0
    ],
    solar_profile=[
        0.0, 0.0, 0.0, 0.0, 0.0, 0.8,
        4.0, 11.0, 20.0, 28.0, 34.0, 36.0,
        35.5, 31.0, 25.0, 16.0, 7.5, 2.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ],
    tariff_profile=[
        12.00, 12.00, 12.00, 12.00, 12.00, 14.00,
        18.00, 22.00, 24.00, 22.00, 18.00, 16.00,
        16.00, 20.00, 25.00, 32.00, 38.50, 42.00,
        42.00, 38.00, 30.00, 20.00, 15.00, 12.00
    ],
    feed_in_tariff=[6.00] * 24
)

# 3. High Solar Farm & EV Fleet
HIGH_SOLAR_SCENARIO = ScenarioData(
    name="High Solar Farm & EV Fleet",
    description="Large 45kW solar array with fleet EV charging window during peak afternoon generation.",
    battery_capacity_kwh=40.0,
    max_charge_kw=10.0,
    max_discharge_kw=10.0,
    initial_soc_kwh=20.0,
    final_soc_target_kwh=20.0,
    battery_efficiency=0.96,
    min_soc_pct=0.15,
    max_soc_pct=0.98,
    degradation_cost_bdt_per_kwh=0.20,
    load_profile=[
        3.5, 3.2, 3.0, 3.0, 3.5, 5.0,
        8.5, 14.0, 26.0, 28.0, 29.0, 30.0,
        28.0, 26.0, 22.0, 17.0, 12.0, 9.0,
        7.5, 6.5, 5.5, 4.5, 4.0, 3.5
    ],
    solar_profile=[
        0.0, 0.0, 0.0, 0.0, 0.0, 1.2,
        5.5, 15.0, 28.0, 38.0, 45.0, 48.0,
        46.0, 40.0, 30.0, 18.0, 8.0, 2.5,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ],
    tariff_profile=[
        11.00, 11.00, 11.00, 11.00, 11.00, 13.00,
        16.00, 20.00, 21.00, 18.00, 14.00, 12.00,
        12.00, 14.00, 19.00, 26.00, 35.00, 39.00,
        39.00, 34.00, 26.00, 17.00, 13.00, 11.00
    ],
    feed_in_tariff=[5.50] * 24
)

SAMPLE_SCENARIOS = {
    "default": DEFAULT_SCENARIO,
    "summer_heatwave": SUMMER_HEATWAVE_SCENARIO,
    "high_solar": HIGH_SOLAR_SCENARIO,
}