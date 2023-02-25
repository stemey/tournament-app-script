import { MatchResult } from "./MatchResult";
import { Result } from "./Result";

export type Tuple = number[];

export interface Stats {
  setpoints: Tuple;
  sets: Tuple;
  matches: Tuple;
  ranking: number;
}

export interface PlayerStats {
  stats: Stats;
  player: string;
}

export class GroupResult {
  private declare resultMap: { [player: string]: Result[] };
  private declare matches: { [key: string]: MatchResult };
  private declare playerStats: PlayerStats[];
  constructor(private readonly players: string[]) {
    this.players = players;
    this.matches = {};
    this.resultMap = {};
  }

  addMatch(player1, player2, result) {
    const key = [player1, player2].sort().join("-");
    const existingMatch = this.matches[key];
    if (existingMatch) {
      // Logger.log("ignoring previous result " + key);
    }
    this.matches[key] = { player1, player2, result };
  }

  get allMatches() {
    return Object.values(this.matches);
  }

  private addResult(player: string, result: Result) {
    if (!this.resultMap[player]) {
      this.resultMap[player] = [];
    }
    this.resultMap[player].push(result);
  }

  public init() {
    Object.values(this.matches).forEach((m) => {
      this.addResult(m.player1, m.result);
      this.addResult(m.player2, m.result.reverse());
    });

    this.playerStats = this.players
      .reduce((acc, p) => {
        const stats = this.calculateStats(p);
        acc.push({ stats, player: p });
        return acc;
      }, [] as PlayerStats[])
      .sort((x1, x2) => {
        const matches = x2.stats.matches[0] - x1.stats.matches[0];
        return matches;
      })
      .map((x, idx) => {
        return {
          stats: { ...x.stats, ranking: idx },
          player: x.player,
        } as PlayerStats;
      });
  }

  private calculate(player) {
    //this.init();
    const stats = this.calculateStats(player);

    this.players
      .reduce((acc, p) => {
        const stats = this.calculateStats(p);
        acc.push({ stats, player: p });
        return acc;
      }, [] as PlayerStats[])
      .sort((x1, x2) => {
        const matches = x2.stats.matches[0] - x1.stats.matches[0];
        return matches;
      })
      .forEach((x, idx) => {
        if (player === x.player) {
          stats.ranking = idx + 1;
        }
      });
    return stats;
  }

  private calculateStats(player): Stats {
    const results = this.resultMap[player];
    if (!results) {
      return {
        setpoints: [0, 0],
        sets: [0, 0],
        matches: [0, 0],
        ranking: -1,
      };
    }
    return results.reduce(
      (acc, result) => {
        acc.setpoints[0] += result.setpoints[0];
        acc.setpoints[1] += result.setpoints[1];
        acc.sets[0] += result.setsWonLost[0];
        acc.sets[1] += result.setsWonLost[1];
        if (result.win) {
          acc.matches[0]++;
        } else {
          acc.matches[1]++;
        }

        return acc;
      },
      {
        setpoints: [0, 0],
        sets: [0, 0],
        matches: [0, 0],
        ranking: -1,
      } as Stats
    );
  }
}
