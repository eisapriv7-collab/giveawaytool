/**
 * ParticipantManager
 * Independent state manager for giveaway participants.
 * Handles duplicate blocking, join/leave lifecycle, lock status, and event dispatch.
 */

const GAMER_PALETTES = [
  { bg: '#53FC18', text: '#000000', name: 'Kick Green' },
  { bg: '#00F0FF', text: '#000000', name: 'Cyber Cyan' },
  { bg: '#FF0055', text: '#FFFFFF', name: 'Neon Crimson' },
  { bg: '#FFE600', text: '#000000', name: 'Solar Gold' },
  { bg: '#9D00FF', text: '#FFFFFF', name: 'Vortex Purple' },
  { bg: '#FF5500', text: '#FFFFFF', name: 'Plasma Orange' },
  { bg: '#00FFA3', text: '#000000', name: 'Mint Laser' },
  { bg: '#FF00A0', text: '#FFFFFF', name: 'Hyper Pink' },
  { bg: '#3877FF', text: '#FFFFFF', name: 'Cobalt Blue' },
  { bg: '#FF3366', text: '#FFFFFF', name: 'Coral Fire' },
  { bg: '#00FF66', text: '#000000', name: 'Acid Lime' },
  { bg: '#A855F7', text: '#FFFFFF', name: 'Arcane Violet' }
];

