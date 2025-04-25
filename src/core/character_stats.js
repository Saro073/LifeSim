// character_stats.js - Character statistics system for LifeSim

/**
 * CharacterStats - Manages character attributes and their evolution over time
 * 
 * This system handles all character statistics including:
 * - Physical attributes (health, energy, appearance)
 * - Mental attributes (intelligence, creativity, wisdom)
 * - Emotional attributes (happiness, stress, self-esteem)
 * - Social attributes (charisma, empathy, reputation)
 * - Practical attributes (wealth, career, skills)
 * 
 * Statistics evolve based on:
 * - Natural growth/decay with age
 * - Activities and choices
 * - Life events
 * - Relationships with other characters
 */
class CharacterStats {
  constructor(timeSystem) {
    // Reference to the time system for age-based changes
    this.timeSystem = timeSystem;
    
    // Initialize all character attributes with default values
    this.attributes = {
      // Physical attributes
      physical: {
        health: 100,        // Overall physical wellbeing
        energy: 100,        // Daily energy for activities
        appearance: 50      // Physical attractiveness
      },
      
      // Mental attributes
      mental: {
        intelligence: 50,   // Cognitive abilities
        creativity: 50,     // Lateral thinking and artistic expression
        wisdom: 10          // Experience and judgment (grows with age)
      },
      
      // Emotional attributes
      emotional: {
        happiness: 70,      // Overall emotional wellbeing
        stress: 30,         // Psychological pressure (lower is better)
        selfEsteem: 50      // Confidence in oneself
      },
      
      // Social attributes
      social: {
        charisma: 50,       // Ability to influence others
        empathy: 50,        // Ability to understand others
        reputation: 50      // How the character is perceived by society
      },
      
      // Practical attributes
      practical: {
        wealth: 0,          // Financial resources
        career: 0,          // Career advancement
        skills: {}          // Specific skills (cooking, programming, etc.)
      }
    };
    
    // Attribute limits
    this.minValue = 0;
    this.maxValue = 100;
    
    // Attribute modifiers based on life stage
    this.lifeStageModifiers = {
      "Early Childhood": {
        physical: { health: 0.5, energy: 0.5, appearance: 0.1 },
        mental: { intelligence: 1.0, creativity: 1.0, wisdom: 0.5 },
        emotional: { happiness: 0.2, stress: -0.2, selfEsteem: 0.2 },
        social: { charisma: 0.3, empathy: 0.5, reputation: 0.1 },
        practical: { wealth: 0, career: 0 }
      },
      "Childhood": {
        physical: { health: 0.3, energy: 0.4, appearance: 0.2 },
        mental: { intelligence: 0.8, creativity: 0.8, wisdom: 0.3 },
        emotional: { happiness: 0.1, stress: -0.1, selfEsteem: 0.3 },
        social: { charisma: 0.4, empathy: 0.4, reputation: 0.2 },
        practical: { wealth: 0, career: 0 }
      },
      "Adolescence": {
        physical: { health: 0.2, energy: 0.3, appearance: 0.4 },
        mental: { intelligence: 0.6, creativity: 0.6, wisdom: 0.2 },
        emotional: { happiness: -0.1, stress: 0.2, selfEsteem: 0.1 },
        social: { charisma: 0.5, empathy: 0.3, reputation: 0.4 },
        practical: { wealth: 0.1, career: 0.1 }
      },
      "Young Adult": {
        physical: { health: 0.1, energy: 0.2, appearance: 0.1 },
        mental: { intelligence: 0.4, creativity: 0.4, wisdom: 0.4 },
        emotional: { happiness: 0.1, stress: 0.1, selfEsteem: 0.2 },
        social: { charisma: 0.3, empathy: 0.2, reputation: 0.5 },
        practical: { wealth: 0.3, career: 0.5 }
      },
      "Middle Age": {
        physical: { health: -0.1, energy: -0.1, appearance: -0.1 },
        mental: { intelligence: 0.1, creativity: 0.1, wisdom: 0.6 },
        emotional: { happiness: 0.1, stress: 0.1, selfEsteem: 0.1 },
        social: { charisma: 0.2, empathy: 0.3, reputation: 0.3 },
        practical: { wealth: 0.4, career: 0.3 }
      },
      "Elderly": {
        physical: { health: -0.3, energy: -0.3, appearance: -0.2 },
        mental: { intelligence: -0.1, creativity: -0.1, wisdom: 0.8 },
        emotional: { happiness: 0.2, stress: -0.1, selfEsteem: 0.1 },
        social: { charisma: 0.1, empathy: 0.4, reputation: 0.2 },
        practical: { wealth: 0.2, career: -0.2 }
      }
    };
    
    // Activity effects on attributes
    this.activityEffects = {
      // Examples of activities and their effects
      exercise: {
        physical: { health: 2, energy: -5, appearance: 0.5 },
        emotional: { happiness: 1, stress: -2 }
      },
      study: {
        mental: { intelligence: 1.5, wisdom: 0.5 },
        emotional: { stress: 1 },
        physical: { energy: -3 }
      },
      socialize: {
        social: { charisma: 1, empathy: 0.5, reputation: 0.2 },
        emotional: { happiness: 2, stress: -1 },
        physical: { energy: -2 }
      },
      work: {
        practical: { wealth: 1, career: 0.5 },
        mental: { intelligence: 0.2, wisdom: 0.3 },
        emotional: { stress: 2 },
        physical: { energy: -5 }
      },
      rest: {
        physical: { health: 1, energy: 10 },
        emotional: { stress: -3 }
      },
      creative: {
        mental: { creativity: 2 },
        emotional: { happiness: 1, selfEsteem: 0.5 },
        physical: { energy: -2 }
      }
    };
    
    // Event listeners for time-based changes
    this.setupEventListeners();
    
    // Skill categories and available skills
    this.skillCategories = {
      academic: ["mathematics", "science", "literature", "history"],
      artistic: ["music", "painting", "writing", "dancing"],
      physical: ["strength", "endurance", "agility", "coordination"],
      social: ["persuasion", "leadership", "networking", "negotiation"],
      practical: ["cooking", "gardening", "mechanics", "electronics"],
      professional: ["business", "medicine", "law", "technology"]
    };
    
    // Initialize skills with zero values
    this.initializeSkills();
  }
  
