// time_system.js - Core time passage system for LifeSim Chain

/**
 * TimeSystem - Manages the passage of time in the game
 * 
 * This is the core system that handles time progression, including:
 * - Different time scales (real-time, accelerated, paused)
 * - Automatic time progression when player is offline
 * - Time-based events and triggers
 * - Age progression and life stage transitions
 */
class TimeSystem {
  constructor() {
    // Time units
    this.minute = 60; // seconds
    this.hour = 60 * this.minute;
    this.day = 24 * this.hour;
    this.week = 7 * this.day;
    this.month = 30 * this.day; // Simplified month
    this.year = 365 * this.day; // Simplified year
    
    // Current game time
    this.currentGameTime = 0; // In seconds since game start
    this.startDate = new Date(2025, 0, 1); // Jan 1, 2025
    
    // Time scale settings
    this.timeScales = {
      PAUSED: 0,
      NORMAL: 1,      // 1 game day = 1 real hour (1 min game = 1 sec real)
      FAST: 2,        // 1 game day = 30 min real
      VERY_FAST: 4,   // 1 game day = 15 min real
      ULTRA_FAST: 8   // 1 game day = 7.5 min real
    };
    
    this.currentTimeScale = this.timeScales.NORMAL;
    this.isAutoTimeEnabled = false;
    
    // Life stages with age ranges (in years)
    this.lifeStages = {
      EARLY_CHILDHOOD: { min: 0, max: 3, name: "Early Childhood" },
      CHILDHOOD: { min: 4, max: 12, name: "Childhood" },
      ADOLESCENCE: { min: 13, max: 19, name: "Adolescence" },
      YOUNG_ADULT: { min: 20, max: 35, name: "Young Adult" },
      MIDDLE_AGE: { min: 36, max: 60, name: "Middle Age" },
      ELDERLY: { min: 61, max: 100, name: "Elderly" }
    };
    
    // Character age
    this.characterBirthTime = 0; // Game time when character was born
    this.characterAge = 0; // Current age in years
    this.currentLifeStage = this.lifeStages.EARLY_CHILDHOOD;
    
    // Event system
    this.scheduledEvents = [];
    this.eventListeners = {
      'dayPassed': [],
      'monthPassed': [],
      'yearPassed': [],
      'lifeStagePassed': [],
      'characterBirthday': []
    };
    
    // Last update tracking
    this.lastUpdateTime = Date.now();
    this.lastGameDay = this.getGameDay();
    this.lastGameMonth = this.getGameMonth();
    this.lastGameYear = this.getGameYear();
  }
  
  /**
   * Initialize the time system
   * @param {Object} config - Configuration options
   */
  initialize(config = {}) {
    if (config.startDate) this.startDate = new Date(config.startDate);
    if (config.characterAge) this.setCharacterAge(config.characterAge);
    if (config.timeScale) this.setTimeScale(config.timeScale);
    if (config.autoTimeEnabled !== undefined) this.isAutoTimeEnabled = config.autoTimeEnabled;
    
    // Start the update loop
    this.startUpdateLoop();
    
    console.log("Time System initialized:", {
      startDate: this.startDate,
      characterAge: this.characterAge,
      timeScale: this.currentTimeScale,
      autoTimeEnabled: this.isAutoTimeEnabled
    });
  }
  
  /**
   * Start the update loop for time progression
   */
  startUpdateLoop() {
    // Update every second in real time
    setInterval(() => this.update(), 1000);
  }
  
  /**
   * Main update function called on each tick
   */
  update() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;
    
