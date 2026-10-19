/**
 * 10K PERSONA GENERATOR
 *
 * Generates 10,000 diverse personas across all demographics, life stages, and conditions.
 * Goal: Cover "almost every existing condition" with realistic distribution.
 */

const PERSONA_TEMPLATES = {
  // Age distribution (10,000 total)
  teenagers: { count: 800, ageRange: [14, 17], conditions: ['anxiety', 'adhd', 'athlete', 'student'] },
  college: { count: 1200, ageRange: [18, 22], conditions: ['anxiety', 'depression', 'athlete', 'student', 'party_lifestyle'] },
  young_professional: { count: 2000, ageRange: [23, 30], conditions: ['anxiety', 'athlete', 'single', 'career_stress'] },
  established_professional: { count: 2500, ageRange: [31, 45], conditions: ['hypertension', 'diabetes', 'married', 'parent', 'career_stress'] },
  midlife: { count: 2000, ageRange: [46, 60], conditions: ['hypertension', 'diabetes', 'arthritis', 'married', 'parent'] },
  senior: { count: 1500, ageRange: [61, 75], conditions: ['hypertension', 'diabetes', 'arthritis', 'heart_disease', 'retired'] }
};

const CONDITIONS = {
  // Mental health
  anxiety: { prevalence: 0.18, impact: { hrv: -12, sleep: -10, stress: +25 } },
  depression: { prevalence: 0.10, impact: { activity: -30, sleep: 'variable', mood: -40 } },
  adhd: { prevalence: 0.08, impact: { consistency: -20, focus: -30 } },

  // Physical health
  diabetes: { prevalence: 0.11, impact: { recovery: -15, energy: -20 } },
  hypertension: { prevalence: 0.33, impact: { hrv: -10, rhr: +5 } },
  heart_disease: { prevalence: 0.06, impact: { hrv: -20, recovery: -25 } },
  asthma: { prevalence: 0.08, impact: { exercise_tolerance: -15 } },
  arthritis: { prevalence: 0.24, impact: { activity: -20, pain: +30 } },
  autoimmune: { prevalence: 0.08, impact: { recovery: -20, energy: -25 } },
  chronic_pain: { prevalence: 0.20, impact: { sleep: -15, activity: -25, mood: -20 } },

  // Athletic
  athlete: { prevalence: 0.15, impact: { activity: +40, recovery: +10 } },
  recovering_from_injury: { prevalence: 0.12, impact: { activity: -40, mood: -15 } },

  // Lifestyle
  shift_worker: { prevalence: 0.22, impact: { sleep: -25, circadian: -40 } },
  remote_worker: { prevalence: 0.35, impact: { activity: -10, routine: 'flexible' } },
  entrepreneur: { prevalence: 0.05, impact: { stress: +30, sleep: -15, work_hours: +40 } },
  student: { prevalence: 1.0, impact: { stress: +20, sleep: -10 } },
  unemployed: { prevalence: 0.05, impact: { stress: +25, mood: -20, routine: -30 } },
  retired: { prevalence: 1.0, impact: { activity: -15, stress: -20 } },

  // Social
  single: { prevalence: 0.35, impact: {} },
  married: { prevalence: 0.50, impact: { routine: +15 } },
  divorced: { prevalence: 0.15, impact: { stress: +20, mood: -10 } },
  parent: { prevalence: 0.40, impact: { sleep: -10, stress: +15 } },

  // Substance
  caffeine_dependent: { prevalence: 0.65, impact: { sleep: -8, energy_variability: +15 } },
  smoker: { prevalence: 0.14, impact: { hrv: -15, recovery: -20 } },
  recovering_alcoholic: { prevalence: 0.03, impact: { sleep: +10, recovery: +15 } }
};

class PersonaGenerator {
  constructor() {
    this.generatedPersonas = [];
  }

  /**
   * Generate all 10,000 personas
   */
  async generateAll10K() {
    

    const personas = [];
    let personaId = 1;

    for (const [ageGroup, config] of Object.entries(PERSONA_TEMPLATES)) {
      

      for (let i = 0; i < config.count; i++) {
        const persona = this.generateSinglePersona(personaId, ageGroup, config);
        personas.push(persona);
        personaId++;
      }
    }

    this.generatedPersonas = personas;
    

    return personas;
  }

  /**
   * Generate a single persona
   */
  generateSinglePersona(id, ageGroup, config) {
    const age = this.randomAge(config.ageRange);
    const gender = Math.random() < 0.51 ? 'F' : 'M';

    // Assign conditions based on prevalence
    const conditions = this.assignConditions(age, gender, config.conditions);

    // Generate baseline metrics
    const baseline = this.generateBaselineMetrics(age, gender, conditions);

    // Generate persona profile
    const persona = {
      personaId: `persona_${id.toString().padStart(5, '0')}`,
      age,
      gender,
      ageGroup,
      conditions,

      // Demographics
      occupation: this.assignOccupation(age, conditions),
      location: this.randomLocation(),

      // Baseline physiological metrics
      baseline: {
        hrv: baseline.hrv,
        restingHeartRate: baseline.rhr,
        sleepDuration: baseline.sleep,
        recoveryScore: baseline.recovery,
        steps: baseline.steps,
        activeMinutes: baseline.activity,
        caloriesBurned: baseline.calories
      },

      // Behavioral patterns
      patterns: {
        workoutFrequency: this.getWorkoutFrequency(age, conditions),
        sleepConsistency: this.getSleepConsistency(conditions),
        stressLevel: this.getBaselineStress(conditions),
        socialActivity: this.getSocialActivity(age, conditions)
      },

      // Training metadata
      simulationMetadata: {
        expectedPatterns: [],  // Will be populated by life events
        generatedAt: new Date()
      }
    };

    return persona;
  }