  /**
   * Initialize all skills with zero values
   */
  initializeSkills() {
    for (const category in this.skillCategories) {
      for (const skill of this.skillCategories[category]) {
        this.attributes.practical.skills[skill] = 0;
      }
    }
  }
  
  /**
   * Set up event listeners for time-based attribute changes
   */
  setupEventListeners() {
    // Update attributes daily
    this.timeSystem.addEventListener('dayPassed', (event) => {
      this.updateDailyAttributes();
    });
    
    // Update attributes on birthday
    this.timeSystem.addEventListener('characterBirthday', (event) => {
      this.updateAttributesOnBirthday(event.age);
    });
    
    // Update attributes on life stage change
    this.timeSystem.addEventListener('lifeStagePassed', (event) => {
      this.applyLifeStageTransition(event.previousStage, event.newStage);
    });
  }
  
  /**
   * Update attributes based on daily changes
   */
  updateDailyAttributes() {
    // Natural recovery of energy if not too stressed
    if (this.attributes.emotional.stress < 70) {
      this.modifyAttribute('physical', 'energy', 10);
    } else {
      this.modifyAttribute('physical', 'energy', 5);
    }
    
    // Apply life stage modifiers
    const lifeStage = this.timeSystem.currentLifeStage.name;
    const modifiers = this.lifeStageModifiers[lifeStage];
    
    if (modifiers) {
      for (const category in modifiers) {
        for (const attribute in modifiers[category]) {
          const dailyChange = modifiers[category][attribute] / 365; // Yearly change divided by days
          this.modifyAttribute(category, attribute, dailyChange);
        }
      }
    }
    
    // Random small fluctuations in emotional state
    this.modifyAttribute('emotional', 'happiness', (Math.random() * 2 - 1));
    this.modifyAttribute('emotional', 'stress', (Math.random() * 2 - 1));
  }
  
