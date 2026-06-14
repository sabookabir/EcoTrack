import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateCarbonEmissions } from '../utils/carbonCalculator';
import logger from '../utils/logger';

const router = Router();

// POST /api/ai/recommendations
router.post('/recommendations', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { question } = req.body;

    const userQuestion = question || 'How can I reduce my carbon footprint?';

    // 1. Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // 2. Fetch user's carbon entries to construct context
    const { data: entries, error: entriesError } = await supabaseAdmin
      .from('carbon_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(14); // Analyze last 2 weeks

    let totalCO2 = 0;
    let transport = 0;
    let electricity = 0;
    let food = 0;
    let shopping = 0;
    let waste = 0;

    let foodHabit = 'mixed';
    let shoppingHabit = 'moderate';

    if (entries && entries.length > 0) {
      entries.forEach((e) => {
        const br = calculateCarbonEmissions({
          transport_car: e.transport_car,
          transport_bike: e.transport_bike,
          transport_bus: e.transport_bus,
          transport_train: e.transport_train,
          transport_walking: e.transport_walking,
          electricity_kwh: e.electricity_kwh,
          food_habit: e.food_habit,
          shopping_habits: e.shopping_habits,
          waste_kg: e.waste_kg,
        });

        totalCO2 += br.total;
        transport += br.transport;
        electricity += br.electricity;
        food += br.food;
        shopping += br.shopping;
        waste += br.waste;
      });

      // Take habits of the latest entry
      foodHabit = entries[0].food_habit;
      shoppingHabit = entries[0].shopping_habits;
    }

    const count = entries?.length || 1;
    const stats = {
      avgDailyCO2: totalCO2 / count,
      breakdown: {
        transport: transport / count,
        electricity: electricity / count,
        food: food / count,
        shopping: shopping / count,
        waste: waste / count,
      },
      foodHabit,
      shoppingHabit,
    };

    // 3. AI response or fallback
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey !== 'your-gemini-api-key' && geminiKey.trim() !== '') {
      try {
        logger.info('Generating recommendations using Gemini Generative AI...');
        const genAI = new GoogleGenerativeAI(geminiKey);
        // Using gemini-1.5-flash as it is fast and efficient
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are EcoTrack AI, an advanced sustainability advisor and carbon footprint strategist.
Analyze the following carbon footprint profile of user "${profile?.full_name || 'User'}":
- Average Daily Emissions: ${stats.avgDailyCO2.toFixed(2)} kg CO2e
- Category Breakdown (Average per day):
  * Transportation: ${stats.breakdown.transport.toFixed(2)} kg CO2e
  * Electricity: ${stats.breakdown.electricity.toFixed(2)} kg CO2e
  * Food Habits: ${stats.breakdown.food.toFixed(2)} kg CO2e (Habit: ${stats.foodHabit})
  * Shopping Habits: ${stats.breakdown.shopping.toFixed(2)} kg CO2e (Habit: ${stats.shoppingHabit})
  * Waste Generation: ${stats.breakdown.waste.toFixed(2)} kg CO2e
- User points: ${profile?.points || 0} XP

The user asks: "${userQuestion}"

Please provide a highly personalized, practical, and action-oriented response. Include:
1. A brief assessment of their current footprint compared to the target sustainable average (approx 3.0 kg/day).
2. Three specific, actionable suggestions based on their highest emission categories.
3. For each suggestion, estimate the CO2 reduction potential (in kg/month).
Format the output nicely using Markdown. Keep the tone encouraging, professional, and clear.
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return res.status(200).json({
          success: true,
          data: {
            response: text,
            isMocked: false,
          },
          message: 'AI recommendations generated successfully',
        });
      } catch (aiError) {
        logger.error(`Gemini API failed: ${(aiError as Error).message}. Falling back to rules-based recommender.`);
      }
    }

    // FALLBACK ENGINE (Mock Recommender)
    logger.info('Generating local rules-based recommendations...');
    const highestCategory = Object.entries(stats.breakdown).reduce(
      (max, [cat, val]) => (val > max.val ? { cat, val } : max),
      { cat: 'none', val: -1 }
    );

    let advice = '';
    const name = profile?.full_name || 'EcoTrack User';

    if (highestCategory.cat === 'transport') {
      advice = `Your transportation emissions average **${stats.breakdown.transport.toFixed(1)} kg CO2/day**, making it your largest footprint source.
      
### Actionable Steps for you, ${name}:
1. **Switch to Public Transport / Carpooling**: Choosing the bus or train 3 days a week instead of driving can save roughly **65 kg CO2/month**.
2. **Active Commuting**: For distances under 3km, try walking or cycling. It is zero-emission and improves cardiovascular health! Savings: **15 kg CO2/month**.
3. **Eco-Driving Habits**: Accelerate smoothly, maintain proper tire inflation, and avoid idling. This improves fuel economy by up to 15%. Savings: **10 kg CO2/month**.`;
    } else if (highestCategory.cat === 'electricity') {
      advice = `Your home electricity usage accounts for **${stats.breakdown.electricity.toFixed(1)} kg CO2/day**, which is your highest category.
      
### Actionable Steps for you, ${name}:
1. **Unplug Phantom Loads**: Smart power strips prevent standby power leakage from TVs, monitors, and chargers. Savings: **12 kg CO2/month**.
2. **LED Lighting Retrofit**: Replace your older incandescent bulbs with smart LEDs, which use 80% less energy. Savings: **18 kg CO2/month**.
3. **Thermostat Adjustment**: Adjust your cooling/heating setting by just 1-2 degrees. Setting it slightly closer to outside temperatures saves significant power. Savings: **25 kg CO2/month**.`;
    } else if (highestCategory.cat === 'food') {
      advice = `Your diet contributes **${stats.breakdown.food.toFixed(1)} kg CO2/day**. As a user with **${stats.foodHabit}** habits, food is a primary driver.
      
### Actionable Steps for you, ${name}:
1. **Meatless Days**: Switch to vegetarian meals 3 days a week. Red meat accounts for 10x the emissions of poultry and grains. Savings: **45 kg CO2/month**.
2. **Reduce Food Waste**: Shop with a list, plan meals, and compost organic scraps. Rotting food in landfills emits potent methane gas. Savings: **15 kg CO2/month**.
3. **Eat Local & Seasonal**: Buying from local farmer markets reduces the "food miles" and transport emissions. Savings: **8 kg CO2/month**.`;
    } else if (highestCategory.cat === 'shopping') {
      advice = `Your consumer goods consumption accounts for **${stats.breakdown.shopping.toFixed(1)} kg CO2/day**, which is your highest footprint source.
      
### Actionable Steps for you, ${name}:
1. **Buy Pre-owned & Repurpose**: Investigate thrift shops, online resale markets, or local swaps before buying new electronics or clothing. Savings: **35 kg CO2/month**.
2. **Reject Single-Use Packaging**: Opt for zero-waste shops, bring custom reusable bags, and buy bulk dry-goods. Savings: **12 kg CO2/month**.
3. **Consumable Mindset Shift**: Follow the "30-day rule" before making non-essential purchases to reduce impulsive consumerism. Savings: **25 kg CO2/month**.`;
    } else {
      advice = `Your waste generation accounts for **${stats.breakdown.waste.toFixed(1)} kg CO2/day**, which is your highest footprint source.
      
### Actionable Steps for you, ${name}:
1. **Composting**: Diverting food scrap waste to a home compost pile avoids landfill methane emissions. Savings: **20 kg CO2/month**.
2. **Rigorous Recycling**: Recycle cardboards, metals, plastics, and glass correctly to conserve raw manufacturing energy. Savings: **12 kg CO2/month**.
3. **Upcycling & Repairs**: Fix broken household items, patch worn clothing, and repurpose old jars to extend product life cycles. Savings: **10 kg CO2/month**.`;
    }

    const fullResponse = `
Hello **${name}**,

Based on your recent 2-week history, your average daily footprint is **${stats.avgDailyCO2.toFixed(1)} kg CO2e**. The recommended sustainability target is **3.0 kg CO2e/day** or less, meaning there are great opportunities for carbon reduction!

${advice}

Keep up the work! Joining Eco Challenges on the platform will reward you with XP points and guide your journey to unlocking sustainability badges.
`;

    res.status(200).json({
      success: true,
      data: {
        response: fullResponse.trim(),
        isMocked: true,
      },
      message: 'Local recommendations computed successfully (fallback mode)',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/forecast - Carbon forecasting, scenarios and anomaly detection
router.get('/forecast', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    // 1. Fetch user entries
    const { data: entries, error } = await supabaseAdmin
      .from('carbon_entries')
      .select('*')
      .order('entry_date', { ascending: true });

    if (error) throw error;

    if (!entries || entries.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          hasData: false,
          projections: { statusQuoMonth: 0, statusQuoYear: 0, sustainableMonth: 0, sustainableYear: 0 },
          anomalies: [],
          actionPlan: ["Please log carbon footprint entries to generate personalized AI forecasts."],
          recommendedChallenges: []
        }
      });
    }

    const count = entries.length;
    const totals = entries.map(e => Number(e.total_co2_kg));
    const avgDaily = totals.reduce((sum, val) => sum + val, 0) / count;

    // Averages per category
    let totalTransport = 0, totalElectricity = 0, totalFood = 0, totalShopping = 0, totalWaste = 0;
    entries.forEach(e => {
      const br = calculateCarbonEmissions({
        transport_car: e.transport_car,
        transport_bike: e.transport_bike,
        transport_bus: e.transport_bus,
        transport_train: e.transport_train,
        transport_walking: e.transport_walking,
        electricity_kwh: e.electricity_kwh,
        food_habit: e.food_habit,
        shopping_habits: e.shopping_habits,
        waste_kg: e.waste_kg
      });
      totalTransport += br.transport;
      totalElectricity += br.electricity;
      totalFood += br.food;
      totalShopping += br.shopping;
      totalWaste += br.waste;
    });

    const categoryAverages = {
      transport: totalTransport / count,
      electricity: totalElectricity / count,
      food: totalFood / count,
      shopping: totalShopping / count,
      waste: totalWaste / count
    };

    // Scenarios data points (Status Quo vs Sustainable path)
    const statusQuoMonth = avgDaily * 30.4;
    const statusQuoYear = avgDaily * 365.25;
    
    // Target sustainable reduction path (-35%)
    const sustainableMonth = statusQuoMonth * 0.65;
    const sustainableYear = statusQuoYear * 0.65;

    // 2. Anomaly Detection
    const anomalies: Array<{ date: string; message: string; severity: 'warning' | 'info' }> = [];
    if (count >= 3) {
      const rollingAvg = totals.slice(-4, -1).reduce((s, v) => s + v, 0) / Math.min(3, count - 1);
      const latestVal = totals[count - 1];

      if (latestVal > rollingAvg * 2.0) {
        anomalies.push({
          date: entries[count - 1].entry_date,
          message: `Emissions spike detected! Daily carbon footprint was ${(latestVal / (rollingAvg || 1)).toFixed(1)}x higher than your recent rolling average.`,
          severity: 'warning'
        });
      }
    }

    // 3. Recommended Challenges mapping based on highest categories
    const highestCategory = Object.entries(categoryAverages).reduce(
      (max, [cat, val]) => (val > max.val ? { cat, val } : max),
      { cat: 'none', val: -1 }
    );

    const recommendedChallenges: string[] = [];
    if (highestCategory.cat === 'transport') {
      recommendedChallenges.push('Pedal Power Challenge', 'Ride the Rails Week');
    } else if (highestCategory.cat === 'electricity') {
      recommendedChallenges.push('Unplug Standby Appliances', 'Summer AC Offset');
    } else if (highestCategory.cat === 'food') {
      recommendedChallenges.push('Plant-Based Weekend', 'Meatless Mondays');
    } else if (highestCategory.cat === 'waste') {
      recommendedChallenges.push('Food Compost Champion', 'Zero Single-Use Plastics');
    } else {
      recommendedChallenges.push('Earth Day Global Mission');
    }

    // 4. Generate Action Plan & Insights text (Gemini call or fallback)
    const geminiKey = process.env.GEMINI_API_KEY;
    let actionPlan: string[] = [];
    let scenarioText = '';

    if (geminiKey && geminiKey !== 'your-gemini-api-key' && geminiKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Analyze this carbon profile:
- Daily Average: ${avgDaily.toFixed(2)} kg CO2e
- Highest Category: ${highestCategory.cat} (${highestCategory.val.toFixed(2)} kg CO2e)
- Current anomalies: ${anomalies.map(a => a.message).join('; ') || 'None'}

Provide exactly 3 bullet points for a Weekly Action Plan to help them transition to a sustainable path. Return ONLY a JSON string array of 3 actionable elements (e.g. ["Walk to campus on short trips", "Unplug items overnight", "Switch to local meals"]). Do not output markdown, just the raw JSON array string.
`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text().trim().replace(/^```json/, '').replace(/```$/, '').trim());
        if (Array.isArray(parsed)) {
          actionPlan = parsed;
        }
      } catch (err) {
        logger.error(`AI forecast insights generator failed: ${(err as Error).message}`);
      }
    }

    // Fallbacks
    if (actionPlan.length === 0) {
      if (highestCategory.cat === 'transport') {
        actionPlan = [
          'Choose carpooling or public transit to cut transportation costs and fuel by 30%.',
          'Use walking or cycling for small local trips under 3km.',
          'Adopt smooth braking and avoid engine idling during traffic stoplights.'
        ];
      } else if (highestCategory.cat === 'electricity') {
        actionPlan = [
          'Unplug phantom energy draws (chargers, microwaves, screens) when sleeping.',
          'Switch old lighting to LED fixtures which consume 80% less power.',
          'Set home temperatures 1-2 degrees closer to ambient outside air.'
        ];
      } else {
        actionPlan = [
          'Try implementing Meatless Mondays to slash diet methane intensity.',
          'Buy groceries locally to cut logistics transportation miles.',
          'Rigourously compost organic wastes to avoid landfill emissions.'
        ];
      }
    }

    scenarioText = avgDaily > 3.0 
      ? `If you follow your current Status Quo path, your yearly footprint will reach ${Math.round(statusQuoYear)} kg CO₂e. Transitioning to the Sustainable Action path will save roughly ${Math.round(statusQuoYear - sustainableYear)} kg CO₂e and support climate goals.`
      : `Outstanding! Your current average daily footprint meets the global sustainable baseline. Keeping this trend will save over ${Math.round(statusQuoYear - sustainableYear)} kg CO₂e compared to high-intensity benchmarks.`;

    res.status(200).json({
      success: true,
      data: {
        hasData: true,
        projections: {
          statusQuoMonth: Math.round(statusQuoMonth * 100) / 100,
          statusQuoYear: Math.round(statusQuoYear * 100) / 100,
          sustainableMonth: Math.round(sustainableMonth * 100) / 100,
          sustainableYear: Math.round(sustainableYear * 100) / 100
        },
        anomalies,
        actionPlan,
        recommendedChallenges,
        scenarioText
      },
      message: 'AI carbon forecast compiled successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
