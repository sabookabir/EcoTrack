// Carbon emission factors (in kg CO2 equivalent)
export const EMISSION_FACTORS = {
  transportation: {
    car: 0.18,      // per km
    bike: 0.05,     // per km (motorcycle/scooter, walking/cycling is 0)
    bus: 0.08,      // per km per passenger
    train: 0.04,    // per km per passenger
    walking: 0.00,  // per km
  },
  electricity: 0.85, // per kWh
  food: {
    vegetarian: 1.5,     // per day
    mixed: 2.5,          // per day
    'non-vegetarian': 4.5 // per day
  },
  shopping: {
    low: 2.0,      // per day
    moderate: 5.0, // per day
    high: 10.0     // per day
  },
  waste: 1.2 // per kg
};

export interface CarbonEntryInput {
  transport_car?: number;
  transport_bike?: number;
  transport_bus?: number;
  transport_train?: number;
  transport_walking?: number;
  electricity_kwh?: number;
  food_habit: 'vegetarian' | 'mixed' | 'non-vegetarian';
  shopping_habits: 'low' | 'moderate' | 'high';
  waste_kg?: number;
}

export interface CalculationBreakdown {
  transport: number;
  electricity: number;
  food: number;
  shopping: number;
  waste: number;
  total: number;
}

/**
 * Calculates carbon emissions in kg CO2 based on user habits and usage.
 */
export function calculateCarbonEmissions(input: CarbonEntryInput): CalculationBreakdown {
  const car = Number(input.transport_car) || 0;
  const bike = Number(input.transport_bike) || 0;
  const bus = Number(input.transport_bus) || 0;
  const train = Number(input.transport_train) || 0;
  const walking = Number(input.transport_walking) || 0;
  const electricity = Number(input.electricity_kwh) || 0;
  const waste = Number(input.waste_kg) || 0;

  // Calculate transport emissions
  const transportCO2 =
    car * EMISSION_FACTORS.transportation.car +
    bike * EMISSION_FACTORS.transportation.bike +
    bus * EMISSION_FACTORS.transportation.bus +
    train * EMISSION_FACTORS.transportation.train +
    walking * EMISSION_FACTORS.transportation.walking;

  // Calculate electricity emissions
  const electricityCO2 = electricity * EMISSION_FACTORS.electricity;

  // Calculate food emissions
  const foodCO2 = EMISSION_FACTORS.food[input.food_habit] || 2.5;

  // Calculate shopping emissions
  const shoppingCO2 = EMISSION_FACTORS.shopping[input.shopping_habits] || 5.0;

  // Calculate waste emissions
  const wasteCO2 = waste * EMISSION_FACTORS.waste;

  const total = transportCO2 + electricityCO2 + foodCO2 + shoppingCO2 + wasteCO2;

  // Round values to 2 decimal places
  return {
    transport: Math.round(transportCO2 * 100) / 100,
    electricity: Math.round(electricityCO2 * 100) / 100,
    food: Math.round(foodCO2 * 100) / 100,
    shopping: Math.round(shoppingCO2 * 100) / 100,
    waste: Math.round(wasteCO2 * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