  /**
   * Update attributes when character has a birthday
   * @param {number} age - New age of the character
   */
  updateAttributesOnBirthday(age) {
    console.log(`Character birthday: ${age} years old`);
    
    // Wisdom naturally increases with age
    this.modifyAttribute('mental', 'wisdom', 1);
    
    // Health and energy decline in later years
    if (age > 60) {
      this.modifyAttribute('physical', 'health', -1);
      this.modifyAttribute('physical', 'energy', -1);
    }
    
    // Happiness boost on birthday
    this.modifyAttribute('emotional', 'happiness', 5);
    
    // Self-esteem changes based on life achievements
    // This would be more complex in a full implementation
    if (this.attributes.practical.career > 50 || this.attributes.social.reputation > 70) {
      this.modifyAttribute('emotional', 'selfEsteem', 2);
    }
  }
  
  /**
   * Apply changes when transitioning between life stages
   * @param {Object} previousStage - Previous life stage
   * @param {Object} newStage - New life stage
   */
  applyLifeStageTransition(previousStage, newStage) {
    console.log(`Life stage transition: ${previousStage?.name || 'None'} -> ${newStage.name}`);
    
    // Apply significant changes based on the new life stage
    switch (newStage.name) {
      case "Childhood":
        // Transition from early childhood to childhood
        this.modifyAttribute('mental', 'intelligence', 5);
        this.modifyAttribute('social', 'charisma', 5);
        break;
        
      case "Adolescence":
        // Transition from childhood to adolescence
        this.modifyAttribute('physical', 'appearance', 10);
        this.modifyAttribute('emotional', 'stress', 10);
        this.modifyAttribute('emotional', 'selfEsteem', -5); // Often decreases during adolescence
        break;
        
      case "Young Adult":
        // Transition from adolescence to young adulthood
        this.modifyAttribute('practical', 'wealth', 10);
        this.modifyAttribute('practical', 'career', 10);
        this.modifyAttribute('emotional', 'selfEsteem', 10);
        break;
        
      case "Middle Age":
        // Transition from young adult to middle age
        this.modifyAttribute('mental', 'wisdom', 15);
        this.modifyAttribute('practical', 'wealth', 20);
        this.modifyAttribute('physical', 'energy', -10);
        break;
        
      case "Elderly":
        // Transition from middle age to elderly
        this.modifyAttribute('physical', 'health', -15);
        this.modifyAttribute('physical', 'energy', -15);
        this.modifyAttribute('mental', 'wisdom', 20);
        this.modifyAttribute('social', 'empathy', 10);
        break;
    }
  }
  
  /**
   * Modify an attribute value
   * @param {string} category - Attribute category
   * @param {string} attribute - Attribute name
   * @param {number} amount - Amount to modify (positive or negative)
   * @returns {number} New attribute value
   */
  modifyAttribute(category, attribute, amount) {
    // Handle special case for skills
    if (category === 'skills' || (category === 'practical' && attribute === 'skills')) {
      return this.modifySkill(amount);
    }
    
    // Ensure the category and attribute exist
    if (!this.attributes[category] || this.attributes[category][attribute] === undefined) {
      console.error(`Invalid attribute: ${category}.${attribute}`);
      return null;
    }
    
    // Update the attribute value, keeping it within limits
    this.attributes[category][attribute] += amount;
    this.attributes[category][attribute] = Math.max(
      this.minValue, 
      Math.min(this.maxValue, this.attributes[category][attribute])
    );
    
    return this.attributes[category][attribute];
  }
  