  /**
   * Generate age within range
   */
  randomAge(range) {
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  }

  /**
   * Assign conditions based on prevalence
   */
  assignConditions(age, gender, baseConditions) {
    const assigned = [...baseConditions];

    // Add additional conditions based on prevalence
    for (const [condition, config] of Object.entries(CONDITIONS)) {
      if (assigned.includes(condition)) continue;

      // Age-adjusted prevalence
      let prevalence = config.prevalence;

      if (condition === 'diabetes' && age > 45) prevalence *= 2;
      if (condition === 'hypertension' && age > 50) prevalence *= 2.5;
      if (condition === 'anxiety' && age < 35) prevalence *= 1.5;
      if (condition === 'arthritis' && age > 55) prevalence *= 3;

      if (Math.random() < prevalence) {
        assigned.push(condition);
      }
    }

    return assigned;
  }

  /**
   * Generate baseline metrics based on age, gender, conditions
   */
  generateBaselineMetrics(age, gender, conditions) {
    // Base values
    let hrv = gender === 'M' ? 55 : 62;
    let rhr = gender === 'M' ? 62 : 65;
    let sleep = 7.5;
    let recovery = 75;
    let steps = 8000;
    let activity = 45;
    let calories = gender === 'M' ? 2500 : 2000;

    // Age adjustments
    if (age < 25) {
      hrv += 10;
      rhr -= 5;
      recovery += 5;
      steps += 2000;
      activity += 15;
    } else if (age > 50) {
      hrv -= 15;
      rhr += 8;
      recovery -= 10;
      steps -= 2000;
      activity -= 15;
    }

    // Condition impacts
    for (const condition of conditions) {
      const impact = CONDITIONS[condition]?.impact || {};

      if (impact.hrv) hrv += impact.hrv;
      if (impact.rhr) rhr += impact.rhr;
      if (impact.sleep) sleep += (impact.sleep / 100) * sleep;
      if (impact.recovery) recovery += impact.recovery;
      if (impact.activity) activity += impact.activity;
    }

    // Add natural variation (±10%)
    hrv = Math.max(30, Math.round(hrv * (1 + (Math.random() - 0.5) * 0.2)));
    rhr = Math.max(45, Math.round(rhr * (1 + (Math.random() - 0.5) * 0.2)));
    sleep = Math.max(5, Math.round(sleep * (1 + (Math.random() - 0.5) * 0.2) * 60) / 60);
    recovery = Math.max(30, Math.min(95, Math.round(recovery * (1 + (Math.random() - 0.5) * 0.2))));

    return { hrv, rhr, sleep, recovery, steps, activity, calories };
  }

  /**
   * Assign occupation based on age and conditions
   */
  assignOccupation(age, conditions) {
    if (age < 18) return 'High School Student';
    if (age <= 22) return 'College Student';
    if (age > 65 || conditions.includes('retired')) return 'Retired';
    if (conditions.includes('unemployed')) return 'Unemployed';
    if (conditions.includes('student')) return 'Graduate Student';

    const occupations = [
      'Software Engineer', 'Teacher', 'Nurse', 'Sales Manager',
      'Marketing Specialist', 'Accountant', 'Designer', 'Analyst',
      'Manager', 'Consultant', 'Attorney', 'Doctor', 'Engineer',
      'Retail Manager', 'Customer Service', 'Operations Manager',
      'HR Specialist', 'Financial Advisor', 'Real Estate Agent'
    ];

    return occupations[Math.floor(Math.random() * occupations.length)];
  }

  /**
   * Random US location
   */
  randomLocation() {
    const cities = [
      'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
      'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
      'Dallas, TX', 'Austin, TX', 'San Jose, CA', 'Jacksonville, FL',
      'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC', 'Indianapolis, IN',
      'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Portland, OR'
    ];

    return cities[Math.floor(Math.random() * cities.length)];
  }

  /**
   * Get workout frequency based on profile
   */
  getWorkoutFrequency(age, conditions) {
    if (conditions.includes('athlete')) return 6;
    if (conditions.includes('chronic_pain')) return 2;
    if (conditions.includes('recovering_from_injury')) return 1;
    if (age < 30) return 4;
    if (age > 60) return 3;
    return 3;
  }

  /**
   * Get sleep consistency score
   */
  getSleepConsistency(conditions) {
    if (conditions.includes('shift_worker')) return 40;
    if (conditions.includes('anxiety')) return 55;
    if (conditions.includes('parent')) return 65;
    return 80;
  }

  /**
   * Get baseline stress level
   */
  getBaselineStress(conditions) {
    let stress = 50;

    if (conditions.includes('anxiety')) stress += 20;
    if (conditions.includes('entrepreneur')) stress += 15;
    if (conditions.includes('parent')) stress += 10;
    if (conditions.includes('student')) stress += 10;
    if (conditions.includes('retired')) stress -= 15;

    return Math.max(20, Math.min(80, stress));
  }

  /**
   * Get social activity level
   */
  getSocialActivity(age, conditions) {
    if (age < 25) return 8; // events per month
    if (age > 60) return 4;
    if (conditions.includes('depression')) return 2;
    if (conditions.includes('single')) return 6;
    return 5;
  }
}

module.exports = new PersonaGenerator();
