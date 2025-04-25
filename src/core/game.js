// game.js - Main game initialization and coordination for LifeSim

/**
 * Game - Main game class that coordinates all systems
 * 
 * This class initializes and connects all core systems:
 * - Time System: Manages game time progression
 * - Character Stats: Manages character attributes
 * - Choices System: Manages player choices and consequences
 * 
 * It serves as the main entry point for the game and handles saving/loading
 */
class Game {
  constructor() {
    // Core systems
    this.timeSystem = null;
    this.characterStats = null;
    this.choicesSystem = null;
    
    // Game state
    this.isInitialized = false;
    this.isPaused = true;
    this.lastSaveTime = 0;
    this.autoSaveInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Event listeners
    this.eventListeners = {
      'gameStateChanged': [],
      'gameSaved': [],
      'gameLoaded': []
    };
  }
  
  /**
   * Initialize the game with configuration
   * @param {Object} config - Game configuration
   */
  initialize(config = {}) {
    console.log("Initializing LifeSim Chain game...");
    
    // Initialize Time System
    this.timeSystem = new TimeSystem();
    this.timeSystem.initialize(config.time || {});
    
    // Initialize Character Stats
    this.characterStats = new CharacterStats(this.timeSystem);
    
    // Initialize Choices System
    this.choicesSystem = new ChoicesSystem(this.timeSystem, this.characterStats);
    
    // Set up auto-save
    this.setupAutoSave();
    
    // Mark as initialized
    this.isInitialized = true;
    this.isPaused = false;
    
    // Trigger state change event
    this.triggerEvent('gameStateChanged', { state: 'initialized' });
    
    console.log("Game initialized successfully");
    
    return true;
  }
  
  /**
   * Set up auto-save functionality
   */
  setupAutoSave() {
    setInterval(() => {
      if (this.isInitialized && !this.isPaused) {
        this.saveGame('auto_save');
      }
    }, this.autoSaveInterval);
  }
  
  /**
   * Start a new game
   * @param {Object} config - New game configuration
   */
  newGame(config = {}) {
    console.log("Starting new game...");
    
    // Default configuration
    const defaultConfig = {
      time: {
        startDate: new Date(2025, 0, 1),
        characterAge: 0, // Start as a newborn
        timeScale: 'NORMAL',
        autoTimeEnabled: false
      },
      character: {
        name: "Player",
        gender: "unspecified"
      }
    };
    
    // Merge with provided config
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      time: { ...defaultConfig.time, ...(config.time || {}) },
      character: { ...defaultConfig.character, ...(config.character || {}) }
    };
    
    // Initialize or reinitialize the game
    if (!this.isInitialized) {
      this.initialize(mergedConfig);
    } else {
      // Reset systems
      this.timeSystem.initialize(mergedConfig.time);
      this.characterStats = new CharacterStats(this.timeSystem);
      this.choicesSystem = new ChoicesSystem(this.timeSystem, this.characterStats);
    }
    
    // Set character age
    if (mergedConfig.time.characterAge > 0) {
      this.timeSystem.setCharacterAge(mergedConfig.time.characterAge);
    }
    
    // Unpause the game
    this.isPaused = false;
    
    // Trigger state change event
    this.triggerEvent('gameStateChanged', { state: 'newGame' });
    
    console.log("New game started");
    
