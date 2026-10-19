/**
 * USER PROFILE - Personal Facts Memory
 *
 * Stores ~60 personal facts about the user that Phoenix remembers forever.
 * Loaded into every conversation so Phoenix truly knows the user.
 */

const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // ============================================
  // PERSONAL INFO (8 fields)
  // ============================================
  personalInfo: {
    birthday: String,           // "06-15" or "1990-06-15"
    age: Number,
    zodiac: String,
    hometown: String,
    currentCity: String,
    phoneNumber: String,
    email: String,
    gender: String
  },

  // ============================================
  // FAVORITES (15 fields - arrays for multiple values)
  // ============================================
  favorites: {
    colors: [String],
    books: [String],
    movies: [String],
    tvShows: [String],
    songs: [String],
    artists: [String],
    bands: [String],
    foods: [String],
    restaurants: [String],
    drinks: [String],
    coffeeOrders: [String],
    sports: [String],
    teams: [String],
    athletes: [String],
    hobbies: [String]
  },

  // ============================================
  // PEOPLE (10 fields)
  // ============================================
  people: {
    spouseName: String,
    spouseAnniversary: String,  // "MM-DD"
    kids: [String],              // Array of names
    parents: [String],
    siblings: [String],
    bestFriend: String,
    pets: [{
      name: String,
      type: String,              // dog, cat, bird, etc.
      breed: String,
      birthday: String
    }]
  },

  // ============================================
  // WORK/CAREER (9 fields)
  // ============================================
  work: {
    jobTitle: String,
    company: String,
    industry: String,
    careerGoals: [String],      // Multiple career goals
    college: String,
    degree: String,
    major: String,
    graduationYear: Number
  },

  // ============================================
  // HEALTH/FITNESS (9 fields)
  // ============================================
  health: {
    height: String,             // "6'2\""
    weight: Number,
    bloodType: String,
    allergies: [String],
    dietType: String,           // vegan, vegetarian, keto, etc.
    workoutPreference: String,  // lifting, running, yoga, etc.
    workoutTime: String,        // "morning", "evening"
    fitnessGoals: [String]      // Multiple fitness goals
  },

  // ============================================
  // LIFESTYLE (8 fields)
  // ============================================
  lifestyle: {
    morningPerson: Boolean,     // true = morning, false = night
    wakeUpTime: String,         // "6:00 AM"
    bedTime: String,
    sleepHours: Number,
    clothingSize: String,
    shoeSize: String,
    favoriteStore: String,
    style: String               // casual, formal, streetwear, etc.
  },

  // ============================================
  // CUSTOM FACTS (unlimited)
  // ============================================
  // For anything that doesn't fit above
  customFacts: {
    type: Map,
    of: String,
    default: {}
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

// Indexes
userProfileSchema.index({ userId: 1 });

// ============================================
// METHODS
// ============================================

/**
 * Update a single fact
 * @param {String} category - personalInfo, favorites, people, work, health, lifestyle
 * @param {String} field - specific field name
 * @param {Any} value - value to set (for arrays, appends; for single values, replaces)
 */
userProfileSchema.methods.updateFact = function(category, field, value) {
  if (category === 'custom') {
    if (!this.customFacts) this.customFacts = new Map();
    this.customFacts.set(field, value);
  } else if (this[category]) {
    const currentValue = this[category][field];

    // If field is an array, append (avoid duplicates)
    if (Array.isArray(currentValue)) {
      if (!currentValue.includes(value)) {
        this[category][field].push(value);
      }
    } else {
      // Single value, just replace
      this[category][field] = value;
    }
  }
  this.lastUpdated = new Date();
  return this.save();
};

/**
 * Get a single fact
 */
userProfileSchema.methods.getFact = function(category, field) {
  if (category === 'custom') {
    return this.customFacts ? this.customFacts.get(field) : null;
  }
  return this[category] ? this[category][field] : null;
};

/**
 * Get all facts as formatted string for AI prompt
 */
userProfileSchema.methods.toPromptString = function() {
  const facts = [];

  // Personal Info
  if (this.personalInfo) {
    if (this.personalInfo.birthday) facts.push(`Birthday: ${this.personalInfo.birthday}`);
    if (this.personalInfo.age) facts.push(`Age: ${this.personalInfo.age}`);
    if (this.personalInfo.zodiac) facts.push(`Zodiac: ${this.personalInfo.zodiac}`);
    if (this.personalInfo.hometown) facts.push(`Hometown: ${this.personalInfo.hometown}`);
    if (this.personalInfo.currentCity) facts.push(`Lives in: ${this.personalInfo.currentCity}`);
  }

  // Favorites (now arrays)
  if (this.favorites) {
    if (this.favorites.colors && this.favorites.colors.length > 0) {
      facts.push(`Favorite Colors: ${this.favorites.colors.join(', ')}`);
    }
    if (this.favorites.books && this.favorites.books.length > 0) {
      facts.push(`Favorite Books: ${this.favorites.books.join(', ')}`);
    }
    if (this.favorites.movies && this.favorites.movies.length > 0) {
      facts.push(`Favorite Movies: ${this.favorites.movies.join(', ')}`);
    }
    if (this.favorites.foods && this.favorites.foods.length > 0) {
      facts.push(`Favorite Foods: ${this.favorites.foods.join(', ')}`);
    }
    if (this.favorites.coffeeOrders && this.favorites.coffeeOrders.length > 0) {
      facts.push(`Coffee Orders: ${this.favorites.coffeeOrders.join(', ')}`);
    }
    if (this.favorites.sports && this.favorites.sports.length > 0) {
      facts.push(`Favorite Sports: ${this.favorites.sports.join(', ')}`);
    }
    if (this.favorites.teams && this.favorites.teams.length > 0) {
      facts.push(`Favorite Teams: ${this.favorites.teams.join(', ')}`);
    }
    if (this.favorites.hobbies && this.favorites.hobbies.length > 0) {
      facts.push(`Hobbies: ${this.favorites.hobbies.join(', ')}`);
    }
  }

  // People
  if (this.people) {
    if (this.people.spouseName) facts.push(`Spouse: ${this.people.spouseName}`);
    if (this.people.kids && this.people.kids.length > 0) facts.push(`Kids: ${this.people.kids.join(', ')}`);
    if (this.people.pets && this.people.pets.length > 0) {
      this.people.pets.forEach(pet => {
        facts.push(`Pet: ${pet.name} (${pet.type}${pet.breed ? ', ' + pet.breed : ''})`);
      });
    }
  }

  // Work
  if (this.work) {
    if (this.work.jobTitle) facts.push(`Job: ${this.work.jobTitle}`);
    if (this.work.company) facts.push(`Company: ${this.work.company}`);
    if (this.work.careerGoals && this.work.careerGoals.length > 0) {
      facts.push(`Career Goals: ${this.work.careerGoals.join(', ')}`);
    }
  }

  // Health/Fitness
  if (this.health) {
    if (this.health.fitnessGoals && this.health.fitnessGoals.length > 0) {
      facts.push(`Fitness Goals: ${this.health.fitnessGoals.join(', ')}`);
    }
    if (this.health.dietType) facts.push(`Diet: ${this.health.dietType}`);
    if (this.health.allergies && this.health.allergies.length > 0) {
      facts.push(`Allergies: ${this.health.allergies.join(', ')}`);
    }
  }

  // Lifestyle
  if (this.lifestyle) {
    if (this.lifestyle.morningPerson !== undefined) {
      facts.push(`${this.lifestyle.morningPerson ? 'Morning' : 'Night'} Person`);
    }
    if (this.lifestyle.wakeUpTime) facts.push(`Wakes up: ${this.lifestyle.wakeUpTime}`);
  }

  // Custom Facts
  if (this.customFacts && this.customFacts.size > 0) {
    this.customFacts.forEach((value, key) => {
      facts.push(`${key}: ${value}`);
    });
  }

  return facts.join(' | ');
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get or create profile for user
 */
userProfileSchema.statics.getOrCreateForUser = async function(userId) {
  let profile = await this.findOne({ userId });

  if (!profile) {
    profile = new this({
      userId,
      personalInfo: {},
      favorites: {},
      people: {},
      work: {},
      health: {},
      lifestyle: {},
      customFacts: new Map()
    });
    await profile.save();
  }

  return profile;
};

module.exports = mongoose.model('UserProfile', userProfileSchema);
