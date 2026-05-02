// Raw shape returned by a single NHL leaders category fetch
export interface NHLLeaderPlayer {
  id: number;
  firstName: { default: string };
  lastName: { default: string };
  headshot: string;
  teamAbbrev: string;
  teamName: { default: string };
  teamLogo: string;
  position: string;
  value: number; // the only stat field — varies by category
}

// What /api/skaters returns after server-side merge of all categories
export interface NormalizedSkater {
  id: number;
  firstName: { default: string };
  lastName: { default: string };
  headshot: string;
  teamAbbrev: string;
  teamName: { default: string };
  teamLogo: string;
  position: string;
  pts: number;
  g: number;
  a: number;
  plusMinus: number;
  pim: number;
  toiSeconds: number; // avg TOI/G in seconds — format to mm:ss for display
}

export interface NormalizedSkatersResponse {
  skaters: NormalizedSkater[];
}

// What /api/goalies returns after server-side merge
export interface NormalizedGoalie {
  id: number;
  firstName: { default: string };
  lastName: { default: string };
  headshot: string;
  teamAbbrev: string;
  teamName: { default: string };
  teamLogo: string;
  w: number;
  savePctg: number;
  gaa: number;
  shutouts: number;
}

export interface NormalizedGoaliesResponse {
  goalies: NormalizedGoalie[];
}

// Standings — actual field names from /v1/standings/now
export interface TeamRecord {
  teamName: { default: string; fr?: string };
  teamAbbrev: { default: string };
  teamLogo: string;
  teamCommonName: { default: string };
  conferenceName: string;
  divisionName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  goalFor: number;
  goalAgainst: number;
  goalDifferential: number;
  regulationPlusOtWins: number;
  streakCode: string;
  streakCount: number;
  placeName: { default: string };
  winPctg: number;
  l10Wins: number;
  l10Losses: number;
  l10OtLosses: number;
}

export interface StandingsResponse {
  standings: TeamRecord[];
}

// Player game log — /v1/player/{id}/game-log/{season}/{gameType}
export interface GameLogEntry {
  gameId: number;
  gameDate: string;
  teamAbbrev: string;
  opponentAbbrev: string;
  homeRoadFlag: 'H' | 'R';
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots: number;
  toi: string; // already formatted "mm:ss"
  pim: number;
}

export interface GameLogResponse {
  gameLog: GameLogEntry[];
}

// What /api/team/[abbrev]/schedule returns
export interface TeamScheduleGame {
  gameId: number;
  gameDate: string;
  homeOrAway: 'H' | 'A';
  oppAbbrev: string;
  oppLogo: string;
  gf: number;
  ga: number;
  result: string; // 'W' | 'W/OT' | 'L' | 'OT' | 'SO'
}

export interface TeamScheduleResponse {
  games: TeamScheduleGame[];
}

// Search result union types (used by GlobalSearch)
export interface PlayerSearchResult {
  type: 'player';
  id: number;
  name: string;
  teamAbbrev: string;
  headshot: string;
  pts: number;
}

export interface TeamSearchResult {
  type: 'team';
  abbrev: string;
  name: string;
  logo: string;
  pts: number;
}

export type SearchResult = PlayerSearchResult | TeamSearchResult;

export type Season = '20242025' | '20232024' | '20222023';
export type GameType = '2' | '3';