    // Only progress time if not paused
    if (this.currentTimeScale > 0) {
      // Calculate time progression based on time scale
      const gameTimePassed = deltaTime * this.currentTimeScale;
      this.progressTime(gameTimePassed);
    }
  }
  
  /**
   * Progress the game time by the specified amount
   * @param {number} seconds - Seconds of game time to progress
   */
  progressTime(seconds) {
    const previousGameTime = this.currentGameTime;
    this.currentGameTime += seconds;
    
    // Check for day change
    const currentDay = this.getGameDay();
    if (currentDay !== this.lastGameDay) {
      this.lastGameDay = currentDay;
      this.triggerEvent('dayPassed', { day: currentDay });
    }
    
    // Check for month change
    const currentMonth = this.getGameMonth();
    if (currentMonth !== this.lastGameMonth) {
      this.lastGameMonth = currentMonth;
      this.triggerEvent('monthPassed', { month: currentMonth });
    }
    
    // Check for year change
    const currentYear = this.getGameYear();
    if (currentYear !== this.lastGameYear) {
      this.lastGameYear = currentYear;
      this.triggerEvent('yearPassed', { year: currentYear });
    }
    
    // Update character age
    this.updateCharacterAge();
    
    // Process scheduled events
    this.processScheduledEvents(previousGameTime, this.currentGameTime);
  }
  
  /**
   * Get the current game date
   * @returns {Date} Current game date
   */
  getCurrentGameDate() {
    const gameDate = new Date(this.startDate);
    gameDate.setSeconds(gameDate.getSeconds() + this.currentGameTime);
    return gameDate;
  }
  
  /**
   * Get the current game day
   * @returns {number} Current game day
   */
  getGameDay() {
    return Math.floor(this.currentGameTime / this.day);
  }
  
  /**
   * Get the current game month
   * @returns {number} Current game month
   */
  getGameMonth() {
    return Math.floor(this.currentGameTime / this.month);
  }
  
  /**
   * Get the current game year
   * @returns {number} Current game year
   */
  getGameYear() {
    return Math.floor(this.currentGameTime / this.year);
  }
  
  /**
   * Set the character's age
   * @param {number} ageInYears - Character age in years
   */
  setCharacterAge(ageInYears) {
    this.characterAge = ageInYears;
    this.characterBirthTime = this.currentGameTime - (ageInYears * this.year);
    this.updateLifeStage();
  }
  
  /**
   * Update the character's age based on current game time
   */
  updateCharacterAge() {
    const previousAge = this.characterAge;
    const ageInSeconds = this.currentGameTime - this.characterBirthTime;
    this.characterAge = ageInSeconds / this.year;
    
    // Check for birthday
    if (Math.floor(this.characterAge) > Math.floor(previousAge)) {
      this.triggerEvent('characterBirthday', { 
        age: Math.floor(this.characterAge) 
      });
    }
    
    // Update life stage if needed
    this.updateLifeStage();
  }
  
  /**
   * Update the character's life stage based on current age
   */
  updateLifeStage() {
    const previousLifeStage = this.currentLifeStage;
    
    // Determine current life stage
    for (const [stageName, stageData] of Object.entries(this.lifeStages)) {
      if (this.characterAge >= stageData.min && this.characterAge <= stageData.max) {
        this.currentLifeStage = stageData;
        break;
      }
    }
    
    // Trigger event if life stage changed
    if (previousLifeStage !== this.currentLifeStage) {
      this.triggerEvent('lifeStagePassed', {
        previousStage: previousLifeStage,
        newStage: this.currentLifeStage
      });
    }
  }
  
  /**
   * Set the time scale
   * @param {string|number} scale - Time scale to set
   */
  setTimeScale(scale) {
    if (typeof scale === 'string') {
      const scaleKey = scale.toUpperCase();
      if (this.timeScales[scaleKey] !== undefined) {
        this.currentTimeScale = this.timeScales[scaleKey];
      } else {
        console.error(`Invalid time scale: ${scale}`);
      }
    } else if (typeof scale === 'number') {
      this.currentTimeScale = scale;
    }
  }
  
  /**
   * Toggle automatic time progression
   * @param {boolean} enabled - Whether auto time is enabled
   */
  setAutoTimeEnabled(enabled) {
    this.isAutoTimeEnabled = enabled;
  }
  
  /**
   * Schedule an event to occur at a specific game time
   * @param {number} gameTime - Game time when event should trigger
   * @param {Function} callback - Function to call when event triggers
   * @param {Object} data - Additional data to pass to the callback
   * @returns {number} Event ID
   */
  scheduleEvent(gameTime, callback, data = {}) {
    const eventId = Date.now() + Math.random();
    this.scheduledEvents.push({
      id: eventId,
      time: gameTime,
      callback,
      data
    });
    
    // Sort events by time
    this.scheduledEvents.sort((a, b) => a.time - b.time);
    
    return eventId;
  }
  
  /**
   * Process scheduled events that should trigger between the previous and current game time
   * @param {number} previousTime - Previous game time
   * @param {number} currentTime - Current game time
   */
  processScheduledEvents(previousTime, currentTime) {
    const triggeredEvents = [];
    const remainingEvents = [];
    
    // Find events that should trigger
    for (const event of this.scheduledEvents) {
      if (event.time > previousTime && event.time <= currentTime) {
        triggeredEvents.push(event);
      } else {
        remainingEvents.push(event);
      }
    }
    
    // Update scheduled events list
    this.scheduledEvents = remainingEvents;
    
    // Trigger events
    for (const event of triggeredEvents) {
      try {
        event.callback({
          ...event.data,
          scheduledTime: event.time,
          currentTime: currentTime
        });
      } catch (error) {
        console.error("Error in scheduled event:", error);
      }
    }
  }
  
  /**
   * Add an event listener
   * @param {string} eventType - Type of event to listen for
   * @param {Function} callback - Function to call when event triggers
   * @returns {boolean} Whether the listener was added successfully
   */
  addEventListener(eventType, callback) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].push(callback);
      return true;
    }
    return false;
  }
  
  /**
   * Remove an event listener
   * @param {string} eventType - Type of event
   * @param {Function} callback - Callback to remove
   * @returns {boolean} Whether the listener was removed successfully
   */
  removeEventListener(eventType, callback) {
    if (this.eventListeners[eventType]) {
      const index = this.eventListeners[eventType].indexOf(callback);
      if (index !== -1) {
        this.eventListeners[eventType].splice(index, 1);
        return true;
      }
    }
    return false;
  }
  
  /**
   * Trigger an event
   * @param {string} eventType - Type of event to trigger
   * @param {Object} data - Data to pass to listeners
   */
  triggerEvent(eventType, data = {}) {
    if (this.eventListeners[eventType]) {
      for (const callback of this.eventListeners[eventType]) {
        try {
          callback({
            type: eventType,
            time: this.currentGameTime,
            gameDate: this.getCurrentGameDate(),
            ...data
          });
        } catch (error) {
          console.error(`Error in ${eventType} event listener:`, error);
        }
      }
    }
  }
  
  /**
   * Simulate offline time progression
   * @param {number} offlineTimeInSeconds - Real seconds passed while offline
   */
  simulateOfflineTime(offlineTimeInSeconds) {
    if (!this.isAutoTimeEnabled) return;
    
    // In auto time mode, game time passes at the same rate as real time
    const gameTimePassed = offlineTimeInSeconds;
    
    console.log(`Simulating ${gameTimePassed} seconds of offline time`);
    
    // Progress time without triggering normal events
    this.currentGameTime += gameTimePassed;
    
    // Update character age
    this.updateCharacterAge();
    
    // Generate a summary of what happened during offline time
    const offlineSummary = this.generateOfflineSummary(gameTimePassed);
    
    return offlineSummary;
  }
  
  /**
   * Generate a summary of what happened during offline time
   * @param {number} gameTimePassed - Game time that passed while offline
   * @returns {Object} Summary of offline events
   */
  generateOfflineSummary(gameTimePassed) {
    const daysPassed = Math.floor(gameTimePassed / this.day);
    const monthsPassed = Math.floor(gameTimePassed / this.month);
    const yearsPassed = Math.floor(gameTimePassed / this.year);
    
    // Calculate age change
    const previousAge = this.characterAge - (gameTimePassed / this.year);
    const hadBirthday = Math.floor(this.characterAge) > Math.floor(previousAge);
    
    // Determine if life stage changed
    let lifeStageChanged = false;
    let previousLifeStage = null;
    
    for (const [stageName, stageData] of Object.entries(this.lifeStages)) {
      if (previousAge >= stageData.min && previousAge <= stageData.max) {
        previousLifeStage = stageData;
        break;
      }
    }
    
    if (previousLifeStage !== this.currentLifeStage) {
      lifeStageChanged = true;
    }
    
    return {
      timePassed: {
        seconds: gameTimePassed,
        days: daysPassed,
        months: monthsPassed,
        years: yearsPassed
      },
      character: {
        previousAge: previousAge,
        currentAge: this.characterAge,
        hadBirthday: hadBirthday,
        lifeStageChanged: lifeStageChanged,
        previousLifeStage: previousLifeStage,
        currentLifeStage: this.currentLifeStage
      },
      currentDate: this.getCurrentGameDate()
    };
  }
  
  /**
   * Get a formatted string representation of the current game time
   * @returns {string} Formatted time string
   */
  getFormattedGameTime() {
    const date = this.getCurrentGameDate();
    return date.toLocaleString();
  }
  
  /**
   * Get a formatted string representation of the character's age
   * @returns {string} Formatted age string
   */
  getFormattedCharacterAge() {
    const years = Math.floor(this.characterAge);
    const months = Math.floor((this.characterAge - years) * 12);
    
    if (years === 0) {
      return `${months} months`;
    } else if (months === 0) {
      return `${years} years`;
    } else {
      return `${years} years, ${months} months`;
    }
  }
  
  /**
   * Get the current state of the time system
   * @returns {Object} Current state
   */
  getState() {
    return {
      currentGameTime: this.currentGameTime,
      gameDate: this.getCurrentGameDate(),
      timeScale: this.currentTimeScale,
      autoTimeEnabled: this.isAutoTimeEnabled,
      character: {
        age: this.characterAge,
        formattedAge: this.getFormattedCharacterAge(),
        lifeStage: this.currentLifeStage.name
      }
    };
  }
}

// Export the TimeSystem class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimeSystem };
}
