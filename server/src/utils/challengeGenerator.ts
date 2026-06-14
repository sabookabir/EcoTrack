import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '../config/supabase';
import logger from './logger';

// Pre-approved fallback templates pool (used if Gemini fails or is not configured)
const FALLBACK_TEMPLATES = [
  // Transit
  {
    title: 'Ride the Rails Week',
    description: 'Swap 3 car commutes for train rides to reduce transit congestion and vehicle emissions.',
    points: 150,
    duration_days: 7,
    category: 'transportation',
    type: 'weekly' as const
  },
  {
    title: 'Pedal Power Challenge',
    description: 'Use a bicycle for all trips under 5km for 3 consecutive days.',
    points: 180,
    duration_days: 3,
    category: 'transportation',
    type: 'personalized' as const
  },
  // Energy
  {
    title: 'Unplug Standby Appliances',
    description: 'Turn off power outlets for microwave, TV, and chargers overnight to avoid phantom power draws.',
    points: 100,
    duration_days: 5,
    category: 'energy',
    type: 'weekly' as const
  },
  {
    title: 'LED Retrofit Weekend',
    description: 'Commit to replacing at least 3 high-heat incandescent bulbs with high-efficiency LEDs.',
    points: 120,
    duration_days: 2,
    category: 'energy',
    type: 'personalized' as const
  },
  // Diet
  {
    title: 'Plant-Based Weekend',
    description: 'Avoid meat and dairy products completely for Saturday and Sunday to slash methane food miles.',
    points: 200,
    duration_days: 2,
    category: 'food',
    type: 'weekly' as const
  },
  {
    title: 'Meatless Mondays',
    description: 'Commit to a fully vegetarian or vegan food menu for 2 straight Mondays.',
    points: 150,
    duration_days: 8,
    category: 'food',
    type: 'personalized' as const
  },
  // Waste
  {
    title: 'Zero Single-Use Plastics',
    description: 'Carry a reusable bag, coffee cup, and straw. Refuse all plastic items for 5 days.',
    points: 180,
    duration_days: 5,
    category: 'waste',
    type: 'weekly' as const
  },
  {
    title: 'Food Compost Champion',
    description: 'Divert all organic kitchen food scraps to composting instead of garbage disposal bags for a week.',
    points: 160,
    duration_days: 7,
    category: 'waste',
    type: 'personalized' as const
  },
  // Seasonal Winter
  {
    title: 'Winter Thermostat Setback',
    description: 'Keep your indoor heater set to 18-20°C (64-68°F) and layer up to conserve home energy.',
    points: 120,
    duration_days: 7,
    category: 'energy',
    type: 'seasonal' as const,
    season: 'winter'
  },
  // Seasonal Summer
  {
    title: 'Eco Cooling A/C Offset',
    description: 'Set your air conditioner to 25°C (77°F) or higher and use fans to circulate cool air efficiently.',
    points: 120,
    duration_days: 7,
    category: 'energy',
    type: 'seasonal' as const,
    season: 'summer'
  },
  // Holidays
  {
    title: 'Earth Day Global Mission',
    description: 'Perform a local clean-up, plant seeds, and log zero emissions for a full 24-hour cycle.',
    points: 250,
    duration_days: 1,
    category: 'community',
    type: 'seasonal' as const,
    holiday: 'Earth Day'
  },
  {
    title: 'World Environment Day Cleanout',
    description: 'Collect paper, plastic, and electronic wastes for recycling or safe community disposal.',
    points: 220,
    duration_days: 1,
    category: 'community',
    type: 'seasonal' as const,
    holiday: 'Environment Day'
  }
];

