import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface ReportData {
  user: {
    fullName: string;
    email: string;
    points: number;
    collegeName: string;
    city: string;
  };
  stats: {
    totalCO2: number;
    entriesCount: number;
    avgCO2: number;
    breakdown: {
      transport: number;
      electricity: number;
      food: number;
      shopping: number;
      waste: number;
    };
  };
  recommendations: string[];
}

/**
 * Generates a styled PDF report and streams it to the HTTP response.
 */
export function generatePDFReport(res: Response, data: ReportData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Stream PDF directly to Express response
  doc.pipe(res);

  // Styling Constants
  const primaryColor = '#059669'; // Emerald
  const textColor = '#1f2937';    // Zinc 800
  const lightTextColor = '#6b7280'; // Zinc 500
  const borderLight = '#e5e7eb';  // Zinc 200

  // 1. Header / Header Bar
  doc
    .fillColor(primaryColor)
    .rect(0, 0, 595.28, 15) // Top accent bar
    .fill();

  // Reset Fill Color
  doc.fillColor(textColor);

  // Logo & Platform Name
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('EcoTrack AI', 50, 45)
    .fontSize(10)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text('Carbon Footprint Awareness & Reduction Platform', 50, 75);

  // Date info
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text(`Report Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 400, 45, { align: 'right' });

  // Divider Line
  doc
    .moveTo(50, 95)
    .lineTo(545, 95)
    .strokeColor(borderLight)
    .stroke();

  // 2. User Information Section
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(textColor)
    .text('User Profile', 50, 115);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Name: ${data.user.fullName || 'Eco Track User'}`, 50, 140)
    .text(`Email: ${data.user.email}`, 50, 155)
    .text(`Eco Points: ${data.user.points} XP`, 50, 170)
    .text(`College: ${data.user.collegeName || 'N/A'}`, 300, 140)
    .text(`Location: ${data.user.city || 'N/A'}`, 300, 155);

  // Divider Line
  doc
    .moveTo(50, 195)
    .lineTo(545, 195)
    .strokeColor(borderLight)
    .stroke();

  // 3. Carbon Emissions Summary
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Emissions Overview', 50, 215);

  // Draw two metrics cards
  // Card 1: Total Tracking
  doc
    .rect(50, 240, 235, 75)
    .fillColor('#f9fafb')
    .fill()
    .strokeColor(borderLight)
    .stroke()
    .fillColor(textColor);

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text('TOTAL CO2 EMISSIONS', 65, 255)
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text(`${data.stats.totalCO2.toFixed(1)} kg`, 65, 275);

  // Card 2: Average Tracking
  doc
    .rect(310, 240, 235, 75)
    .fillColor('#f9fafb')
    .fill()
    .strokeColor(borderLight)
    .stroke()
    .fillColor(textColor);

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text('AVERAGE DAILY CO2', 325, 255)
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#2563eb') // Blue accent
    .text(`${data.stats.avgCO2.toFixed(1)} kg/day`, 325, 275);

  // 4. Category Breakdown
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(textColor)
    .text('Emissions Breakdown by Category', 50, 345);

  const breakdown = data.stats.breakdown;
  const categories = [
    { label: 'Transportation', value: breakdown.transport, color: '#3b82f6' },
    { label: 'Electricity Usage', value: breakdown.electricity, color: '#f59e0b' },
    { label: 'Food Habits', value: breakdown.food, color: '#10b981' },
    { label: 'Shopping Habits', value: breakdown.shopping, color: '#8b5cf6' },
    { label: 'Waste Generation', value: breakdown.waste, color: '#ef4444' },
  ];

  let startY = 380;
  categories.forEach((cat) => {
    // Label
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text(cat.label, 50, startY)
      .font('Helvetica')
      .fillColor(lightTextColor)
      .text(`${cat.value.toFixed(1)} kg CO2`, 200, startY);

    // Progress Bar Background
    doc
      .rect(300, startY, 200, 10)
      .fillColor('#e5e7eb')
      .fill();

    // Progress Bar Fill
    const pct = data.stats.totalCO2 > 0 ? (cat.value / data.stats.totalCO2) * 200 : 0;
    if (pct > 0) {
      doc
        .rect(300, startY, Math.min(pct, 200), 10)
        .fillColor(cat.color)
        .fill();
    }

    startY += 25;
  });

  // Divider Line
  doc
    .moveTo(50, 520)
    .lineTo(545, 520)
    .strokeColor(borderLight)
    .stroke();

  // 5. Reduction Recommendations
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(textColor)
    .text('AI-Generated Actions for Carbon Reduction', 50, 540);

  let recY = 570;
  const recommendations = data.recommendations && data.recommendations.length > 0
    ? data.recommendations
    : [
        'Shift to active transit: cycle or walk for short trips (< 5 km).',
        'Conserve household electricity: utilize smart power strips and energy-saving lighting.',
        'Adopt a plant-focused diet: choose local produce and reduce meat intake.',
        'Engage in weekly challenges to earn points and foster green habits.'
      ];

  recommendations.slice(0, 4).forEach((rec, idx) => {
    // Bullet mark
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text(`${idx + 1}.`, 50, recY)
      .font('Helvetica')
      .fillColor(textColor)
      .text(rec, 75, recY, { width: 470 });

    recY += doc.heightOfString(rec, { width: 470 }) + 10;
  });

  // 6. Footer
  doc
    .fontSize(8)
    .fillColor(lightTextColor)
    .text('EcoTrack AI Carbon Calculator Report — Page 1 of 1', 50, 780, { align: 'center' });

  // Finalize Document
  doc.end();
}

/**
 * Formats carbon entries as a CSV string.
 */
export function generateCSVReport(entries: any[]): string {
  const headers = [
    'Date',
    'Car (km)',
    'Bike (km)',
    'Bus (km)',
    'Train (km)',
    'Walking (km)',
    'Electricity (kWh)',
    'Food Habit',
    'Shopping Habits',
    'Waste (kg)',
    'Total CO2 (kg)'
  ];

  const csvRows = [headers.join(',')];

  for (const entry of entries) {
    const values = [
      entry.entry_date,
      entry.transport_car,
      entry.transport_bike,
      entry.transport_bus,
      entry.transport_train,
      entry.transport_walking,
      entry.electricity_kwh,
      `"${entry.food_habit}"`,
      `"${entry.shopping_habits}"`,
      entry.waste_kg,
      entry.total_co2_kg
    ];
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
