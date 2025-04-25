// choices_system.js - Choice and consequence system for LifeSim Chain

/**
 * ChoicesSystem - Manages player choices and their consequences
 * 
 * This system handles:
 * - Different types of choices (daily, life, moral, generational)
 * - Consequences of choices on character statistics
 * - Short and long-term effects of decisions
 * - Memory of past choices and their impact on future options
 */
class ChoicesSystem {
  constructor(timeSystem, characterStats) {
    // References to other game systems
    this.timeSystem = timeSystem;
    this.characterStats = characterStats;
    
    // Choice history
    this.choiceHistory = [];
    
    // Active choices
    this.activeChoices = [];
    
    // Choice categories
    this.choiceCategories = {
      DAILY: "daily",         // Routine decisions (what to eat, how to spend free time)
      LIFE: "life",           // Major life decisions (career, relationships, moving)
      MORAL: "moral",         // Ethical dilemmas with no clear right/wrong answer
      GENERATIONAL: "generational" // Decisions affecting future generations
    };
    
    // Event listeners for time-based choices
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for time-based choices
   */
  setupEventListeners() {
    // Daily choices
    this.timeSystem.addEventListener('dayPassed', (event) => {
      this.generateDailyChoices();
    });
    
    // Life stage transition choices
    this.timeSystem.addEventListener('lifeStagePassed', (event) => {
      this.generateLifeStageChoices(event.previousStage, event.newStage);
    });
    
    // Birthday special choices
    this.timeSystem.addEventListener('characterBirthday', (event) => {
      this.generateBirthdayChoices(event.age);
    });
  }
  
  /**
   * Generate daily choices based on character state
   */
  generateDailyChoices() {
    // Clear previous daily choices
    this.activeChoices = this.activeChoices.filter(choice => choice.category !== this.choiceCategories.DAILY);
    
    // Get character state
    const characterState = this.characterStats.getState();
    const lifeStage = this.timeSystem.currentLifeStage.name;
    
    // Generate choices based on life stage and character state
    let newChoices = [];
    
    // Free time choice - present every day
    newChoices.push(this.createFreeTimeChoice(characterState));
    
    // Add specific choices based on character needs
    if (characterState.attributes.physical.energy < 30) {
      newChoices.push(this.createRestChoice());
    }
    
    if (characterState.attributes.emotional.stress > 70) {
      newChoices.push(this.createStressReliefChoice());
    }
    
    if (characterState.attributes.social.charisma < 30) {
      newChoices.push(this.createSocialSkillChoice());
    }
    
    // Add life stage specific daily choices
    switch (lifeStage) {
      case "Early Childhood":
        newChoices.push(this.createEarlyChildhoodChoice());
        break;
      case "Childhood":
        newChoices.push(this.createChildhoodChoice());
        break;
      case "Adolescence":
        newChoices.push(this.createAdolescenceChoice());
        break;
      case "Young Adult":
        newChoices.push(this.createYoungAdultChoice());
        break;
      case "Middle Age":
        newChoices.push(this.createMiddleAgeChoice());
        break;
      case "Elderly":
        newChoices.push(this.createElderlyChoice());
        break;
    }
    
    // Add new choices to active choices
    this.activeChoices = [...this.activeChoices, ...newChoices];
  }
  
  /**
   * Generate choices specific to life stage transitions
   * @param {Object} previousStage - Previous life stage
   * @param {Object} newStage - New life stage
   */
  generateLifeStageChoices(previousStage, newStage) {
    // Create a significant life choice based on the new life stage
    let lifeChoice;
    
    switch (newStage.name) {
      case "Childhood":
        lifeChoice = {
          id: `life_stage_${Date.now()}`,
          title: "First Day of School",
          description: "It's your first day of school. How do you approach it?",
          category: this.choiceCategories.LIFE,
          expiration: this.timeSystem.currentGameTime + (this.timeSystem.day * 7), // Expires in 7 days
          options: [
            {
              id: "school_excited",
              text: "Show excitement and try to make friends",
              consequences: {
                social: { charisma: 5, empathy: 3 },
                emotional: { happiness: 5, stress: 5 }
              }
            },
            {
              id: "school_shy",
              text: "Stay quiet and observe others",
              consequences: {
                mental: { intelligence: 3, wisdom: 2 },
                emotional: { stress: -3 }
              }
            },
            {
              id: "school_rebel",
              text: "Be rebellious and test boundaries",
              consequences: {
                social: { charisma: 2, reputation: -5 },
                emotional: { selfEsteem: 3, stress: 8 }
              }
            }
          ]
        };
        break;
        
      case "Adolescence":
        lifeChoice = {
          id: `life_stage_${Date.now()}`,
          title: "Teenage Identity",
          description: "As you enter your teenage years, you begin to form your own identity. What aspects do you focus on?",
          category: this.choiceCategories.LIFE,
          expiration: this.timeSystem.currentGameTime + (this.timeSystem.day * 14), // Expires in 14 days
          options: [
            {
              id: "teen_academic",
              text: "Focus on academic achievement",
              consequences: {
                mental: { intelligence: 10, wisdom: 5 },
                social: { charisma: -3 },
                practical: { skills: { mathematics: 5, science: 5 } }
              }
            },
            {
              id: "teen_social",
              text: "Prioritize social life and popularity",
              consequences: {
                social: { charisma: 10, reputation: 8 },
                mental: { intelligence: -3 },
                emotional: { selfEsteem: 5, stress: 5 }
              }
            },
            {
              id: "teen_creative",
              text: "Develop creative and artistic talents",
              consequences: {
                mental: { creativity: 10 },
                emotional: { happiness: 5, selfEsteem: 5 },
                practical: { skills: { music: 5, writing: 5 } }
              }
            },
            {
              id: "teen_athletic",
              text: "Commit to sports and physical development",
              consequences: {
                physical: { health: 10, energy: 5, appearance: 5 },
                social: { charisma: 5 },
                practical: { skills: { strength: 5, endurance: 5 } }
              }
            }
          ]
        };
        break;
        
      case "Young Adult":
        lifeChoice = {
          id: `life_stage_${Date.now()}`,
          title: "Life Path",
          description: "As you enter adulthood, you must choose a path for your future.",
          category: this.choiceCategories.LIFE,
          expiration: this.timeSystem.currentGameTime + (this.timeSystem.day * 30), // Expires in 30 days
          options: [
            {
              id: "adult_higher_education",
              text: "Pursue higher education",
              consequences: {
                mental: { intelligence: 15, wisdom: 10 },
                practical: { wealth: -20, career: 10 },
                emotional: { stress: 10 }
              }
            },
            {
              id: "adult_career",
              text: "Start working immediately",
              consequences: {
                practical: { wealth: 15, career: 5 },
                mental: { wisdom: 5 },
                social: { reputation: 5 }
              }
            },
            {
              id: "adult_entrepreneur",
              text: "Start your own business",
              consequences: {
                practical: { wealth: -10, career: 0 }, // Initial investment
                mental: { creativity: 10, intelligence: 5 },
                emotional: { stress: 15, selfEsteem: 5 }
              },
              futureEffects: {
                // These would be applied later based on success/failure
                success: {
                  practical: { wealth: 50, career: 20 },
                  social: { reputation: 15 }
                },
                failure: {
                  practical: { wealth: -20 },
                  emotional: { selfEsteem: -10, stress: 10 }
                }
              }
            },
            {
              id: "adult_travel",
              text: "Travel and explore the world",
              consequences: {
                mental: { wisdom: 15, creativity: 10 },
                social: { charisma: 10, empathy: 10 },
                practical: { wealth: -15 },
                emotional: { happiness: 15 }
              }
            }
          ]
        };
        break;
        
      case "Middle Age":
        lifeChoice = {
          id: `life_stage_${Date.now()}`,
          title: "Mid-Life Reflection",
          description: "You've reached middle age and find yourself reflecting on your life so far. How do you want to approach the next phase?",
          category: this.choiceCategories.LIFE,
          expiration: this.timeSystem.currentGameTime + (this.timeSystem.day * 30), // Expires in 30 days
          options: [
            {
              id: "midlife_career",
              text: "Double down on career advancement",
              consequences: {
                practical: { career: 15, wealth: 20 },
                emotional: { stress: 15 },
                social: { reputation: 10 }
              }
            },
            {
              id: "midlife_family",
              text: "Focus on family and relationships",
              consequences: {
                emotional: { happiness: 15, stress: -10 },
                social: { empathy: 10 },
                practical: { career: -5, wealth: -5 }
              }
            },
            {
              id: "midlife_reinvention",
              text: "Reinvent yourself with a new direction",
              consequences: {
                mental: { creativity: 15, wisdom: 10 },
                emotional: { selfEsteem: 10, stress: 10 },
                practical: { career: -10, wealth: -10 }
              },
              futureEffects: {
                // Applied later based on success
                success: {
                  practical: { career: 20, wealth: 15 },
                  emotional: { happiness: 15 }
                }
              }
            },
            {
              id: "midlife_community",
              text: "Give back to your community",
              consequences: {
                social: { reputation: 15, empathy: 15 },
                emotional: { happiness: 10, selfEsteem: 10 },
                practical: { wealth: -5 }
              }
            }
          ]
        };
        break;
        
      case "Elderly":
        lifeChoice = {
          id: `life_stage_${Date.now()}`,
          title: "Legacy Planning",
          description: "As you enter your golden years, you consider what legacy you want to leave behind.",
          category: this.choiceCategories.GENERATIONAL,
          expiration: this.timeSystem.currentGameTime + (this.timeSystem.day * 60), // Expires in 60 days
          options: [
            {
              id: "legacy_wealth",
              text: "Focus on building financial wealth for heirs",
              consequences: {
                practical: { wealth: 10 },
                emotional: { stress: 5 },
                social: { empathy: -5 }
              },
              generationalEffects: {
                wealth: 50,
                values: { materialism: 10, ambition: 5 }
              }
            },
            {
              id: "legacy_knowledge",
              text: "Document and share your wisdom and knowledge",
              consequences: {
                mental: { wisdom: 10 },
                social: { reputation: 10 },
                emotional: { selfEsteem: 10 }
              },
              generationalEffects: {
                intelligence: 15,
                wisdom: 20,
                values: { education: 10, curiosity: 10 }
              }
            },
            {
              id: "legacy_community",
              text: "Establish a foundation or community project",
              consequences: {
                social: { reputation: 15, empathy: 10 },
                practical: { wealth: -20 },
                emotional: { happiness: 15 }
              },
              generationalEffects: {
                reputation: 20,
                values: { altruism: 15, community: 10 }
              }
            },
            {
              id: "legacy_family",
              text: "Strengthen family bonds and traditions",
              consequences: {
                emotional: { happiness: 15 },
                social: { empathy: 10 },
                mental: { wisdom: 5 }
              },
              generationalEffects: {
                family_bonds: 25,
                values: { tradition: 15, loyalty: 10 }
              }
            }
          ]
        };
        break;
        
      default:
        // No specific life stage choice
        return;
    }
    
    // Add the life choice to active choices
    if (lifeChoice) {
      this.activeChoices.push(lifeChoice);
    }
  }
  
  /**
   * Generate special choices for character birthdays
   * @param {number} age - New age of the character
   */
  generateBirthdayChoices(age) {
    // Create birthday-specific choices based on age
    let birthdayChoice;
    
    // Key milestone ages
    if (age === 18) {
      birthdayChoice = {
        id: `birthday_${Date.now()}`,
        title: "Coming of Age",
        description: "You're now legally an adult. How do you want to celebrate this milestone?",
        category: this.choiceCategories.LIFE,
        expiration: this.timeSystem.currentGameTime + (this.timeSystem.day * 3), // Expires in 3 days
        options: [
          {
            id: "birthday_18_party",
            text: "Have a big party with friends",
            consequences: {
              social: { charisma: 5, reputation: 3 },
              emotional: { happiness: 10, stress: 5 },
              practical: { wealth: -5 }
            }
          },
          {
            id: "birthday_18_family",
            text: "Have a meaningful celebration with family",
            consequences: {
              emotional: { happiness: 8, selfEsteem: 3 },
              social: { empathy: 5 }
            }
          },
          {
            id: "birthday_18_reflect",
            text: "Spend time alone reflecting on your future",
            consequences: {
              mental: { wisdom: 5, intelligence: 3 },
              emotional: { selfEsteem: 5 }
            }
          }
        ]
      };
    } else if (age === 30) {
      birthdayChoice = {
        id: `birthday_${Date.now()}`,
        title: "Thirty Years",
        description: "You've reached 30 years of age. How do you feel about this milestone?",
        category: this.choiceCategories.LIFE,
        expiration: this.timeSystem.currentGameTime + (this.timeSystem.day * 3), // Expires in 3 days
        options: [
          {
            id: "birthday_30_celebrate",
            text: "Celebrate your achievements so far",
            consequences: {
              emotional: { happiness: 10, selfEsteem: 5 },
              social: { charisma: 3 }
            }
          },
          {
            id: "birthday_30_anxiety",
            text: "Feel anxiety about unfulfilled goals",
            consequences: {
 
(Content truncated due to size limit. Use line ranges to read in chunks)