  /**
   * Modify a specific skill
   * @param {string} skill - Skill name
   * @param {number} amount - Amount to modify
   * @returns {number} New skill value
   */
  modifySkill(skill, amount) {
    // Ensure the skill exists
    if (this.attributes.practical.skills[skill] === undefined) {
      console.error(`Invalid skill: ${skill}`);
      return null;
    }
    
    // Update the skill value, keeping it within limits
    this.attributes.practical.skills[skill] += amount;
    this.attributes.practical.skills[skill] = Math.max(
      this.minValue, 
      Math.min(this.maxValue, this.attributes.practical.skills[skill])
    );
    
    return this.attributes.practical.skills[skill];
  }
  
  /**
   * Apply effects of an activity
   * @param {string} activity - Activity name
   * @param {number} duration - Duration in hours
   * @param {number} effort - Effort level (0-1)
   * @returns {Object} Changes applied to attributes
   */
  performActivity(activity, duration = 1, effort = 1) {
    const effects = this.activityEffects[activity];
    if (!effects) {
      console.error(`Invalid activity: ${activity}`);
      return null;
    }
    
    const changes = {};
    
    // Apply effects based on duration and effort
    for (const category in effects) {
      changes[category] = {};
      
      for (const attribute in effects[category]) {
        const change = effects[category][attribute] * duration * effort;
        this.modifyAttribute(category, attribute, change);
        changes[category][attribute] = change;
      }
    }
    
    // Check if energy is too low
    if (this.attributes.physical.energy < 10) {
      // Apply fatigue effects
      this.modifyAttribute('emotional', 'happiness', -5);
      this.modifyAttribute('emotional', 'stress', 5);
      this.modifyAttribute('physical', 'health', -1);
      
      console.log("Character is experiencing fatigue due to low energy");
    }
    
    return changes;
  }
  
  /**
   * Get the current value of an attribute
   * @param {string} category - Attribute category
   * @param {string} attribute - Attribute name
   * @returns {number} Current attribute value
   */
  getAttribute(category, attribute) {
    // Handle special case for skills
    if (category === 'skills') {
      return this.getSkill(attribute);
    }
    
    // Ensure the category and attribute exist
    if (!this.attributes[category] || this.attributes[category][attribute] === undefined) {
      console.error(`Invalid attribute: ${category}.${attribute}`);
      return null;
    }
    
    return this.attributes[category][attribute];
  }
  
  /**
   * Get the current value of a skill
   * @param {string} skill - Skill name
   * @returns {number} Current skill value
   */
  getSkill(skill) {
    if (this.attributes.practical.skills[skill] === undefined) {
      console.error(`Invalid skill: ${skill}`);
      return null;
    }
    
    return this.attributes.practical.skills[skill];
  }
  
  /**
   * Get all attributes in a category
   * @param {string} category - Attribute category
   * @returns {Object} All attributes in the category
   */
  getCategoryAttributes(category) {
    if (!this.attributes[category]) {
      console.error(`Invalid category: ${category}`);
      return null;
    }
    
    return { ...this.attributes[category] };
  }
  
  /**
   * Get all skills in a category
   * @param {string} category - Skill category
   * @returns {Object} All skills in the category with their values
   */
  getCategorySkills(category) {
    if (!this.skillCategories[category]) {
      console.error(`Invalid skill category: ${category}`);
      return null;
    }
    
    const skills = {};
    for (const skill of this.skillCategories[category]) {
      skills[skill] = this.attributes.practical.skills[skill];
    }
    
    return skills;
  }
  
  /**
   * Get the overall state of the character
   * @returns {Object} Complete character state
   */
  getState() {
    return {
      attributes: { ...this.attributes },
      age: this.timeSystem.characterAge,
      lifeStage: this.timeSystem.currentLifeStage.name
    };
  }
  
  /**
   * Save the character state
   * @returns {Object} Serializable character state
   */
  saveState() {
    return JSON.stringify(this.getState());
  }
  
  /**
   * Load a saved ch
(Content truncated due to size limit. Use line ranges to read in chunks)