export function getSeason(): 'winter' | 'summer' | 'spring' | 'autumn' {
  const month = new Date().getMonth(); // 0-11
  if (month === 11 || month === 0 || month === 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'autumn';
}

export function getHolidayEvent(): string | null {
  const date = new Date();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  if (month === 4 && day === 22) return 'Earth Day';
  if (month === 6 && day === 5) return 'Environment Day';
  if (month === 3 && day === 22) return 'World Water Day';
  if (month === 4 && day === 25) return 'Arbor Day';
  return null;
}

export async function generateDynamicChallenges(userId: string, collegeName = '') {
  try {
    const season = getSeason();
    const holiday = getHolidayEvent();
    const geminiKey = process.env.GEMINI_API_KEY;

    let challengesToPublish: Array<{
      title: string;
      description: string;
      points: number;
      duration_days: number;
      category: string;
      type: string;
    }> = [];

    // 1. Try AI Generation with Gemini
    if (geminiKey && geminiKey !== 'your-gemini-api-key' && geminiKey.trim() !== '') {
      try {
        logger.info(`Generating dynamic challenges via Gemini AI for user ${userId}...`);
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are EcoTrack AI, a carbon offset strategist. Generate exactly 3 fresh, creative sustainability challenges for a user with the following profile:
- Current Season: ${season}
- Active Holiday/Event: ${holiday || 'None'}
- College/Campus: ${collegeName || 'General Community'}

Requirements for each challenge:
1. Title: Creative, brief title (e.g. "Cool AC offset", "Pedal to ${collegeName || 'Campus'}").
2. Description: 1-2 sentences explaining what the user has to do.
3. Points: An integer score between 50 and 300 XP (higher points for harder challenges).
4. Duration: An integer duration between 1 and 7 days.
5. Category: One of: "transportation", "energy", "food", "waste", "community".
6. Type: One of: "weekly", "personalized", "community", "seasonal", "college".

Return ONLY a valid JSON array of objects with these exact keys: "title", "description", "points", "duration_days", "category", "type". Do not wrap in markdown or backticks, just raw json.
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        
        // Clean JSON formatting if Gemini wrapped it in markdown codeblocks
        const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        if (Array.isArray(parsed)) {
          challengesToPublish = parsed;
          logger.info(`Successfully generated ${challengesToPublish.length} challenges using Gemini AI.`);
        }
      } catch (aiError) {
        logger.error(`Gemini challenge generation failed: ${(aiError as Error).message}. Falling back to templates.`);
      }
    }

    // 2. Fallback to Templates if AI generation did not run or failed
    if (challengesToPublish.length === 0) {
      logger.info('Selecting challenges from pre-approved templates pool...');
      
      const pool = FALLBACK_TEMPLATES.filter(t => {
        if ('season' in t && t.season !== season) return false;
        if ('holiday' in t && t.holiday !== holiday) return false;
        return true;
      });

      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      challengesToPublish = shuffled.slice(0, 3).map(c => ({
        title: c.title,
        description: c.description,
        points: c.points,
        duration_days: c.duration_days,
        category: c.category,
        type: c.type
      }));
    }

    // 3. Customize college template labels
    if (collegeName) {
      challengesToPublish = challengesToPublish.map(c => {
        if (c.type === 'college' || c.title.toLowerCase().includes('campus')) {
          return {
            ...c,
            title: c.title.replace('Campus', collegeName),
            description: c.description.replace('campus', collegeName),
            college_name: collegeName
          };
        }
        return c;
      });
    }

    // 4. Validate and Publish each challenge to Supabase
    // Fetch all existing challenge titles to prevent duplicates
    const { data: existingChallenges } = await supabaseAdmin
      .from('challenges')
      .select('title');
      
    const existingTitles = new Set(existingChallenges?.map(c => c.title.toLowerCase().trim()) || []);

    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + 7); // Active for 7 days
    const expiryStr = expiry.toISOString().split('T')[0];

    for (const rawChallenge of challengesToPublish) {
      const title = rawChallenge.title.trim();
      if (existingTitles.has(title.toLowerCase())) {
        logger.info(`Skipping duplicate challenge generation for: "${title}"`);
        continue;
      }

      const points = Math.max(50, Math.min(300, Number(rawChallenge.points) || 100));
      const duration = Math.max(1, Math.min(14, Number(rawChallenge.duration_days) || 3));
      
      // Map category
      const normCat = rawChallenge.category?.toLowerCase() || 'community';
      let category = 'community';
      if (normCat.includes('trans')) category = 'transportation';
      else if (normCat.includes('energ')) category = 'energy';
      else if (normCat.includes('food')) category = 'food';
      else if (normCat.includes('waste')) category = 'waste';

      const description = `${rawChallenge.description.trim()} [Expires: ${expiryStr}]`;

      const challengeData = {
        title,
        description,
        points,
        duration_days: duration,
        category
      };

      const { error: insertErr } = await supabaseAdmin
        .from('challenges')
        .insert(challengeData);

      if (insertErr) {
        logger.error(`Error saving dynamic challenge "${title}": ${insertErr.message}`);
      } else {
        logger.info(`Published dynamic challenge: "${title}" (Expires: ${expiryStr})`);
      }
    }

    logger.info('Dynamic challenges check/publishing cycle completed.');
  } catch (err) {
    logger.error(`Failed during dynamic challenge generation cycle: ${(err as Error).message}`);
  }
}
