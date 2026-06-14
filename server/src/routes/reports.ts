import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { generatePDFReport, generateCSVReport } from '../utils/reportGenerator';
import { calculateCarbonEmissions } from '../utils/carbonCalculator';
import logger from '../utils/logger';

const router = Router();

// GET list of reports generated
router.get('/list', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: reports,
      message: 'Reports metadata list fetched successfully',
    });
  } catch (err) {
    next(err);
  }
});

// GET export carbon entries as CSV file
router.get('/csv', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    // Fetch entries
    const { data: entries, error } = await supabaseAdmin
      .from('carbon_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    if (error) throw error;

    if (!entries || entries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No carbon entries available to export',
      });
    }

    const csvContent = generateCSVReport(entries);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ecotrack-carbon-history.csv"');
    
    // Log in audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'export_csv',
      details: { count: entries.length }
    });

    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

// GET generate and download PDF report
router.get('/pdf', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    // 1. Fetch user profile
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('full_name, email, points, college_name, city')
      .eq('id', userId)
      .single();

    if (userErr || !user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    // 2. Fetch all entries
    const { data: entries, error: entriesErr } = await supabaseAdmin
      .from('carbon_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: true });

    if (entriesErr) throw entriesErr;

    if (!entries || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one daily carbon entry before generating a PDF report.',
      });
    }

    // 3. Compute stats
    let totalCO2 = 0;
    let transport = 0;
    let electricity = 0;
    let food = 0;
    let shopping = 0;
    let waste = 0;

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

    const reportData = {
      user: {
        fullName: user.full_name || 'EcoTrack User',
        email: user.email,
        points: user.points || 0,
        collegeName: user.college_name || 'N/A',
        city: user.city || 'N/A',
      },
      stats: {
        totalCO2: Math.round(totalCO2 * 100) / 100,
        entriesCount: entries.length,
        avgCO2: Math.round((totalCO2 / entries.length) * 100) / 100,
        breakdown: {
          transport: Math.round(transport * 100) / 100,
          electricity: Math.round(electricity * 100) / 100,
          food: Math.round(food * 100) / 100,
          shopping: Math.round(shopping * 100) / 100,
          waste: Math.round(waste * 100) / 100,
        },
      },
      recommendations: [
        'Shift to active transit: cycle or walk for short trips (< 5 km) to target transport emissions.',
        'Conserve household electricity: utilize smart power strips and energy-saving lighting.',
        'Adopt a plant-focused diet: choose local produce and reduce red meat intake.',
        'Engage in weekly eco challenges to foster green habits and earn XP points.'
      ]
    };

    // Save metadata in DB reports table
    const { error: saveErr } = await supabaseAdmin
      .from('reports')
      .insert({
        user_id: userId,
        title: `Emissions Report - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
        emissions_data: reportData.stats,
        suggestions: reportData.recommendations,
      });

    if (saveErr) {
      logger.error(`Failed to save report metadata to database: ${saveErr.message}`);
    }

    // Log in audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'export_pdf',
      details: { total_co2: reportData.stats.totalCO2 }
    });

    // Stream PDF file to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ecotrack-carbon-report.pdf"');

    generatePDFReport(res, reportData);
  } catch (err) {
    next(err);
  }
});

export default router;
