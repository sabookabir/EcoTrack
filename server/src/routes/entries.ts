import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { calculateCarbonEmissions } from '../utils/carbonCalculator';
import logger from '../utils/logger';

const router = Router();

// GET all entries for current user
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    const { data: entries, error } = await supabaseAdmin
      .from('carbon_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: entries,
      message: 'Carbon entries fetched successfully',
    });
  } catch (err) {
    next(err);
  }
});

// POST or UPSERT a daily carbon entry
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const {
      entry_date,
      transport_car,
      transport_bike,
      transport_bus,
      transport_train,
      transport_walking,
      electricity_kwh,
      food_habit,
      shopping_habits,
      waste_kg,
    } = req.body;

    if (!entry_date || !food_habit || !shopping_habits) {
      return res.status(400).json({
        success: false,
        message: 'Entry date, food habit, and shopping habits are required fields',
      });
    }

    // 1. Calculate CO2 emissions
    const breakdown = calculateCarbonEmissions({
      transport_car,
      transport_bike,
      transport_bus,
      transport_train,
      transport_walking,
      electricity_kwh,
      food_habit,
      shopping_habits,
      waste_kg,
    });

    // 2. Perform DB upsert
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('carbon_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('entry_date', entry_date)
      .maybeSingle();

    if (checkError) throw checkError;

    const entryData = {
      user_id: userId,
      entry_date,
      transport_car: transport_car || 0,
      transport_bike: transport_bike || 0,
      transport_bus: transport_bus || 0,
      transport_train: transport_train || 0,
      transport_walking: transport_walking || 0,
      electricity_kwh: electricity_kwh || 0,
      food_habit,
      shopping_habits,
      waste_kg: waste_kg || 0,
      total_co2_kg: breakdown.total,
      updated_at: new Date().toISOString(),
    };

    let result;
    let isNew = false;

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('carbon_entries')
        .update(entryData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      isNew = true;
      const { data, error } = await supabaseAdmin
        .from('carbon_entries')
        .insert({
          ...entryData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Log in audit log
      await supabaseAdmin.from('audit_logs').insert({
        user_id: userId,
        action: 'log_carbon_entry',
        details: { entry_date, total_co2_kg: breakdown.total }
      });
    }

    // 3. Award points for logging the first entry of the day
    if (isNew) {
      const { data: userProfile, error: profileErr } = await supabaseAdmin
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      if (!profileErr && userProfile) {
        const newPoints = (userProfile.points || 0) + 15; // 15 XP for logging daily footprint
        await supabaseAdmin
          .from('users')
          .update({ points: newPoints })
          .eq('id', userId);

        // Check and unlock "Eco Beginner" achievement if it's the first log
        const { count, error: countErr } = await supabaseAdmin
          .from('carbon_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (!countErr && count === 1) {
          // Find the Eco Beginner achievement ID
          const { data: ach } = await supabaseAdmin
            .from('achievements')
            .select('id')
            .eq('name', 'Eco Beginner')
            .maybeSingle();

          if (ach) {
            await supabaseAdmin
              .from('user_achievements')
              .insert({
                user_id: userId,
                achievement_id: ach.id
              })
              .select()
              .maybeSingle();
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        entry: result,
        breakdown,
        pointsAwarded: isNew ? 15 : 0
      },
      message: isNew ? 'Daily carbon entry logged successfully!' : 'Daily carbon entry updated successfully!',
    });
  } catch (err) {
    next(err);
  }
});

// GET carbon entries analytics, forecasting and community comparisons
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    // Fetch user details (for college and city comparison)
    const { data: userProfile, error: profileErr } = await supabaseAdmin
      .from('users')
      .select('college_name, city')
      .eq('id', userId)
      .single();

    if (profileErr) throw profileErr;

    // Fetch all entries for user
    const { data: entries, error } = await supabaseAdmin
      .from('carbon_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: true });

    if (error) throw error;

    if (!entries || entries.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          empty: true,
          totalCO2: 0,
          avgCO2: 0,
          score: 100, // Carbon score
          breakdown: { transport: 0, electricity: 0, food: 0, shopping: 0, waste: 0 },
          trends: [],
          community: { collegeAvg: 0, cityAvg: 0, nationalAvg: 8.5 },
          forecast: []
        },
        message: 'No carbon logs yet.'
      });
    }

    // Calculations
    let totalCO2 = 0;
    let totalTransport = 0;
    let totalElectricity = 0;
    let totalFood = 0;
    let totalShopping = 0;
    let totalWaste = 0;

    const trends = entries.map(e => {
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

      totalCO2 += br.total;
      totalTransport += br.transport;
      totalElectricity += br.electricity;
      totalFood += br.food;
      totalShopping += br.shopping;
      totalWaste += br.waste;

      return {
        date: e.entry_date,
        total: br.total,
        transport: br.transport,
        electricity: br.electricity,
        food: br.food,
        shopping: br.shopping,
        waste: br.waste
      };
    });

    const entriesCount = entries.length;
    const avgCO2 = totalCO2 / entriesCount;

    // Calculate a standard Sustainability Score (0-100)
    // Formula: 100 - (Average Daily CO2 * 5), clamped between 0 and 100. (World average is ~11kg/day, target is <3kg/day)
    const score = Math.max(0, Math.min(100, Math.round(100 - (avgCO2 * 5))));

    // Community impact comparison
    // Setup some realistic averages if table averages are too low/nonexistent
    const nationalAvg = 8.5; // National avg per capita daily kg CO2
    let collegeAvg = 6.2;
    let cityAvg = 7.8;

    // Retrieve actual averages if records exist
    if (userProfile.college_name) {
      const { data: collegeUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('college_name', userProfile.college_name);

      if (collegeUsers && collegeUsers.length > 0) {
        const userIds = collegeUsers.map(u => u.id);
        const { data: colEntries } = await supabaseAdmin
          .from('carbon_entries')
          .select('total_co2_kg')
          .in('user_id', userIds);

        if (colEntries && colEntries.length > 0) {
          const colSum = colEntries.reduce((acc, curr) => acc + Number(curr.total_co2_kg), 0);
          collegeAvg = colSum / colEntries.length;
        }
      }
    }

    if (userProfile.city) {
      const { data: cityUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('city', userProfile.city);

      if (cityUsers && cityUsers.length > 0) {
        const userIds = cityUsers.map(u => u.id);
        const { data: citEntries } = await supabaseAdmin
          .from('carbon_entries')
          .select('total_co2_kg')
          .in('user_id', userIds);

        if (citEntries && citEntries.length > 0) {
          const citSum = citEntries.reduce((acc, curr) => acc + Number(curr.total_co2_kg), 0);
          cityAvg = citSum / citEntries.length;
        }
      }
    }

    // 4. Carbon Forecasting: Project next 5 days based on simple linear trend
    const forecast: { date: string; predicted: number }[] = [];
    if (entriesCount >= 2) {
      // Find slope of linear regression
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < entriesCount; i++) {
        sumX += i;
        sumY += trends[i].total;
        sumXY += i * trends[i].total;
        sumXX += i * i;
      }
      const slope = (entriesCount * sumXY - sumX * sumY) / (entriesCount * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / entriesCount;

      const lastDate = new Date(entries[entriesCount - 1].entry_date);
      for (let i = 1; i <= 5; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);
        const predictedVal = slope * (entriesCount - 1 + i) + intercept;
        forecast.push({
          date: nextDate.toISOString().split('T')[0],
          predicted: Math.max(0.5, Math.round(predictedVal * 100) / 100)
        });
      }
    } else {
      // Not enough data, forecast flat
      const lastDate = new Date(entries[0].entry_date);
      for (let i = 1; i <= 5; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);
        forecast.push({
          date: nextDate.toISOString().split('T')[0],
          predicted: Math.round(avgCO2 * 100) / 100
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        empty: false,
        totalCO2: Math.round(totalCO2 * 100) / 100,
        avgCO2: Math.round(avgCO2 * 100) / 100,
        score,
        breakdown: {
          transport: Math.round(totalTransport * 100) / 100,
          electricity: Math.round(totalElectricity * 100) / 100,
          food: Math.round(totalFood * 100) / 100,
          shopping: Math.round(totalShopping * 100) / 100,
          waste: Math.round(totalWaste * 100) / 100,
        },
        trends,
        community: {
          collegeAvg: Math.round(collegeAvg * 100) / 100,
          cityAvg: Math.round(cityAvg * 100) / 100,
          nationalAvg,
        },
        forecast
      },
      message: 'Carbon statistics computed successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
