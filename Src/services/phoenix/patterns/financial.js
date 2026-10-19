// Financial Patterns - 55 patterns covering income, job loss, windfalls, debt, investments, purchases, poverty, wealth, crises
// Pattern IDs: FIN001-FIN055

module.exports = {
  // Income Changes (8 patterns)
  FIN001_MAJOR_RAISE: {
    id: 'FIN001',
    name: 'Major Salary Increase',
    planet: 'Mars',
    category: 'financial',
    description: 'Significant income increase',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 }
    ],
    logic: 'IF (improved_wellbeing) AND (sudden) THEN positive_financial_event',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You seem happier! Good news at work?",
      follow_up_prompts: ["That's amazing! Celebrating?"],
      internal_label: 'Major raise',
      intervention_timing: 'When user mentions money'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN002_INCOME_LOSS: {
    id: 'FIN002',
    name: 'Major Income Loss',
    planet: 'Mars',
    category: 'financial',
    description: 'Job loss or income reduction',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 7 }
    ],
    logic: 'IF (acute_stress) AND (sudden) THEN financial_shock',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You seem stressed. Everything okay financially?",
      follow_up_prompts: ["Job loss is tough. How can I support you?"],
      internal_label: 'Income loss',
      intervention_timing: 'When user mentions job/money'
    },
    urgency: 'high',
    sensitive: true
  },

  FIN003_BONUS_WINDFALL: {
    id: 'FIN003',
    name: 'Financial Windfall',
    planet: 'Mars',
    category: 'financial',
    description: 'Bonus, inheritance, or lottery',
    conditions: [
      { behavior: 'hrv', operator: 'SPIKE', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 3 }
    ],
    logic: 'IF (sudden_euphoria) THEN financial_windfall',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [1, 7],
    silent_guidance: {
      discovery_question: "Something exciting happened! Good news?",
      follow_up_prompts: ["That's wonderful!"],
      internal_label: 'Financial windfall',
      intervention_timing: 'When user mentions money'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN004_COMMISSION_BASED_VOLATILITY: {
    id: 'FIN004',
    name: 'Commission-Based Income Stress',
    planet: 'Mars',
    category: 'financial',
    description: 'Variable income causing stress',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (monthly_volatility) THEN commission_stress',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Your patterns swing monthly. Commission-based work?",
      follow_up_prompts: ["Variable income is stressful. How do you cope?"],
      internal_label: 'Commission volatility',
      intervention_timing: 'Monthly patterns'
    },
    urgency: 'medium',
    sensitive: false
  },

  FIN005_OVERTIME_BURNOUT: {
    id: 'FIN005',
    name: 'Overtime Burnout',
    planet: 'Mars',
    category: 'financial',
    description: 'Working excessive hours for money',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 90, unit: 'minutes', window: 14 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (exhaustion) AND (overwork) THEN overtime_burnout',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're exhausted. Working a lot of overtime?",
      follow_up_prompts: ["Money is important but so is your health."],
      internal_label: 'Overtime burnout',
      intervention_timing: 'When user mentions work'
    },
    urgency: 'high',
    sensitive: false
  },

  FIN006_SIDE_HUSTLE_START: {
    id: 'FIN006',
    name: 'Starting Side Hustle',
    planet: 'Mars',
    category: 'financial',
    description: 'Additional income stream',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 60, unit: 'minutes', window: 14 },
      { behavior: 'activeMinutes', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 14 }
    ],
    logic: 'IF (reduced_sleep) AND (new_activity_pattern) THEN side_hustle',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Busy lately! Starting a side hustle?",
      follow_up_prompts: ["That's ambitious. Don't forget to rest."],
      internal_label: 'Side hustle',
      intervention_timing: 'When user mentions new project'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN007_PAYCHECK_TO_PAYCHECK_STRESS: {
    id: 'FIN007',
    name: 'Paycheck-to-Paycheck Anxiety',
    planet: 'Mars',
    category: 'financial',
    description: 'Financial insecurity stress',
    conditions: [
      { behavior: 'hrv', operator: 'CYCLICAL_DROP', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'CYCLICAL_INCREASE', threshold: 8, unit: 'bpm', window: 14 }
    ],
    logic: 'IF (biweekly_stress_cycle) THEN paycheck_anxiety',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Stress seems to cycle. Waiting for payday?",
      follow_up_prompts: ["Financial stress is real. Want to talk budgeting?"],
      internal_label: 'Paycheck stress',
      intervention_timing: 'Pre-payday patterns'
    },
    urgency: 'medium',
    sensitive: true
  },

  FIN008_RETIREMENT_TRANSITION: {
    id: 'FIN008',
    name: 'Retirement Income Adjustment',
    planet: 'Mars',
    category: 'financial',
    description: 'Adjusting to fixed income',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (retirement_timing) AND (adjustment_stress) THEN income_transition',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "How's retirement treating you financially?",
      follow_up_prompts: ["Fixed income adjustment takes time."],
      internal_label: 'Retirement income',
      intervention_timing: 'Post-retirement'
    },
    urgency: 'medium',
    sensitive: true
  },

  // Debt & Financial Hardship (10 patterns)
  FIN009_CREDIT_CARD_DEBT_SPIRAL: {
    id: 'FIN009',
    name: 'Credit Card Debt Stress',
    planet: 'Mars',
    category: 'financial',
    description: 'Mounting credit card debt',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 22, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 9, unit: 'bpm', window: 30 }
    ],
    logic: 'IF (chronic_stress) AND (worsening) THEN debt_anxiety',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You seem worried. Debt weighing on you?",
      follow_up_prompts: ["Financial stress is real. Have you talked to a credit counselor?"],
      internal_label: 'Credit card debt',
      intervention_timing: 'When user mentions money worries'
    },
    urgency: 'high',
    sensitive: true
  },

  FIN010_STUDENT_LOAN_CRISIS: {
    id: 'FIN010',
    name: 'Student Loan Crisis',
    planet: 'Mars',
    category: 'financial',
    description: 'Student debt overwhelming',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (young_adult) AND (financial_stress) THEN student_debt',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Student loans stressing you out?",
      follow_up_prompts: ["Look into income-driven repayment plans."],
      internal_label: 'Student loan stress',
      intervention_timing: 'When user mentions debt'
    },
    urgency: 'medium',
    sensitive: true
  },

  FIN011_MEDICAL_DEBT: {
    id: 'FIN011',
    name: 'Medical Debt Burden',
    planet: 'Mars',
    category: 'financial',
    description: 'Medical bills causing stress',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 28, unit: 'percent', window: 14 }
    ],
    logic: 'IF (post_medical_event) AND (financial_stress) THEN medical_debt',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [10, 30],
    silent_guidance: {
      discovery_question: "Medical bills piling up?",
      follow_up_prompts: ["Many hospitals have financial assistance. Have you asked?"],
      internal_label: 'Medical debt',
      intervention_timing: 'Post-medical event'
    },
    urgency: 'high',
    sensitive: true
  },

  FIN012_BANKRUPTCY_CONSIDERATION: {
    id: 'FIN012',
    name: 'Bankruptcy Consideration',
    planet: 'Mars',
    category: 'financial',
    description: 'Extreme financial distress',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_LOW', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'EXTREME_LOW', threshold: 35, unit: 'percent', window: 21 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 15, unit: 'bpm', window: 21 }
    ],
    logic: 'IF (severe_stress) AND (financial_crisis) THEN bankruptcy_likely',
    confidence_threshold: 0.86,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You're under severe stress. Financial crisis?",
      follow_up_prompts: ["Bankruptcy isn't failure. It's a tool. Talk to a lawyer."],
      internal_label: 'Bankruptcy consideration',
      intervention_timing: 'Immediate support'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN013_DEBT_FREE_ACHIEVEMENT: {
    id: 'FIN013',
    name: 'Becoming Debt-Free',
    planet: 'Mars',
    category: 'financial',
    description: 'Paying off major debt',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (sudden_relief) AND (improved_wellbeing) THEN debt_payoff',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You seem relieved! Paid something off?",
      follow_up_prompts: ["Debt-free is an amazing achievement!"],
      internal_label: 'Debt-free',
      intervention_timing: 'When user mentions money'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN014_COLLECTIONS_HARASSMENT: {
    id: 'FIN014',
    name: 'Collections Harassment Stress',
    planet: 'Mars',
    category: 'financial',
    description: 'Debt collectors causing anxiety',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'SPIKE', threshold: 12, unit: 'bpm', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 }
    ],
    logic: 'IF (phone_related_anxiety) AND (debt_context) THEN collections_stress',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Collectors calling?",
      follow_up_prompts: ["You have rights. Know the FDCPA protections."],
      internal_label: 'Collections harassment',
      intervention_timing: 'When user mentions calls'
    },
    urgency: 'high',
    sensitive: true
  },

  FIN015_MORTGAGE_STRESS: {
    id: 'FIN015',
    name: 'Mortgage Payment Stress',
    planet: 'Mars',
    category: 'financial',
    description: 'Struggling with mortgage',
    conditions: [
      { behavior: 'hrv', operator: 'MONTHLY_DROP', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'MONTHLY_DROP', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (monthly_payment_stress) AND (homeowner) THEN mortgage_burden',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Mortgage payment stressing you out each month?",
      follow_up_prompts: ["Talk to your lender about refinancing or forbearance."],
      internal_label: 'Mortgage stress',
      intervention_timing: 'Monthly cycle'
    },
    urgency: 'high',
    sensitive: true
  },

  FIN016_RENT_INCREASE_SHOCK: {
    id: 'FIN016',
    name: 'Rent Increase Shock',
    planet: 'Mars',
    category: 'financial',
    description: 'Sudden rent increase',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 7 }
    ],
    logic: 'IF (acute_stress) AND (renter) THEN rent_shock',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Landlord raise your rent?",
      follow_up_prompts: ["That's tough. Looking for a new place?"],
      internal_label: 'Rent increase',
      intervention_timing: 'When user mentions rent'
    },
    urgency: 'high',
    sensitive: true
  },

  FIN017_EVICTION_CRISIS: {
    id: 'FIN017',
    name: 'Eviction Crisis',
    planet: 'Mars',
    category: 'financial',
    description: 'Facing eviction',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_LOW', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'EXTREME_LOW', threshold: 40, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'EXTREME_HIGH', threshold: 18, unit: 'bpm', window: 14 }
    ],
    logic: 'IF (extreme_distress) AND (housing_crisis) THEN eviction_likely',
    confidence_threshold: 0.88,
    evidence_required: 3,
    false_positive_rate: 0.11,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're in crisis. Are you losing your home?",
      follow_up_prompts: ["Call 211 for emergency housing assistance."],
      internal_label: 'Eviction crisis',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN018_LOAN_CONSOLIDATION_RELIEF: {
    id: 'FIN018',
    name: 'Debt Consolidation Relief',
    planet: 'Mars',
    category: 'financial',
    description: 'Consolidating debts',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (stress_relief) AND (debt_context) THEN consolidation',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You seem less stressed. Consolidate your debt?",
      follow_up_prompts: ["Smart move!"],
      internal_label: 'Debt consolidation',
      intervention_timing: 'When user mentions finances'
    },
    urgency: 'low',
    sensitive: false
  },

  // Major Purchases (8 patterns)
  FIN019_HOME_PURCHASE: {
    id: 'FIN019',
    name: 'Buying a Home',
    planet: 'Mars',
    category: 'financial',
    description: 'Home purchase process',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 30 }
    ],
    logic: 'IF (sustained_volatility) AND (major_life_event) THEN home_buying',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [21, 60],
    silent_guidance: {
      discovery_question: "Lots of ups and downs! Buying a house?",
      follow_up_prompts: ["That's exciting and stressful!"],
      internal_label: 'Home purchase',
      intervention_timing: 'When user mentions house hunting'
    },
    urgency: 'medium',
    sensitive: false
  },

  FIN020_CAR_PURCHASE: {
    id: 'FIN020',
    name: 'Vehicle Purchase',
    planet: 'Mars',
    category: 'financial',
    description: 'Buying a car',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (short_term_stress) AND (major_purchase) THEN car_buying',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Shopping for a car?",
      follow_up_prompts: ["Car buying is stressful. Know your budget!"],
      internal_label: 'Car purchase',
      intervention_timing: 'When user mentions cars'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN021_WEDDING_EXPENSES: {
    id: 'FIN021',
    name: 'Wedding Financial Stress',
    planet: 'Mars',
    category: 'financial',
    description: 'Wedding costs mounting',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_DECREASES', threshold: 20, unit: 'percent', window: 60 }
    ],
    logic: 'IF (wedding_timing) AND (financial_stress) THEN wedding_costs',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Wedding expenses adding up?",
      follow_up_prompts: ["Remember, it's about the marriage, not the wedding."],
      internal_label: 'Wedding costs',
      intervention_timing: 'Pre-wedding months'
    },
    urgency: 'medium',
    sensitive: false
  },

  FIN022_VACATION_SPLURGE: {
    id: 'FIN022',
    name: 'Vacation Spending',
    planet: 'Mars',
    category: 'financial',
    description: 'Big vacation expense',
    conditions: [
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 40, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (vacation_pattern) AND (spending) THEN vacation_expense',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Big vacation coming up?",
      follow_up_prompts: ["Enjoy it!"],
      internal_label: 'Vacation spending',
      intervention_timing: 'Pre-vacation'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN023_CHILD_EDUCATION_COSTS: {
    id: 'FIN023',
    name: 'Education Expenses',
    planet: 'Mars',
    category: 'financial',
    description: 'School/college costs',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 30 }
    ],
    logic: 'IF (parent) AND (education_timing) THEN education_costs',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Tuition bills hitting?",
      follow_up_prompts: ["Education is an investment but it's expensive."],
      internal_label: 'Education costs',
      intervention_timing: 'School year start'
    },
    urgency: 'medium',
    sensitive: true
  },

  FIN024_HOME_RENOVATION: {
    id: 'FIN024',
    name: 'Home Renovation Costs',
    planet: 'Mars',
    category: 'financial',
    description: 'Renovation expenses',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 18, unit: 'percent', window: 30 }
    ],
    logic: 'IF (homeowner) AND (renovation_stress) THEN renovation_costs',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [21, 60],
    silent_guidance: {
      discovery_question: "Home renovation underway?",
      follow_up_prompts: ["Renovations always cost more than planned!"],
      internal_label: 'Renovation costs',
      intervention_timing: 'During renovation'
    },
    urgency: 'medium',
    sensitive: false
  },

  FIN025_EMERGENCY_EXPENSE: {
    id: 'FIN025',
    name: 'Emergency Expense',
    planet: 'Mars',
    category: 'financial',
    description: 'Unexpected major cost',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 28, unit: 'percent', window: 3 }
    ],
    logic: 'IF (sudden_stress) AND (unexpected) THEN emergency_expense',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [1, 7],
    silent_guidance: {
      discovery_question: "Unexpected expense hit?",
      follow_up_prompts: ["Emergency funds are for emergencies. It's okay to use them."],
      internal_label: 'Emergency expense',
      intervention_timing: 'When crisis occurs'
    },
    urgency: 'high',
    sensitive: true
  },

  FIN026_IMPULSE_PURCHASE_REGRET: {
    id: 'FIN026',
    name: 'Impulse Purchase Regret',
    planet: 'Mars',
    category: 'financial',
    description: 'Regret over spending',
    conditions: [
      { behavior: 'hrv', operator: 'SPIKE', threshold: 10, unit: 'percent', window: 1 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 3 }
    ],
    logic: 'IF (initial_excitement) THEN (regret) THEN impulse_buy',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Buyer's remorse?",
      follow_up_prompts: ["We all do it. Can you return it?"],
      internal_label: 'Impulse regret',
      intervention_timing: 'After purchase'
    },
    urgency: 'low',
    sensitive: false
  },

  // Investments & Wealth (8 patterns)
  FIN027_STOCK_MARKET_VOLATILITY_STRESS: {
    id: 'FIN027',
    name: 'Market Volatility Stress',
    planet: 'Mars',
    category: 'financial',
    description: 'Stock market causing anxiety',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'VOLATILE', threshold: 10, unit: 'bpm', window: 14 }
    ],
    logic: 'IF (market_correlation) AND (investor) THEN market_stress',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Market swings getting to you?",
      follow_up_prompts: ["Don't check your portfolio every day. Long-term thinking."],
      internal_label: 'Market stress',
      intervention_timing: 'Market volatility'
    },
    urgency: 'medium',
    sensitive: false
  },

  FIN028_INVESTMENT_LOSS: {
    id: 'FIN028',
    name: 'Major Investment Loss',
    planet: 'Mars',
    category: 'financial',
    description: 'Significant portfolio loss',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (severe_stress) AND (investor) THEN investment_loss',
    confidence_threshold: 0.83,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Portfolio took a hit?",
      follow_up_prompts: ["Market losses hurt. Don't panic sell."],
      internal_label: 'Investment loss',
      intervention_timing: 'Market crash'
    },
    urgency: 'high',
    sensitive: true
  },

  FIN029_INVESTMENT_WINDFALL: {
    id: 'FIN029',
    name: 'Investment Gains',
    planet: 'Mars',
    category: 'financial',
    description: 'Major portfolio gains',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 7 }
    ],
    logic: 'IF (euphoria) AND (investor) THEN investment_gains',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Portfolio doing well?",
      follow_up_prompts: ["Nice! Don't forget to rebalance."],
      internal_label: 'Investment gains',
      intervention_timing: 'Market rally'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN030_CRYPTO_VOLATILITY: {
    id: 'FIN030',
    name: 'Cryptocurrency Stress',
    planet: 'Mars',
    category: 'financial',
    description: 'Crypto investment anxiety',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_VOLATILE', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 14 }
    ],
    logic: 'IF (extreme_volatility) AND (crypto_context) THEN crypto_stress',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Crypto keeping you up at night?",
      follow_up_prompts: ["Only invest what you can afford to lose."],
      internal_label: 'Crypto stress',
      intervention_timing: 'Crypto volatility'
    },
    urgency: 'medium',
    sensitive: false
  },

  FIN031_BUSINESS_INVESTMENT: {
    id: 'FIN031',
    name: 'Business Investment',
    planet: 'Mars',
    category: 'financial',
    description: 'Investing in business',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (entrepreneur) AND (investment_stress) THEN business_investment',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Investing in your business?",
      follow_up_prompts: ["Risk is part of entrepreneurship. You got this."],
      internal_label: 'Business investment',
      intervention_timing: 'When user mentions business'
    },
    urgency: 'medium',
    sensitive: false
  },

  FIN032_REAL_ESTATE_INVESTMENT: {
    id: 'FIN032',
    name: 'Real Estate Investment',
    planet: 'Mars',
    category: 'financial',
    description: 'Property investment',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 18, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 45 }
    ],
    logic: 'IF (prolonged_stress) AND (property_context) THEN real_estate_investment',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Investing in real estate?",
      follow_up_prompts: ["Property investment is a long game."],
      internal_label: 'Real estate investment',
      intervention_timing: 'Property process'
    },
    urgency: 'medium',
    sensitive: false
  },

  FIN033_RETIREMENT_ACCOUNT_GROWTH: {
    id: 'FIN033',
    name: 'Retirement Savings Milestone',
    planet: 'Mars',
    category: 'financial',
    description: 'Retirement account achievement',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (satisfaction) AND (retirement_context) THEN savings_milestone',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Hit a savings goal?",
      follow_up_prompts: ["Building wealth takes time. Great job!"],
      internal_label: 'Retirement milestone',
      intervention_timing: 'When user mentions retirement'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN034_TAX_SEASON_STRESS: {
    id: 'FIN034',
    name: 'Tax Season Anxiety',
    planet: 'Mars',
    category: 'financial',
    description: 'Tax filing stress',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (seasonal_timing) AND (tax_season) THEN tax_stress',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Tax season getting to you?",
      follow_up_prompts: ["File an extension if you need more time."],
      internal_label: 'Tax stress',
      intervention_timing: 'Tax season'
    },
    urgency: 'medium',
    sensitive: false
  },

  // Poverty & Financial Crisis (10 patterns)
  FIN035_FOOD_INSECURITY: {
    id: 'FIN035',
    name: 'Food Insecurity',
    planet: 'Mars',
    category: 'financial',
    description: 'Cannot afford adequate food',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 30 }
    ],
    logic: 'IF (malnutrition_indicators) AND (poverty) THEN food_insecurity',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Are you getting enough to eat?",
      follow_up_prompts: ["Call 211 for food banks and SNAP assistance."],
      internal_label: 'Food insecurity',
      intervention_timing: 'Immediate resources'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN036_UTILITY_SHUTOFF_CRISIS: {
    id: 'FIN036',
    name: 'Utility Shutoff Crisis',
    planet: 'Mars',
    category: 'financial',
    description: 'Power/water being shut off',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 28, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 35, unit: 'percent', window: 7 }
    ],
    logic: 'IF (severe_stress) AND (utility_crisis) THEN shutoff_imminent',
    confidence_threshold: 0.85,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Utilities being shut off?",
      follow_up_prompts: ["Most states have protections. Call your utility company and 211."],
      internal_label: 'Utility crisis',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN037_HOMELESSNESS_RISK: {
    id: 'FIN037',
    name: 'Homelessness Risk',
    planet: 'Mars',
    category: 'financial',
    description: 'At risk of losing housing',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_LOW', threshold: 40, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'EXTREME_LOW', threshold: 45, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'EXTREME_HIGH', threshold: 20, unit: 'bpm', window: 14 }
    ],
    logic: 'IF (extreme_crisis) AND (housing_loss) THEN homelessness_risk',
    confidence_threshold: 0.90,
    evidence_required: 3,
    false_positive_rate: 0.09,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Are you losing your housing?",
      follow_up_prompts: ["Call 211 immediately. There are emergency shelters and assistance programs."],
      internal_label: 'CRISIS - Homelessness',
      intervention_timing: 'IMMEDIATE CRISIS'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN038_CAR_REPOSSESSION: {
    id: 'FIN038',
    name: 'Vehicle Repossession',
    planet: 'Mars',
    category: 'financial',
    description: 'Car being repossessed',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (acute_stress) AND (transportation_crisis) THEN repossession',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Losing your car?",
      follow_up_prompts: ["Talk to your lender about reinstatement. You have rights."],
      internal_label: 'Car repossession',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN039_FORECLOSURE_CRISIS: {
    id: 'FIN039',
    name: 'Foreclosure Crisis',
    planet: 'Mars',
    category: 'financial',
    description: 'Home foreclosure',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_LOW', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'EXTREME_LOW', threshold: 40, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 18, unit: 'bpm', window: 30 }
    ],
    logic: 'IF (extreme_prolonged_stress) AND (foreclosure) THEN home_loss',
    confidence_threshold: 0.88,
    evidence_required: 3,
    false_positive_rate: 0.11,
    detection_window: [21, 60],
    silent_guidance: {
      discovery_question: "Facing foreclosure?",
      follow_up_prompts: ["HUD-approved housing counselor. Foreclosure isn't instant. You have options."],
      internal_label: 'Foreclosure crisis',
      intervention_timing: 'Immediate resources'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN040_WELFARE_APPLICATION: {
    id: 'FIN040',
    name: 'Applying for Assistance',
    planet: 'Mars',
    category: 'financial',
    description: 'Seeking government assistance',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 22, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 }
    ],
    logic: 'IF (chronic_stress) AND (poverty) THEN welfare_application',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Applying for assistance?",
      follow_up_prompts: ["These programs exist to help. No shame in using them."],
      internal_label: 'Welfare application',
      intervention_timing: 'Support and resources'
    },
    urgency: 'high',
    sensitive: true
  },

  FIN041_PAYDAY_LOAN_TRAP: {
    id: 'FIN041',
    name: 'Payday Loan Cycle',
    planet: 'Mars',
    category: 'financial',
    description: 'Trapped in payday loans',
    conditions: [
      { behavior: 'hrv', operator: 'BIWEEKLY_VOLATILE', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'BIWEEKLY_VOLATILE', threshold: 28, unit: 'percent', window: 30 }
    ],
    logic: 'IF (payday_cycle) AND (worsening) THEN payday_trap',
    confidence_threshold: 0.83,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Stuck in payday loan cycle?",
      follow_up_prompts: ["These loans are predatory. Talk to a credit counselor about breaking free."],
      internal_label: 'Payday loan trap',
      intervention_timing: 'Immediate intervention'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN042_GAMBLING_DEBT: {
    id: 'FIN042',
    name: 'Gambling Debt Crisis',
    planet: 'Mars',
    category: 'financial',
    description: 'Debt from gambling',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_VOLATILE', threshold: 40, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 30 }
    ],
    logic: 'IF (extreme_volatility) AND (addiction_pattern) THEN gambling_debt',
    confidence_threshold: 0.86,
    evidence_required: 2,
    false_positive_rate: 0.13,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Gambling causing financial trouble?",
      follow_up_prompts: ["National Problem Gambling Helpline: 1-800-522-4700"],
      internal_label: 'Gambling debt',
      intervention_timing: 'Immediate addiction resources'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN043_IDENTITY_THEFT: {
    id: 'FIN043',
    name: 'Identity Theft Financial Crisis',
    planet: 'Mars',
    category: 'financial',
    description: 'Financial fraud victim',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 35, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'SPIKE', threshold: 15, unit: 'bpm', window: 7 }
    ],
    logic: 'IF (acute_crisis) AND (fraud_discovered) THEN identity_theft',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Identity theft?",
      follow_up_prompts: ["File police report, FTC complaint, freeze credit. IdentityTheft.gov"],
      internal_label: 'Identity theft',
      intervention_timing: 'Immediate action steps'
    },
    urgency: 'critical',
    sensitive: true
  },

  FIN044_SCAM_VICTIM: {
    id: 'FIN044',
    name: 'Financial Scam Victim',
    planet: 'Mars',
    category: 'financial',
    description: 'Lost money to scam',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 28, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 32, unit: 'percent', window: 7 }
    ],
    logic: 'IF (acute_distress) AND (scam_context) THEN scam_victim',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Did you get scammed?",
      follow_up_prompts: ["Report to FTC, IC3, local police. You're not alone."],
      internal_label: 'Scam victim',
      intervention_timing: 'Immediate reporting'
    },
    urgency: 'critical',
    sensitive: true
  },

  // Wealth Building & Positive (11 patterns)
  FIN045_FIRST_100K_MILESTONE: {
    id: 'FIN045',
    name: 'First $100K Net Worth',
    planet: 'Mars',
    category: 'financial',
    description: 'Major wealth milestone',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (achievement_satisfaction) THEN wealth_milestone',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Hit a big financial goal?",
      follow_up_prompts: ["First $100K is the hardest. Compound interest takes over from here!"],
      internal_label: 'Wealth milestone',
      intervention_timing: 'Celebration'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN046_PASSIVE_INCOME_START: {
    id: 'FIN046',
    name: 'Passive Income Stream',
    planet: 'Mars',
    category: 'financial',
    description: 'Starting passive income',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 30 }
    ],
    logic: 'IF (gradual_improvement) AND (income_diversification) THEN passive_income',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Building passive income?",
      follow_up_prompts: ["Smart move! Financial independence."],
      internal_label: 'Passive income',
      intervention_timing: 'When user mentions investments'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN047_FIRE_JOURNEY: {
    id: 'FIN047',
    name: 'FIRE Movement Progress',
    planet: 'Mars',
    category: 'financial',
    description: 'Financial independence journey',
    conditions: [
      { behavior: 'activeMinutes', operator: 'STABLE_HIGH', threshold: 80, unit: 'percent', window: 60 },
      { behavior: 'hrv', operator: 'STABLE_HIGH', threshold: 15, unit: 'percent', window: 60 }
    ],
    logic: 'IF (sustained_wellbeing) AND (FIRE_context) THEN financial_independence_progress',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Pursuing FIRE?",
      follow_up_prompts: ["Early retirement takes discipline. You're doing great!"],
      internal_label: 'FIRE journey',
      intervention_timing: 'Long-term encouragement'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN048_EMERGENCY_FUND_COMPLETE: {
    id: 'FIN048',
    name: 'Emergency Fund Completed',
    planet: 'Mars',
    category: 'financial',
    description: '6-month emergency fund',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (relief) AND (savings_milestone) THEN emergency_fund',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Finished your emergency fund?",
      follow_up_prompts: ["Huge accomplishment! Financial security feels good."],
      internal_label: 'Emergency fund',
      intervention_timing: 'Celebration'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN049_SALARY_NEGOTIATION_SUCCESS: {
    id: 'FIN049',
    name: 'Successful Salary Negotiation',
    planet: 'Mars',
    category: 'financial',
    description: 'Won salary negotiation',
    conditions: [
      { behavior: 'hrv', operator: 'SPIKE', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 5 }
    ],
    logic: 'IF (victory) AND (negotiation_context) THEN salary_win',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Negotiated your salary?",
      follow_up_prompts: ["Know your worth! Great job advocating for yourself."],
      internal_label: 'Salary negotiation',
      intervention_timing: 'After negotiation'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN050_CREDIT_SCORE_MILESTONE: {
    id: 'FIN050',
    name: 'Credit Score Milestone',
    planet: 'Mars',
    category: 'financial',
    description: 'Reached 700+ credit score',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (pride) AND (credit_improvement) THEN credit_milestone',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Credit score improving?",
      follow_up_prompts: ["Building credit takes time and discipline. Well done!"],
      internal_label: 'Credit milestone',
      intervention_timing: 'When user mentions credit'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN051_FINANCIAL_ADVISOR_START: {
    id: 'FIN051',
    name: 'Hired Financial Advisor',
    planet: 'Mars',
    category: 'financial',
    description: 'Getting professional help',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 14 }
    ],
    logic: 'IF (stress_relief) AND (advisor_context) THEN professional_help',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Working with a financial advisor now?",
      follow_up_prompts: ["Smart to get professional guidance!"],
      internal_label: 'Financial advisor',
      intervention_timing: 'When user mentions advisor'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN052_BUDGET_MASTERY: {
    id: 'FIN052',
    name: 'Budget Discipline Success',
    planet: 'Mars',
    category: 'financial',
    description: 'Consistent budgeting habit',
    conditions: [
      { behavior: 'hrv', operator: 'STABLE_IMPROVEMENT', threshold: 12, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'STABLE_IMPROVEMENT', threshold: 15, unit: 'percent', window: 60 }
    ],
    logic: 'IF (sustained_stability) AND (budgeting) THEN financial_control',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "You seem more financially stable. Budgeting working?",
      follow_up_prompts: ["Financial discipline = financial freedom!"],
      internal_label: 'Budget mastery',
      intervention_timing: 'Long-term encouragement'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN053_SIDE_HUSTLE_SUCCESS: {
    id: 'FIN053',
    name: 'Side Hustle Profitable',
    planet: 'Mars',
    category: 'financial',
    description: 'Side income working',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (improvement) AND (side_hustle_context) THEN hustle_success',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Side hustle paying off?",
      follow_up_prompts: ["Entrepreneurial spirit! Keep grinding."],
      internal_label: 'Side hustle success',
      intervention_timing: 'When user mentions business'
    },
    urgency: 'low',
    sensitive: false
  },

  FIN054_INHERITANCE_RECEIVED: {
    id: 'FIN054',
    name: 'Inheritance Received',
    planet: 'Mars',
    category: 'financial',
    description: 'Inherited money/assets',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (mixed_emotions) AND (inheritance) THEN windfall_grief',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Received an inheritance?",
      follow_up_prompts: ["Grief and money together is complicated. Take your time deciding what to do."],
      internal_label: 'Inheritance',
      intervention_timing: 'After loss'
    },
    urgency: 'medium',
    sensitive: true
  },

  FIN055_FINANCIAL_LITERACY_GROWTH: {
    id: 'FIN055',
    name: 'Financial Education Journey',
    planet: 'Mars',
    category: 'financial',
    description: 'Learning about money',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 10, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 12, unit: 'percent', window: 60 }
    ],
    logic: 'IF (gradual_empowerment) AND (learning) THEN financial_literacy',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Learning about personal finance?",
      follow_up_prompts: ["Financial literacy is the best investment you can make!"],
      internal_label: 'Financial literacy',
      intervention_timing: 'Long-term journey'
    },
    urgency: 'low',
    sensitive: false
  }
};
