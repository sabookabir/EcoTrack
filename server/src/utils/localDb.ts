import fs from 'fs';
import path from 'path';
import logger from './logger';

export interface UserStreaks {
  dailyStreak: number;
  weeklyStreak: number;
  challengeStreak: number;
  emissionStreak: number;
  communityStreak: number;
  lastDailyLog: string | null; // YYYY-MM-DD
  lastWeeklyLog: string | null; // YYYY-Www
  lastChallengeCompleted: string | null;
  lastEmissionSaved: number;
}

export interface Collectible {
  id: string;
  type: 'tree' | 'plant' | 'forest' | 'card' | 'trophy' | 'artifact';
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  unlockedAt: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  type: 'team' | 'college_group' | 'department' | 'eco_club';
  members: string[]; // user IDs
  points: number;
  collegeName: string;
  createdAt: string;
}

export interface DynamicChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  duration_days: number;
  category: string;
  type: 'weekly' | 'personalized' | 'community' | 'seasonal' | 'college';
  created_at: string;
  expires_at: string;
  college_name?: string;
  user_id?: string; // if personalized
}

interface LocalDbSchema {
  userStreaks: Record<string, UserStreaks>;
  userCollectibles: Record<string, Collectible[]>;
  teams: CommunityGroup[];
  dynamicChallenges: DynamicChallenge[];
}

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'ecotrack_enhanced.json');
const BACKUP_FILE = path.join(DATA_DIR, 'ecotrack_enhanced.bak.json');

const DEFAULT_STREAKS = (lastEmissionSaved = 0): UserStreaks => ({
  dailyStreak: 0,
  weeklyStreak: 0,
  challengeStreak: 0,
  emissionStreak: 0,
  communityStreak: 0,
  lastDailyLog: null,
  lastWeeklyLog: null,
  lastChallengeCompleted: null,
  lastEmissionSaved
});

class LocalDb {
  private data: LocalDbSchema = {
    userStreaks: {},
    userCollectibles: {},
    teams: [],
    dynamicChallenges: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        logger.info(`Created local database directory: ${DATA_DIR}`);
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = this.parseAndValidate(raw);
      } else {
        this.save();
      }
    } catch (err) {
      logger.error(`Failed to initialize local DB: ${(err as Error).message}. Attempting recovery from backup.`);
      this.recover();
    }
  }

  private parseAndValidate(raw: string): LocalDbSchema {
    try {
      const parsed = JSON.parse(raw);
      return {
        userStreaks: parsed.userStreaks || {},
        userCollectibles: parsed.userCollectibles || {},
        teams: Array.isArray(parsed.teams) ? parsed.teams : [],
        dynamicChallenges: Array.isArray(parsed.dynamicChallenges) ? parsed.dynamicChallenges : []
      };
    } catch (err) {
      logger.error(`JSON Parse error in local database. Resetting schema structure. Error: ${(err as Error).message}`);
      return {
        userStreaks: {},
        userCollectibles: {},
        teams: [],
        dynamicChallenges: []
      };
    }
  }

  private recover() {
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        logger.warn('Recovering local database from backup file...');
        const backupRaw = fs.readFileSync(BACKUP_FILE, 'utf-8');
        this.data = this.parseAndValidate(backupRaw);
        this.save();
      } else {
        logger.warn('No backup database found. Creating safe defaults.');
        this.data = {
          userStreaks: {},
          userCollectibles: {},
          teams: [],
          dynamicChallenges: []
        };
        this.save();
      }
    } catch (err) {
      logger.error(`Database recovery failed catastrophically: ${(err as Error).message}`);
    }
  }

  private save() {
    try {
      // 1. Create a backup of current database file if it exists
      if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, BACKUP_FILE);
      }

      // 2. Perform atomic write using temporary file to prevent write crashes
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      logger.error(`Failed to save local database changes: ${(err as Error).message}`);
    }
  }

  // --- STREAKS API ---
  public getStreaks(userId: string): UserStreaks {
    if (!this.data.userStreaks[userId]) {
      this.data.userStreaks[userId] = DEFAULT_STREAKS();
      this.save();
    }
    return this.data.userStreaks[userId];
  }

  public updateStreaks(userId: string, update: Partial<UserStreaks>): UserStreaks {
    const current = this.getStreaks(userId);
    this.data.userStreaks[userId] = { ...current, ...update };
    this.save();
    return this.data.userStreaks[userId];
  }

  // --- COLLECTIBLES API ---
  public getCollectibles(userId: string): Collectible[] {
    return this.data.userCollectibles[userId] || [];
  }

  public addCollectible(userId: string, item: Omit<Collectible, 'unlockedAt'>): Collectible[] {
    if (!this.data.userCollectibles[userId]) {
      this.data.userCollectibles[userId] = [];
    }

    // Check duplicate
    const exists = this.data.userCollectibles[userId].some(c => c.id === item.id);
    if (exists) return this.data.userCollectibles[userId];

    const newCollectible: Collectible = {
      ...item,
      unlockedAt: new Date().toISOString()
    };

    this.data.userCollectibles[userId].push(newCollectible);
    this.save();
    return this.data.userCollectibles[userId];
  }

  // --- TEAMS / COMMUNITIES API ---
  public getTeams(): CommunityGroup[] {
    return this.data.teams;
  }

  public getTeam(teamId: string): CommunityGroup | null {
    return this.data.teams.find(t => t.id === teamId) || null;
  }

  public createTeam(name: string, type: CommunityGroup['type'], collegeName: string, creatorId: string): CommunityGroup {
    const newTeam: CommunityGroup = {
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      members: [creatorId],
      points: 0,
      collegeName,
      createdAt: new Date().toISOString()
    };
    
    this.data.teams.push(newTeam);
    this.save();
    return newTeam;
  }

  public joinTeam(teamId: string, userId: string): CommunityGroup | null {
    const team = this.getTeam(teamId);
    if (!team) return null;
    
    if (team.members.includes(userId)) return team;
    
    // Remove user from other teams of the SAME type (optional constraint, let's keep simple: user can be on multiple teams)
    team.members.push(userId);
    this.save();
    return team;
  }

  public addTeamPoints(userId: string, pointsEarned: number) {
    // Add points to any team where this user is a member
    this.data.teams = this.data.teams.map(team => {
      if (team.members.includes(userId)) {
        return {
          ...team,
          points: (team.points || 0) + pointsEarned
        };
      }
      return team;
    });
    this.save();
  }

  // --- DYNAMIC CHALLENGES API ---
  public getDynamicChallenges(): DynamicChallenge[] {
    // Return non-expired challenges
    const now = new Date().toISOString();
    return this.data.dynamicChallenges.filter(c => c.expires_at > now);
  }

  public addDynamicChallenge(chal: DynamicChallenge) {
    // Check duplicates by title
    const exists = this.data.dynamicChallenges.some(c => c.title.toLowerCase() === chal.title.toLowerCase());
    if (exists) return;

    this.data.dynamicChallenges.push(chal);
    this.save();
  }

  public archiveExpiredChallenges() {
    const now = new Date().toISOString();
    // Exclude expired ones from primary array, archiving can just keep them or write to another list. Let's just filter out old ones to save memory.
    const beforeCount = this.data.dynamicChallenges.length;
    this.data.dynamicChallenges = this.data.dynamicChallenges.filter(c => c.expires_at > now);
    if (this.data.dynamicChallenges.length !== beforeCount) {
      this.save();
      logger.info(`Archived ${beforeCount - this.data.dynamicChallenges.length} expired dynamic challenges.`);
    }
  }
}

export const localDb = new LocalDb();