export class ParticipantManager {
  constructor() {
    this.participants = new Map(); // key: lowercase username -> Participant
    this.isLocked = false;
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in ParticipantManager listener for ${event}:`, err);
        }
      }
    }
  }

  /**
   * Helper to generate consistent styling for a username
   */
  _generateParticipantStyle(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = (hash << 5) - hash + username.charCodeAt(i);
      hash |= 0;
    }
    const colorIndex = Math.abs(hash) % GAMER_PALETTES.length;
    const palette = GAMER_PALETTES[colorIndex];
    const initial = username.charAt(0).toUpperCase();

    // Funny eye / facial expression seeds for game characters
    const eyeTypes = ['normal', 'wide', 'squint', 'angry', 'derp', 'cool'];
    const eyeType = eyeTypes[Math.abs(hash >> 3) % eyeTypes.length];

    return {
      palette,
      initial,
      eyeType,
      seed: Math.abs(hash)
    };
  }

  /**
   * Add a Kick viewer to the participant pool
   */
  add(rawUsername) {
    if (!rawUsername) return { success: false, reason: 'Invalid username' };
    const username = String(rawUsername).trim();
    if (username.length === 0) return { success: false, reason: 'Empty username' };

    const key = username.toLowerCase();

    // Check if game is in progress (joining locked)
    if (this.isLocked) {
      return { success: false, reason: 'Game in progress. Joining closed.' };
    }

    // Prevent duplicate joins
    if (this.participants.has(key)) {
      return { success: false, reason: 'Already joined', participant: this.participants.get(key) };
    }

    const style = this._generateParticipantStyle(username);

    const participant = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      username,
      joinedAt: Date.now(),
      status: 'JOINED', // 'JOINED' | 'PLAYING' | 'ELIMINATED' | 'WINNER'
      score: 0,
      alive: true,
      position: { x: 0, y: 0 },
      eliminatedAt: null,
      eliminatedRound: null,
      finalRank: null,
      palette: style.palette,
      initial: style.initial,
      eyeType: style.eyeType,
      seed: style.seed
    };

    this.participants.set(key, participant);
    this.emit('add', participant);
    this.emit('change', { type: 'add', participant, total: this.getCount() });

    return { success: true, participant };
  }

  /**
   * Remove a participant (if !leave is called before game starts)
   */
  remove(rawUsername) {
    if (!rawUsername) return false;
    const key = String(rawUsername).trim().toLowerCase();

    if (this.isLocked) {
      return false; // Cannot leave after game has started
    }

    if (this.participants.has(key)) {
      const p = this.participants.get(key);
      this.participants.delete(key);
      this.emit('remove', p);
      this.emit('change', { type: 'remove', participant: p, total: this.getCount() });
      return true;
    }
    return false;
  }

  /**
   * Get a participant by username
   */
  get(rawUsername) {
    if (!rawUsername) return null;
    return this.participants.get(String(rawUsername).trim().toLowerCase()) || null;
  }

  /**
   * Get array of all participants
   */
  getAll() {
    return Array.from(this.participants.values());
  }

  /**
   * Get array of currently alive participants
   */
  getAlive() {
    return this.getAll().filter(p => p.alive && p.status !== 'ELIMINATED');
  }

  /**
   * Get array of eliminated participants (sorted by finalRank or eliminatedAt)
   */
  getEliminated() {
    return this.getAll().filter(p => !p.alive || p.status === 'ELIMINATED')
      .sort((a, b) => (a.finalRank || 999999) - (b.finalRank || 999999));
  }

  /**
   * Get current winner if selected
   */
  getWinner() {
    return this.getAll().find(p => p.status === 'WINNER') || null;
  }

  /**
   * Total participant count
   */
  getCount() {
    return this.participants.size;
  }

  /**
   * Alive participant count
   */
  getAliveCount() {
    return this.getAlive().length;
  }

  /**
   * Lock joining when game starts
   */
  lock() {
    this.isLocked = true;
    this.emit('lock', true);
  }

  /**
   * Unlock joining (in lobby)
   */
  unlock() {
    this.isLocked = false;
    this.emit('unlock', false);
  }

  /**
   * Set all participants to PLAYING status at game start
   */
  setAllPlaying() {
    for (const p of this.participants.values()) {
      p.status = 'PLAYING';
      p.alive = true;
      p.eliminatedAt = null;
      p.eliminatedRound = null;
      p.finalRank = null;
      p.score = 0;
    }
    this.emit('change', { type: 'start_all', total: this.getCount() });
  }

  /**
   * Mark a participant as eliminated
   */
  eliminate(rawUsername, rank, round) {
    const key = String(rawUsername).trim().toLowerCase();
    const p = this.participants.get(key);
    if (p) {
      p.alive = false;
      p.status = 'ELIMINATED';
      p.finalRank = rank;
      p.eliminatedRound = round;
      p.eliminatedAt = Date.now();
      this.emit('eliminate', { participant: p, rank, round });
      this.emit('change', { type: 'eliminate', participant: p, remaining: this.getAliveCount() });
      return p;
    }
    return null;
  }

  /**
   * Set the final single winner
   */
  setWinner(rawUsername) {
    const key = String(rawUsername).trim().toLowerCase();
    const p = this.participants.get(key);
    if (p) {
      p.alive = true;
      p.status = 'WINNER';
      p.finalRank = 1;
      this.emit('winner', p);
      this.emit('change', { type: 'winner', participant: p });
      return p;
    }
    return null;
  }

  /**
   * Reset participant statuses back to JOINED for another round,
   * or completely clear the list if retainList is false.
   */
  reset(retainList = false) {
    if (retainList) {
      for (const p of this.participants.values()) {
        p.status = 'JOINED';
        p.alive = true;
        p.eliminatedAt = null;
        p.eliminatedRound = null;
        p.finalRank = null;
        p.score = 0;
      }
    } else {
      this.participants.clear();
    }
    this.isLocked = false;
    this.emit('reset', { retainList, count: this.getCount() });
    this.emit('change', { type: 'reset', count: this.getCount() });
  }

  /**
   * Populate test users for debug / demo mode
   */
  addTestPlayers(count = 10) {
    if (this.isLocked) return [];
    const TEST_NAMES = [
      'xQc_Juicer', 'NinjaClips', 'KickKing_99', 'NeonValkyrie', 'GamerGod420',
      'LootGoblin', 'StreamSniperX', 'PogChamp_Real', 'ShadowBlade', 'PixelQueen',
      'CyberSamurai', 'HyperDrive99', 'TurboNoob', 'ApexPredator', 'GlitchMaster',
      'QuantumLeap', 'VortexRider', 'AlphaWolf_7', 'SlayerBro', 'MythicHero',
      'ZeroCool_88', 'SpeedDemon', 'OmegaStrike', 'FrostBite', 'IronClad_Kick',
      'BlazeFury', 'NovaBlast', 'EchoWhisper', 'KrakenUnleashed', 'TitanBane',
      'ViperVenom', 'StormBringer', 'PhantomAce', 'RetroGamer90s', 'SolarFlare',
      'GalacticChad', 'DriftKing_JP', 'LuckyStrike77', 'SniperElite_9', 'ChaosTheory',
      'DoughnutLord', 'MemeMachine', 'CaptainWaffle', 'SecretAgent_00', 'RocketRaccoon',
      'CheekyMonkey', 'SilverSurfer', 'LaserBeamz', 'NightHawk_99', 'AtomicPulse',
      'BobaFetty', 'MatrixNeo', 'GigaChad_Kick', 'SneakyFox', 'BananaSplit77',
      'CosmicDoge', 'ElectricShock', 'GoldenEagle', 'DarkMatter_X', 'SilentNinja',
      'RagingBull', 'FireStorm', 'FrostyBoi', 'ThunderBird', 'Velociraptor',
      'QuantumGhost', 'AstroBoy99', 'CyberPunk_2077', 'NeonKnight', 'Starlight_88',
      'DragonSlayer', 'MysticMage', 'ShadowHunter', 'IronFist', 'SteelSamurai',
      'CobraKai_99', 'ValkyrieQueen', 'TitaniumBoi', 'PixelPaladin', 'BlazeRunner',
      'VenomousViper', 'SilverBullet', 'GoldenArrow', 'NeonPulse', 'SkyWalker_99',
      'StarLord_Kick', 'RocketMan_77', 'CaptainKick', 'MegaMind_99', 'SuperSonic',
      'HyperSonic_9', 'FlashGordon', 'GhostRider_X', 'IronMan_Kick', 'SpiderGamer',
      'BlackPanther_7', 'Wolverine_99', 'Deadpool_Live', 'ThorThunder', 'HulkSmash_99'
    ];

    const added = [];
    const shuffled = [...TEST_NAMES].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      let name = shuffled[i % shuffled.length];
      if (this.participants.has(name.toLowerCase())) {
        name = `${name}_${Math.floor(Math.random() * 900 + 100)}`;
      }
      const res = this.add(name);
      if (res.success) added.push(res.participant);
    }
    return added;
  }
}
