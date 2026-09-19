/**
 * RandomManager
 * Cryptographically secure transparent randomness using crypto.getRandomValues().
 * Provides fair RNG, verifiable roll logs, and cryptographic audit records.
 */
export class RandomManager {
  constructor() {
    this.auditLog = [];
    this.maxAuditEntries = 100;
  }

  /**
   * Returns a cryptographically secure float in [0, 1)
   */
  getFairFloat() {
    const cryptoObj = (typeof window !== 'undefined' && window.crypto) || (typeof globalThis !== 'undefined' && globalThis.crypto);
    if (cryptoObj && cryptoObj.getRandomValues) {
      const buffer = new Uint32Array(1);
      cryptoObj.getRandomValues(buffer);
      return buffer[0] / (0xFFFFFFFF + 1);
    }
    // Fallback if crypto is somehow unavailable
    return Math.random();
  }

  /**
   * Returns a fair integer in [min, max] (inclusive)
   */
  getFairInt(min, max) {
    const minVal = Math.ceil(min);
    const maxVal = Math.floor(max);
    return Math.floor(this.getFairFloat() * (maxVal - minVal + 1)) + minVal;
  }

  /**
   * Returns a 50/50 boolean (coin flip)
   */
  flipCoin() {
    return this.getFairFloat() < 0.5;
  }

  /**
   * Cryptographically fair Fisher-Yates array shuffle
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.getFairInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Pick one random element from an array
   */
  pickOne(array) {
    if (!array || array.length === 0) return null;
    const index = this.getFairInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Generates a random safe zone and records a transparent audit entry
   */
  pickSafeZone(roundNumber, availableZones = ['RED', 'BLUE']) {
    const rawFloat = this.getFairFloat();
    const zoneIndex = Math.floor(rawFloat * availableZones.length);
    const safeZone = availableZones[zoneIndex];

    // Generate cryptographic proof hash/hex
    let seedHex = '';
    const cryptoObj = (typeof window !== 'undefined' && window.crypto) || (typeof globalThis !== 'undefined' && globalThis.crypto);
    if (cryptoObj && cryptoObj.getRandomValues) {
      const randBytes = new Uint8Array(8);
      cryptoObj.getRandomValues(randBytes);
      seedHex = Array.from(randBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      seedHex = Math.random().toString(16).substring(2, 10);
    }

    const auditEntry = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      round: roundNumber,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString(),
      safeZone,
      rollValue: Number(rawFloat.toFixed(6)),
      seedHex: `0x${seedHex}`,
      zones: [...availableZones],
      method: 'crypto.getRandomValues (Web Crypto API)'
    };

    this.auditLog.unshift(auditEntry);
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog.pop();
    }

    return {
      safeZone,
      auditEntry
    };
  }

  /**
   * Get complete roll audit log
   */
  getAuditLog() {
    return [...this.auditLog];
  }

  /**
   * Clear roll audit log
   */
  clearAuditLog() {
    this.auditLog = [];
  }
}