    return true;
  }
  
  /**
   * Save the current game state
   * @param {string} saveSlot - Name of the save slot
   * @returns {Object} Save data
   */
  saveGame(saveSlot = 'manual_save') {
    if (!this.isInitialized) {
      console.error("Cannot save: Game not initialized");
      return null;
    }
    
    console.log(`Saving game to slot: ${saveSlot}`);
    
    // Create save data object
    const saveData = {
      version: "1.0.0",
      timestamp: Date.now(),
      timeSystem: JSON.parse(this.timeSystem.saveState()),
      characterStats: JSON.parse(this.characterStats.saveState()),
      choicesSystem: JSON.parse(this.choicesSystem.saveState())
    };
    
    // In a real implementation, this would save to localStorage, IndexedDB, or server
    // For this prototype, we'll just return the save data
    
    // Update last save time
    this.lastSaveTime = Date.now();
    
    // Trigger save event
    this.triggerEvent('gameSaved', { 
      slot: saveSlot, 
      timestamp: this.lastSaveTime 
    });
    
    console.log("Game saved successfully");
    
    return saveData;
  }
  
  /**
   * Load a saved game state
   * @param {Object} saveData - Saved game data
   * @returns {boolean} Success status
   */
  loadGame(saveData) {
    if (!saveData) {
      console.error("Cannot load: No save data provided");
      return false;
    }
    
    console.log("Loading saved game...");
    
    try {
      // Initialize systems if needed
      if (!this.isInitialized) {
        this.initialize();
      }
      
      // Load time system state
      if (saveData.timeSystem) {
        this.timeSystem.loadState(saveData.timeSystem);
      }
      
      // Load character stats
      if (saveData.characterStats) {
        this.characterStats.loadState(saveData.characterStats);
      }
      
      // Load choices system
      if (saveData.choicesSystem) {
        this.choicesSystem.loadState(saveData.choicesSystem);
      }
      
      // Unpause the game
      this.isPaused = false;
      
      // Trigger load event
      this.triggerEvent('gameLoaded', { 
        timestamp: saveData.timestamp 
      });
      
      console.log("Game loaded successfully");
      
      return true;
    } catch (error) {
      console.error("Error loading game:", error);
      return false;
    }
  }
  
  /**
   * Pause the game
   */
  pauseGame() {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.timeSystem.setTimeScale('PAUSED');
    
    // Trigger state change event
    this.triggerEvent('gameStateChanged', { state: 'paused' });
    
    console.log("Game paused");
  }
  
  /**
   * Resume the game
   */
  resumeGame() {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    this.timeSystem.setTimeScale('NORMAL');
    
    // Trigger state change event
    this.triggerEvent('gameStateChanged', { state: 'resumed' });
    
    console.log("Game resumed");
  }
  
  /**
   * Set the game time scale
   * @param {string} scale - Time scale to set
   */
  setTimeScale(scale) {
    this.timeSystem.setTimeScale(scale);
    
    // Trigger state change event
    this.triggerEvent('gameStateChanged', { 
      state: 'timeScaleChanged',
      timeScale: scale
    });
  }
  
  /**
   * Enable or disable automatic time progression
   * @param {boolean} enabled - Whether auto time is enabled
   */
  setAutoTimeEnabled(enabled) {
    this.timeSystem.setAutoTimeEnabled(enabled);
    
    // Trigger state change event
    this.triggerEvent('gameStateChanged', { 
      state: 'autoTimeChanged',
      autoTimeEnabled: enabled
    });
  }
  
  /**
   * Make a choice in the game
   * @param {string} choiceId - ID of the choice
   * @param {string} optionId - ID of the selected option
   * @returns {Object} Results of the choice
   */
  makeChoice(choiceId, optionId) {
    const result = this.choicesSystem.makeChoice(choiceId, optionId);
    
    // Trigger state change event
    this.triggerEvent('gameStateChanged', { 
      state: 'choiceMade',
      choice: result
    });
    
    return result;
  }
  
  /**
   * Simulate returning to the game after being offline
   * @param {number} offlineTimeInSeconds - Real seconds passed while offline
   * @returns {Object} Summary of what happened during offline time
   */
  simulateOfflineTime(offlineTimeInSeconds) {
    if (!this.timeSystem.isAutoTimeEnabled) {
      console.log("Auto time progression is disabled, no offline simulation performed");
      return null;
    }
    
    console.log(`Simulating ${offlineTimeInSeconds} seconds of offline time`);
    
    // Simulate time passage in the time system
    const offlineSummary = this.timeSystem.simulateOfflineTime(offlineTimeInSeconds);
    
    // Trigger state change event
    this.triggerEvent('gameStateChanged', { 
      state: 'offlineTimeSimulated',
      summary: offlineSummary
    });
    
    return offlineSummary;
  }
  
  /**
   * Get the current game state
   * @returns {Object} Current game state
   */
  getGameState() {
    if (!this.isInitialized) {
      return { initialized: false };
    }
    
    return {
      initialized: this.isInitialized,
      paused: this.isPaused,
      lastSave: this.lastSaveTime,
      time: this.timeSystem.getState(),
      character: this.characterStats.getState(),
      choices: this.choicesSystem.getState()
    };
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
            timestamp: Date.now(),
            ...data
          });
        } catch (error) {
          console.error(`Error in ${eventType} event listener:`, error);
        }
      }
    }
  }
}

// Export the Game class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game };
}
