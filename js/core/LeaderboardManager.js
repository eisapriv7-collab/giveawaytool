/**
 * LeaderboardManager
 * Tracks match results, placements (1st, 2nd, 3rd), and streamer giveaway history.
 */
export class LeaderboardManager {
  constructor() {
    this.history = [];
    this.loadHistory();
  }

  loadHistory() {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem('kick_arena_history');
        if (data) {
          this.history = JSON.parse(data);
        }
      }
    } catch (e) {
      this.history = [];
    }
  }

  saveHistory() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('kick_arena_history', JSON.stringify(this.history.slice(0, 50)));
      }
    } catch (e) {}
  }

  recordMatch({ gameName, winner, participants, durationSec, roundsCount, auditLog = [] }) {
    if (!winner) return null;

    // Sort participants by final rank
    const sorted = [...participants].sort((a, b) => {
      if (a.status === 'WINNER') return -1;
      if (b.status === 'WINNER') return 1;
      return (a.finalRank || 9999) - (b.finalRank || 9999);
    });

    const podium = {
      first: winner.username,
      second: sorted[1] ? sorted[1].username : null,
      third: sorted[2] ? sorted[2].username : null
    };

    const matchRecord = {
      id: `match_${Date.now()}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleDateString(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gameName: gameName || '50/50 SURVIVAL',
      winner: winner.username,
      winnerAvatarSeed: winner.avatarSeed || winner.seed,
      winnerColor: winner.palette?.bg || '#53FC18',
      totalParticipants: participants.length,
      durationSec: Math.round(durationSec),
      roundsCount: roundsCount || 1,
      podium,
      topPlacements: sorted.slice(0, 10).map((p, idx) => ({
        rank: idx + 1,
        username: p.username,
        status: p.status,
        color: p.palette?.bg || '#53FC18'
      })),
      auditProofCount: auditLog.length
    };

    this.history.unshift(matchRecord);
    this.saveHistory();
    return matchRecord;
  }

  getHistory() {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  getStats() {
    const totalMatches = this.history.length;
    const totalPlayersSum = this.history.reduce((acc, m) => acc + (m.totalParticipants || 0), 0);
    const avgDuration = totalMatches > 0
      ? Math.round(this.history.reduce((acc, m) => acc + (m.durationSec || 0), 0) / totalMatches)
      : 0;

    // Count top winners
    const winCounts = {};
    this.history.forEach(m => {
      winCounts[m.winner] = (winCounts[m.winner] || 0) + 1;
    });

    const topWinners = Object.entries(winCounts)
      .map(([username, wins]) => ({ username, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5);

    return {
      totalMatches,
      totalPlayersSum,
      avgDuration,
      topWinners
    };
  }
}
