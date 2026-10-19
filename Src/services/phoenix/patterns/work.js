/**
 * PHOENIX AI - WORK & CAREER LIFE PATTERNS (70 PATTERNS)
 *
 * Planet: Mercury (Communication, Work, Daily Routines)
 * Category: work
 *
 * Covers:
 * - Job loss & layoffs
 * - Promotions & career advancement
 * - Career changes & transitions
 * - Burnout & workplace stress
 * - Retirement & sabbaticals
 * - Remote work & office transitions
 * - Work-life balance issues
 * - Entrepreneurship & business
 * - Workplace conflicts
 * - Performance reviews & evaluations
 * - Plus variants, combinations, and anomalies
 */

module.exports = {

  // ==================== JOB LOSS & LAYOFFS (8 patterns) ====================

  W001_SUDDEN_JOB_LOSS: {
    id: 'W001',
    name: 'Sudden Job Loss',
    planet: 'Mercury',
    category: 'work',
    description: 'Unexpected termination or layoff with immediate impact',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 2 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'steps', operator: 'DROPS', threshold: 30, unit: 'percent', window: 3 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 14, unit: 'percent', window: 2 }
    ],
    logic: 'IF (hrv_drops_22%+ IN 2_days) AND (sleep_drops_20%+) AND (activity_drops_30%+) AND (rhr_spikes_14%+) THEN sudden_job_loss_likely',
    confidence_threshold: 0.84,
    evidence_required: 4,
    false_positive_rate: 0.11,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "I notice your routine has shifted dramatically. What's been going on?",
      follow_up_prompts: ["Has anything changed at work?", "How are you feeling about your days lately?"],
      internal_label: 'Sudden job loss detected',
      intervention_timing: 'When user mentions work, stress, or routine changes'
    },
    urgency: 'high',
    sensitive: true
  },

  W002_ANTICIPATED_LAYOFF: {
    id: 'W002',
    name: 'Anticipated Layoff Anxiety',
    planet: 'Mercury',
    category: 'work',
    description: 'Chronic stress from knowing layoffs are coming',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 8, unit: 'percent', window: 10 }
    ],
    logic: 'IF (hrv_chronically_low_15%+ FOR 14_days) AND (sleep_quality_poor) AND (rhr_elevated) THEN layoff_anxiety_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You seem to be carrying a lot of weight lately. What's on your mind?",
      follow_up_prompts: ["Is there uncertainty at work?"],
      internal_label: 'Layoff anxiety detected',
      intervention_timing: 'When user mentions worry, work, or future concerns'
    },
    urgency: 'medium',
    sensitive: true
  },

  W003_MASS_LAYOFF_SURVIVOR: {
    id: 'W003',
    name: 'Layoff Survivor Guilt',
    planet: 'Mercury',
    category: 'work',
    description: 'Psychological impact of surviving mass layoffs while colleagues lost jobs',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 5 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 10, unit: 'percent', window: 5 }
    ],
    logic: 'IF (hrv_drops_12%+) AND (overwork_pattern_emerges) AND (sleep_drops) THEN survivor_guilt_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "It seems like you're pushing yourself really hard. What's driving that?",
      follow_up_prompts: ["Has anything changed at work recently?"],
      internal_label: 'Layoff survivor guilt',
      intervention_timing: 'When user mentions work pressure or colleagues'
    },
    urgency: 'medium',
    sensitive: true
  },

  W004_JOB_SEARCH_EXHAUSTION: {
    id: 'W004',
    name: 'Job Search Exhaustion',
    planet: 'Mercury',
    category: 'work',
    description: 'Prolonged unemployment with declining mental health',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'sleepSchedule', operator: 'IRREGULAR', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'steps', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 }
    ],
    logic: 'IF (hrv_chronically_low FOR 30_days) AND (sleep_schedule_erratic) AND (activity_low) THEN job_search_burnout_likely',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [14, 45],
    silent_guidance: {
      discovery_question: "Your routine seems really different lately. How are things going?",
      follow_up_prompts: ["Are you between jobs right now?"],
      internal_label: 'Job search exhaustion',
      intervention_timing: 'When user mentions career, applications, or interviews'
    },
    urgency: 'medium',
    sensitive: true
  },

  W005_TERMINATED_FOR_CAUSE: {
    id: 'W005',
    name: 'Termination for Cause',
    planet: 'Mercury',
    category: 'work',
    description: 'Being fired (not laid off) with shame/guilt component',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 2 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 22, unit: 'percent', window: 3 },
      { behavior: 'steps', operator: 'DROPS', threshold: 35, unit: 'percent', window: 4 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 16, unit: 'percent', window: 2 }
    ],
    logic: 'IF (severe_multi_metric_crash) AND (withdrawal_pattern) THEN termination_trauma_likely',
    confidence_threshold: 0.81,
    evidence_required: 4,
    false_positive_rate: 0.13,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Something really significant happened. Do you want to talk about it?",
      follow_up_prompts: ["No judgment here—what's been going on?"],
      internal_label: 'Termination detected',
      intervention_timing: 'When user mentions work, failure, or shame'
    },
    urgency: 'high',
    sensitive: true
  },

  W006_CONTRACT_ENDING: {
    id: 'W006',
    name: 'Contract/Gig Work Ending',
    planet: 'Mercury',
    category: 'work',
    description: 'End of contract with financial uncertainty',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 }
    ],
    logic: 'IF (moderate_stress_pattern) AND (gradual_onset) THEN contract_ending_likely',
    confidence_threshold: 0.68,
    evidence_required: 2,
    false_positive_rate: 0.24,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "How's work going? Anything changing soon?",
      follow_up_prompts: ["Are you freelance or contract?"],
      internal_label: 'Contract ending stress',
      intervention_timing: 'When user mentions work changes or finances'
    },
    urgency: 'low',
    sensitive: false
  },

  W007_COMPANY_SHUTDOWN: {
    id: 'W007',
    name: 'Company Closure',
    planet: 'Mercury',
    category: 'work',
    description: 'Entire company shutting down—loss of workplace community',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 15, unit: 'percent', window: 4 },
      { behavior: 'steps', operator: 'DROPS', threshold: 28, unit: 'percent', window: 5 }
    ],
    logic: 'IF (job_loss_pattern) AND (community_loss_indicators) THEN company_closure_likely',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "It seems like you've lost something significant. What happened?",
      follow_up_prompts: ["Was it just your job, or something more?"],
      internal_label: 'Company closure grief',
      intervention_timing: 'When user mentions work or loss'
    },
    urgency: 'high',
    sensitive: true
  },

  W008_VOLUNTARY_RESIGNATION: {
    id: 'W008',
    name: 'Voluntary Resignation (Relief Pattern)',
    planet: 'Mercury',
    category: 'work',
    description: 'Quitting toxic job—initial relief with underlying uncertainty',
    conditions: [
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 10, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'IMPROVES', threshold: 12, unit: 'percent', window: 5 },
      { behavior: 'steps', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 5 }
    ],
    logic: 'IF (immediate_improvement_pattern) AND (sustained_for_week) THEN voluntary_resignation_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Something positive shifted recently—what changed?",
      follow_up_prompts: ["Did you make a big decision?"],
      internal_label: 'Voluntary resignation relief',
      intervention_timing: 'When user mentions work or life changes'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== PROMOTIONS & ADVANCEMENT (6 patterns) ====================

  W009_MAJOR_PROMOTION: {
    id: 'W009',
    name: 'Major Promotion',
    planet: 'Mercury',
    category: 'work',
    description: 'Significant career advancement with new responsibilities',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'SLIGHT_DROP', threshold: 8, unit: 'percent', window: 5 }
    ],
    logic: 'IF (increased_activity) AND (reduced_sleep) AND (slight_stress) THEN promotion_adjustment_likely',
    confidence_threshold: 0.71,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Looks like you're taking on more lately. What's new at work?",
      follow_up_prompts: ["Did you get a promotion or new role?"],
      internal_label: 'Promotion adjustment',
      intervention_timing: 'When user mentions work changes or new responsibilities'
    },
    urgency: 'low',
    sensitive: false
  },

  W010_IMPOSTER_SYNDROME: {
    id: 'W010',
    name: 'Imposter Syndrome After Promotion',
    planet: 'Mercury',
    category: 'work',
    description: 'Chronic anxiety after career advancement—feeling undeserving',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 12, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (chronic_anxiety) AND (overcompensation_pattern) AND (sustained_weeks) THEN imposter_syndrome_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You seem to be pushing yourself really hard. Do you feel like you have to prove something?",
      follow_up_prompts: ["How do you feel about your new role?"],
      internal_label: 'Imposter syndrome detected',
      intervention_timing: 'When user mentions work performance or self-doubt'
    },
    urgency: 'medium',
    sensitive: true
  },

  W011_PASSED_OVER_PROMOTION: {
    id: 'W011',
    name: 'Passed Over for Promotion',
    planet: 'Mercury',
    category: 'work',
    description: 'Disappointment and resentment from not getting expected promotion',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 14, unit: 'percent', window: 3 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 18, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 10, unit: 'percent', window: 5 }
    ],
    logic: 'IF (disappointment_pattern) AND (decreased_engagement) THEN promotion_rejection_likely',
    confidence_threshold: 0.73,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Something at work seems to have disappointed you. What happened?",
      follow_up_prompts: ["Did you expect something different?"],
      internal_label: 'Promotion rejection disappointment',
      intervention_timing: 'When user mentions work or feeling undervalued'
    },
    urgency: 'medium',
    sensitive: true
  },

  W012_LEADERSHIP_TRANSITION: {
    id: 'W012',
    name: 'Transition to Leadership Role',
    planet: 'Mercury',
    category: 'work',
    description: 'First-time manager stress—managing former peers',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 7 }
    ],
    logic: 'IF (sustained_moderate_stress) AND (week_long_pattern) THEN leadership_transition_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.23,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "How's work been treating you lately? Any big changes?",
      follow_up_prompts: ["Are you managing people now?"],
      internal_label: 'Leadership transition stress',
      intervention_timing: 'When user mentions work challenges or management'
    },
    urgency: 'low',
    sensitive: false
  },

  W013_EXECUTIVE_PROMOTION: {
    id: 'W013',
    name: 'Executive-Level Promotion',
    planet: 'Mercury',
    category: 'work',
    description: 'C-suite or VP promotion with extreme responsibility shift',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (severe_overwork_pattern) AND (sustained_stress) THEN executive_promotion_likely',
    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You're operating at an intense level right now. What's driving that?",
      follow_up_prompts: ["Did your role change significantly?"],
      internal_label: 'Executive promotion stress',
      intervention_timing: 'When user mentions work or leadership'
    },
    urgency: 'medium',
    sensitive: false
  },

  W014_LATERAL_MOVE: {
    id: 'W014',
    name: 'Lateral Career Move',
    planet: 'Mercury',
    category: 'work',
    description: 'Same-level role change with learning curve stress',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 8, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 }
    ],
    logic: 'IF (mild_stress_pattern) AND (adjustment_phase) THEN lateral_move_likely',
    confidence_threshold: 0.65,
    evidence_required: 2,
    false_positive_rate: 0.28,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Are you learning something new at work?",
      follow_up_prompts: ["Did you switch teams or roles?"],
      internal_label: 'Lateral move adjustment',
      intervention_timing: 'When user mentions work changes'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== CAREER CHANGES (7 patterns) ====================

  W015_CAREER_PIVOT: {
    id: 'W015',
    name: 'Major Career Change',
    planet: 'Mercury',
    category: 'work',
    description: 'Switching industries or professions entirely',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepSchedule', operator: 'IRREGULAR', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'steps', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (high_volatility_all_metrics) AND (sustained_2_weeks) THEN career_pivot_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Your whole routine seems to be shifting. What's changing in your life?",
      follow_up_prompts: ["Are you doing something completely new?"],
      internal_label: 'Major career pivot',
      intervention_timing: 'When user mentions career or big life changes'
    },
    urgency: 'medium',
    sensitive: false
  },

  W016_BACK_TO_SCHOOL: {
    id: 'W016',
    name: 'Returning to School While Working',
    planet: 'Mercury',
    category: 'work',
    description: 'Graduate school or certification while maintaining job',
    conditions: [
      { behavior: 'sleepDuration', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 12, unit: 'percent', window: 30 }
    ],
    logic: 'IF (chronic_sleep_deprivation) AND (reduced_exercise) AND (sustained_month) THEN school_work_overload_likely',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [14, 45],
    silent_guidance: {
      discovery_question: "You seem stretched really thin. Are you juggling multiple big things?",
      follow_up_prompts: ["Are you in school right now?"],
      internal_label: 'School-work overload',
      intervention_timing: 'When user mentions being busy or studying'
    },
    urgency: 'medium',
    sensitive: false
  },

  W017_INDUSTRY_SWITCH: {
    id: 'W017',
    name: 'Industry Switch (Same Role)',
    planet: 'Mercury',
    category: 'work',
    description: 'Same profession, different industry—culture shock',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 12, unit: 'percent', window: 10 }
    ],
    logic: 'IF (moderate_adjustment_stress) AND (sustained_week) THEN industry_switch_likely',
    confidence_threshold: 0.68,
    evidence_required: 2,
    false_positive_rate: 0.25,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "How's the new work environment treating you?",
      follow_up_prompts: ["Is it pretty different from before?"],
      internal_label: 'Industry switch adjustment',
      intervention_timing: 'When user mentions work or new environment'
    },
    urgency: 'low',
    sensitive: false
  },

  W018_FREELANCE_TO_FULLTIME: {
    id: 'W018',
    name: 'Freelance to Full-Time Transition',
    planet: 'Mercury',
    category: 'work',
    description: 'Adjusting to corporate structure after independent work',
    conditions: [
      { behavior: 'sleepSchedule', operator: 'BECOMES_REGULAR', threshold: 15, unit: 'percent', window: 10 },
      { behavior: 'steps', operator: 'CHANGES_PATTERN', threshold: 20, unit: 'percent', window: 10 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 8, unit: 'percent', window: 7 }
    ],
    logic: 'IF (routine_regularization) AND (mild_stress) THEN freelance_to_corporate_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.23,
    detection_window: [7, 14],
    silent_guidance: {
      discovery_question: "Your schedule seems more structured now. What changed?",
      follow_up_prompts: ["Did you start a full-time job?"],
      internal_label: 'Freelance to corporate transition',
      intervention_timing: 'When user mentions work structure or schedule'
    },
    urgency: 'low',
    sensitive: false
  },

  W019_CORPORATE_TO_STARTUP: {
    id: 'W019',
    name: 'Corporate to Startup Transition',
    planet: 'Mercury',
    category: 'work',
    description: 'Moving from big company to startup—chaos adjustment',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 12, unit: 'percent', window: 10 }
    ],
    logic: 'IF (increased_work_intensity) AND (reduced_sleep) AND (volatility) THEN startup_transition_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Your pace seems much more intense now. What's going on?",
      follow_up_prompts: ["Did you switch to a startup?"],
      internal_label: 'Corporate to startup shift',
      intervention_timing: 'When user mentions work intensity or startup'
    },
    urgency: 'low',
    sensitive: false
  },

  W020_DEMOTION: {
    id: 'W020',
    name: 'Demotion or Step-Down',
    planet: 'Mercury',
    category: 'work',
    description: 'Voluntary or forced reduction in role—ego impact',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 16, unit: 'percent', window: 3 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 22, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 5 }
    ],
    logic: 'IF (significant_stress_spike) AND (withdrawal_pattern) THEN demotion_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Something seems to have shifted your sense of self. What happened?",
      follow_up_prompts: ["Did your role change at work?"],
      internal_label: 'Demotion grief',
      intervention_timing: 'When user mentions work or feeling diminished'
    },
    urgency: 'high',
    sensitive: true
  },

  W021_RELOCATION_FOR_JOB: {
    id: 'W021',
    name: 'Job-Related Relocation',
    planet: 'Mercury',
    category: 'work',
    description: 'Moving cities/states for career—combined stress of job + move',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepSchedule', operator: 'IRREGULAR', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'steps', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 18, unit: 'percent', window: 10 }
    ],
    logic: 'IF (high_disruption_pattern) AND (multi_metric_volatility) THEN relocation_stress_likely',
    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Everything seems upside down right now. Are you in a new place?",
      follow_up_prompts: ["Did you move for work?"],
      internal_label: 'Job relocation stress',
      intervention_timing: 'When user mentions moving or new city'
    },
    urgency: 'medium',
    sensitive: false
  },

  // ==================== BURNOUT & STRESS (9 patterns) ====================

  W022_CLASSIC_BURNOUT: {
    id: 'W022',
    name: 'Classic Workplace Burnout',
    planet: 'Mercury',
    category: 'work',
    description: 'Chronic exhaustion with cynicism and reduced performance',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 25, unit: 'percent', window: 45 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 45 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 45 }
    ],
    logic: 'IF (chronic_exhaustion_all_metrics FOR 45_days) AND (severe_degradation) THEN burnout_confirmed',
    confidence_threshold: 0.88,
    evidence_required: 4,
    false_positive_rate: 0.08,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "You've been running on empty for a while. How long have you felt this way?",
      follow_up_prompts: ["Do you remember the last time you felt rested?"],
      internal_label: 'Severe burnout detected',
      intervention_timing: 'When user mentions exhaustion or work'
    },
    urgency: 'critical',
    sensitive: true
  },

  W023_DEADLINE_CRUNCH: {
    id: 'W023',
    name: 'Deadline Crunch Period',
    planet: 'Mercury',
    category: 'work',
    description: 'Acute stress from project deadline—resolves after completion',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 14, unit: 'days', window: 14 }
    ],
    logic: 'IF (acute_overwork_pattern) AND (resolves_within_2_weeks) THEN deadline_crunch_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Looks like you're in sprint mode. Big deadline coming up?",
      follow_up_prompts: ["How much longer until it's done?"],
      internal_label: 'Deadline crunch',
      intervention_timing: 'When user mentions being busy or deadlines'
    },
    urgency: 'medium',
    sensitive: false
  },

  W024_CHRONIC_OVERWORK: {
    id: 'W024',
    name: 'Chronic Overwork (Pre-Burnout)',
    planet: 'Mercury',
    category: 'work',
    description: 'Sustained 60+ hour weeks—burnout pathway',
    conditions: [
      { behavior: 'sleepDuration', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (sustained_overwork FOR 30_days) AND (declining_recovery) THEN chronic_overwork_confirmed',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "How long have you been pushing this hard?",
      follow_up_prompts: ["Is this sustainable for you?"],
      internal_label: 'Chronic overwork pattern',
      intervention_timing: 'When user mentions hours, workload, or exhaustion'
    },
    urgency: 'high',
    sensitive: true
  },

  W025_TOXIC_WORKPLACE: {
    id: 'W025',
    name: 'Toxic Workplace Environment',
    planet: 'Mercury',
    category: 'work',
    description: 'Persistent stress from hostile work culture or bad management',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'pattern_includes_spikes', operator: 'WEEKLY', threshold: 3, unit: 'occurrences', window: 30 }
    ],
    logic: 'IF (chronic_baseline_stress) AND (recurring_acute_spikes) THEN toxic_environment_likely',
    confidence_threshold: 0.81,
    evidence_required: 4,
    false_positive_rate: 0.13,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Work seems to be really weighing on you. How's the environment there?",
      follow_up_prompts: ["Do you feel safe and respected at work?"],
      internal_label: 'Toxic workplace detected',
      intervention_timing: 'When user mentions work stress or management'
    },
    urgency: 'high',
    sensitive: true
  },

  W026_HARASSMENT_AT_WORK: {
    id: 'W026',
    name: 'Workplace Harassment',
    planet: 'Mercury',
    category: 'work',
    description: 'Bullying, discrimination, or hostile treatment at work',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'pattern_includes_anxiety', operator: 'PRESENT', threshold: 1, unit: 'boolean', window: 7 }
    ],
    logic: 'IF (severe_stress_pattern) AND (anxiety_markers) THEN harassment_possible',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Something at work seems to be really affecting you. Do you feel safe there?",
      follow_up_prompts: ["Is someone treating you badly?"],
      internal_label: 'Possible harassment',
      intervention_timing: 'When user mentions work conflict or feeling unsafe'
    },
    urgency: 'critical',
    sensitive: true
  },

  W027_PERFORMANCE_IMPROVEMENT_PLAN: {
    id: 'W027',
    name: 'Performance Improvement Plan (PIP)',
    planet: 'Mercury',
    category: 'work',
    description: 'Placed on formal performance review—job jeopardy stress',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 28, unit: 'percent', window: 7 }
    ],
    logic: 'IF (acute_stress) AND (overcompensation_pattern) THEN pip_stress_likely',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You seem under a lot of pressure at work. What's going on?",
      follow_up_prompts: ["Are you worried about your job?"],
      internal_label: 'PIP stress',
      intervention_timing: 'When user mentions performance or job security'
    },
    urgency: 'high',
    sensitive: true
  },

  W028_MICROMANAGEMENT: {
    id: 'W028',
    name: 'Micromanagement Stress',
    planet: 'Mercury',
    category: 'work',
    description: 'Chronic frustration from overbearing manager',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 12, unit: 'percent', window: 21 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 8, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (chronic_moderate_stress) AND (no_acute_event) THEN micromanagement_likely',
    confidence_threshold: 0.69,
    evidence_required: 3,
    false_positive_rate: 0.24,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "How's your manager treating you lately?",
      follow_up_prompts: ["Do you feel trusted at work?"],
      internal_label: 'Micromanagement frustration',
      intervention_timing: 'When user mentions manager or lack of autonomy'
    },
    urgency: 'medium',
    sensitive: false
  },

  W029_CLIENT_CONFLICT: {
    id: 'W029',
    name: 'High-Stakes Client Conflict',
    planet: 'Mercury',
    category: 'work',
    description: 'Major client issue threatening business or job',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 16, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 18, unit: 'percent', window: 5 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 3 }
    ],
    logic: 'IF (acute_high_stress) AND (short_duration) THEN client_crisis_likely',
    confidence_threshold: 0.73,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Something urgent happened at work. What's the situation?",
      follow_up_prompts: ["Is it a client issue?"],
      internal_label: 'Client crisis stress',
      intervention_timing: 'When user mentions clients or work crisis'
    },
    urgency: 'high',
    sensitive: false
  },

  W030_COWORKER_CONFLICT: {
    id: 'W030',
    name: 'Ongoing Coworker Conflict',
    planet: 'Mercury',
    category: 'work',
    description: 'Interpersonal tension with colleague—daily stress',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 10, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 12, unit: 'percent', window: 21 }
    ],
    logic: 'IF (sustained_mild_stress) AND (no_resolution) THEN coworker_conflict_likely',
    confidence_threshold: 0.67,
    evidence_required: 2,
    false_positive_rate: 0.26,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "How are relationships at work?",
      follow_up_prompts: ["Is there someone making things difficult?"],
      internal_label: 'Coworker tension',
      intervention_timing: 'When user mentions coworkers or work relationships'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== RETIREMENT & SABBATICALS (4 patterns) ====================

  W031_RETIREMENT_TRANSITION: {
    id: 'W031',
    name: 'Retirement Transition',
    planet: 'Mercury',
    category: 'work',
    description: 'Major identity shift from ending lifelong career',
    conditions: [
      { behavior: 'steps', operator: 'CHANGES_PATTERN', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'sleepSchedule', operator: 'BECOMES_IRREGULAR', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (routine_disruption) AND (schedule_irregularity) THEN retirement_transition_likely',
    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Your whole routine changed recently. What's new?",
      follow_up_prompts: ["Did you retire?"],
      internal_label: 'Retirement adjustment',
      intervention_timing: 'When user mentions routine changes or retirement'
    },
    urgency: 'medium',
    sensitive: false
  },

  W032_EARLY_RETIREMENT: {
    id: 'W032',
    name: 'Early/Forced Retirement',
    planet: 'Mercury',
    category: 'work',
    description: 'Unplanned retirement—health or company issues',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 25, unit: 'percent', window: 10 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 10 }
    ],
    logic: 'IF (retirement_pattern) AND (distress_markers) THEN forced_retirement_likely',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [7, 14],
    silent_guidance: {
      discovery_question: "Something ended suddenly. What happened?",
      follow_up_prompts: ["Was it your choice?"],
      internal_label: 'Forced retirement grief',
      intervention_timing: 'When user mentions retirement or career ending'
    },
    urgency: 'high',
    sensitive: true
  },

  W033_SABBATICAL: {
    id: 'W033',
    name: 'Work Sabbatical',
    planet: 'Mercury',
    category: 'work',
    description: 'Planned extended leave—adjustment to freedom',
    conditions: [
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'IMPROVES', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (sudden_improvement_pattern) AND (sustained_recovery) THEN sabbatical_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.21,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You seem much more relaxed lately. What changed?",
      follow_up_prompts: ["Did you take time off work?"],
      internal_label: 'Sabbatical detected',
      intervention_timing: 'When user mentions break or time off'
    },
    urgency: 'low',
    sensitive: false
  },

  W034_RETURN_FROM_SABBATICAL: {
    id: 'W034',
    name: 'Return from Sabbatical',
    planet: 'Mercury',
    category: 'work',
    description: 'Re-entry stress after extended time off',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'CHANGES_PATTERN', threshold: 20, unit: 'percent', window: 5 }
    ],
    logic: 'IF (routine_shock) AND (stress_spike_after_improvement) THEN sabbatical_return_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.23,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Back to the grind? How's the adjustment going?",
      follow_up_prompts: ["Did you just come back from time off?"],
      internal_label: 'Sabbatical re-entry',
      intervention_timing: 'When user mentions returning to work'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== REMOTE WORK & TRANSITIONS (6 patterns) ====================

  W035_SUDDEN_REMOTE_SHIFT: {
    id: 'W035',
    name: 'Sudden Remote Work Shift',
    planet: 'Mercury',
    category: 'work',
    description: 'Abrupt transition to WFH—boundary issues',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 35, unit: 'percent', window: 5 },
      { behavior: 'sleepSchedule', operator: 'BECOMES_IRREGULAR', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (sudden_sedentary_shift) AND (routine_disruption) THEN remote_transition_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "You're moving a lot less suddenly. Did work go remote?",
      follow_up_prompts: ["How's working from home?"],
      internal_label: 'Remote work transition',
      intervention_timing: 'When user mentions work or being home'
    },
    urgency: 'medium',
    sensitive: false
  },

  W036_REMOTE_WORK_ISOLATION: {
    id: 'W036',
    name: 'Remote Work Isolation',
    planet: 'Mercury',
    category: 'work',
    description: 'Prolonged WFH loneliness and disconnection',
    conditions: [
      { behavior: 'steps', operator: 'CHRONIC_LOW', threshold: 40, unit: 'percent', window: 45 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 18, unit: 'percent', window: 45 }
    ],
    logic: 'IF (chronic_sedentary) AND (declining_wellbeing FOR 45_days) THEN remote_isolation_confirmed',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "How's your social life been lately? Do you see people regularly?",
      follow_up_prompts: ["Are you working from home full-time?"],
      internal_label: 'Remote work isolation',
      intervention_timing: 'When user mentions loneliness or working alone'
    },
    urgency: 'high',
    sensitive: true
  },

  W037_RETURN_TO_OFFICE: {
    id: 'W037',
    name: 'Return to Office (Post-Remote)',
    planet: 'Mercury',
    category: 'work',
    description: 'Adjustment stress from ending WFH',
    conditions: [
      { behavior: 'steps', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 5 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 }
    ],
    logic: 'IF (sudden_activity_increase) AND (commute_stress_pattern) THEN office_return_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Your schedule seems much busier now. What changed?",
      follow_up_prompts: ["Did you go back to the office?"],
      internal_label: 'Office return adjustment',
      intervention_timing: 'When user mentions commute or office'
    },
    urgency: 'medium',
    sensitive: false
  },

  W038_HYBRID_SCHEDULE_STRESS: {
    id: 'W038',
    name: 'Hybrid Schedule Stress',
    planet: 'Mercury',
    category: 'work',
    description: 'Difficulty managing split WFH/office schedule',
    conditions: [
      { behavior: 'sleepSchedule', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'steps', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (high_variability_all_metrics) AND (weekly_pattern) THEN hybrid_stress_likely',
    confidence_threshold: 0.71,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Your routine seems unpredictable. Are you splitting time between places?",
      follow_up_prompts: ["Is it a hybrid work schedule?"],
      internal_label: 'Hybrid schedule difficulty',
      intervention_timing: 'When user mentions schedule or routine'
    },
    urgency: 'low',
    sensitive: false
  },

  W039_DIGITAL_NOMAD_TRANSITION: {
    id: 'W039',
    name: 'Digital Nomad Transition',
    planet: 'Mercury',
    category: 'work',
    description: 'Constant travel while working remotely',
    conditions: [
      { behavior: 'sleepSchedule', operator: 'HIGHLY_IRREGULAR', threshold: 35, unit: 'percent', window: 21 },
      { behavior: 'steps', operator: 'VOLATILE', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (extreme_variability) AND (sustained_3_weeks) THEN nomad_lifestyle_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Your patterns are all over the place. Are you traveling a lot?",
      follow_up_prompts: ["Are you working while traveling?"],
      internal_label: 'Digital nomad pattern',
      intervention_timing: 'When user mentions travel or location changes'
    },
    urgency: 'low',
    sensitive: false
  },

  W040_ZOOM_FATIGUE: {
    id: 'W040',
    name: 'Zoom Fatigue Syndrome',
    planet: 'Mercury',
    category: 'work',
    description: 'Exhaustion from constant video calls',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 12, unit: 'percent', window: 21 },
      { behavior: 'steps', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (sedentary_exhaustion_pattern) AND (remote_context) THEN zoom_fatigue_likely',
    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.25,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You seem drained even though you're not physically active. What's exhausting you?",
      follow_up_prompts: ["Are you on video calls all day?"],
      internal_label: 'Zoom fatigue',
      intervention_timing: 'When user mentions exhaustion or meetings'
    },
    urgency: 'medium',
    sensitive: false
  },

  // ==================== ENTREPRENEURSHIP (6 patterns) ====================

  W041_STARTUP_LAUNCH: {
    id: 'W041',
    name: 'Startup Launch',
    planet: 'Mercury',
    category: 'work',
    description: 'Launching own business—extreme stress with excitement',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (extreme_hustle_pattern) AND (volatile_stress) THEN startup_launch_likely',
    confidence_threshold: 0.79,
    evidence_required: 4,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're running at full throttle right now. What are you building?",
      follow_up_prompts: ["Did you start your own company?"],
      internal_label: 'Startup launch hustle',
      intervention_timing: 'When user mentions business or entrepreneurship'
    },
    urgency: 'medium',
    sensitive: false
  },

  W042_BUSINESS_FAILURE: {
    id: 'W042',
    name: 'Business Failure/Closure',
    planet: 'Mercury',
    category: 'work',
    description: 'Shutting down own business—identity and financial loss',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 24, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 22, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 35, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 3 }
    ],
    logic: 'IF (severe_grief_pattern) AND (withdrawal) THEN business_failure_likely',
    confidence_threshold: 0.83,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Something really significant ended. I'm here if you want to talk about it.",
      follow_up_prompts: ["Was it your business?"],
      internal_label: 'Business failure grief',
      intervention_timing: 'When user mentions business or major loss'
    },
    urgency: 'critical',
    sensitive: true
  },

  W043_FUNDING_SECURED: {
    id: 'W043',
    name: 'Funding Round Secured',
    planet: 'Mercury',
    category: 'work',
    description: 'Major investment received—relief with new pressure',
    conditions: [
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 12, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'IMPROVES', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 7 }
    ],
    logic: 'IF (celebration_pattern) AND (increased_energy) THEN funding_success_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.21,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Something good happened recently! What's the news?",
      follow_up_prompts: ["Business going well?"],
      internal_label: 'Funding success',
      intervention_timing: 'When user mentions business or good news'
    },
    urgency: 'low',
    sensitive: false
  },

  W044_FUNDRAISING_STRESS: {
    id: 'W044',
    name: 'Fundraising Campaign Stress',
    planet: 'Mercury',
    category: 'work',
    description: 'Pitching to investors—constant rejection stress',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'percent', window: 30 }
    ],
    logic: 'IF (sustained_high_stress) AND (fundraising_context) THEN fundraising_stress_confirmed',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You've been under pressure for a while. What's driving it?",
      follow_up_prompts: ["Are you raising money for your business?"],
      internal_label: 'Fundraising stress',
      intervention_timing: 'When user mentions investors or pitching'
    },
    urgency: 'medium',
    sensitive: false
  },

  W045_FIRST_EMPLOYEE_HIRED: {
    id: 'W045',
    name: 'First Employee Hire',
    planet: 'Mercury',
    category: 'work',
    description: 'Transition from solo to managing others',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 8, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (mild_stress_with_increased_activity) THEN new_management_likely',
    confidence_threshold: 0.66,
    evidence_required: 2,
    false_positive_rate: 0.27,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Are you managing people now?",
      follow_up_prompts: ["How's that going?"],
      internal_label: 'First hire adjustment',
      intervention_timing: 'When user mentions employees or management'
    },
    urgency: 'low',
    sensitive: false
  },

  W046_SCALING_CRISIS: {
    id: 'W046',
    name: 'Rapid Growth/Scaling Crisis',
    planet: 'Mercury',
    category: 'work',
    description: 'Business growing faster than capacity—infrastructure stress',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 21 }
    ],
    logic: 'IF (extreme_overwork) AND (sustained_2_weeks) THEN scaling_crisis_likely',
    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're being stretched incredibly thin. What's happening?",
      follow_up_prompts: ["Is your business growing really fast?"],
      internal_label: 'Scaling crisis',
      intervention_timing: 'When user mentions growth or overwhelm'
    },
    urgency: 'high',
    sensitive: false
  },

  // ==================== WORK-LIFE BALANCE (5 patterns) ====================

  W047_NEW_PARENT_WORK_STRAIN: {
    id: 'W047',
    name: 'New Parent Work Strain',
    planet: 'Mercury',
    category: 'work',
    description: 'Balancing newborn with career demands',
    conditions: [
      { behavior: 'sleepDuration', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 60 },
      { behavior: 'sleepSchedule', operator: 'HIGHLY_IRREGULAR', threshold: 40, unit: 'percent', window: 60 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 60 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 60 }
    ],
    logic: 'IF (severe_sleep_disruption FOR 60_days) AND (chronic_exhaustion) THEN new_parent_work_conflict_likely',
    confidence_threshold: 0.84,
    evidence_required: 4,
    false_positive_rate: 0.11,
    detection_window: [30, 90],
    silent_guidance: {
      discovery_question: "You've been running on empty for a long time. Do you have a newborn?",
      follow_up_prompts: ["How are you managing work with a baby?"],
      internal_label: 'New parent work strain',
      intervention_timing: 'When user mentions baby or exhaustion'
    },
    urgency: 'high',
    sensitive: true
  },

  W048_ELDER_CARE_WORK_CONFLICT: {
    id: 'W048',
    name: 'Elder Care + Work Conflict',
    planet: 'Mercury',
    category: 'work',
    description: 'Caring for aging parent while working',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 20, unit: 'percent', window: 45 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (chronic_stress) AND (caregiver_pattern) THEN elder_care_work_strain_likely',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "You're carrying a lot. Are you taking care of a family member?",
      follow_up_prompts: ["How are you managing work alongside that?"],
      internal_label: 'Elder care work strain',
      intervention_timing: 'When user mentions parents or caregiving'
    },
    urgency: 'high',
    sensitive: true
  },

  W049_SECOND_JOB_ADDED: {
    id: 'W049',
    name: 'Second Job Started',
    planet: 'Mercury',
    category: 'work',
    description: 'Working multiple jobs—financial pressure',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (sudden_overwork_pattern) AND (sustained_2_weeks) THEN second_job_likely',
    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're working a lot more suddenly. What changed?",
      follow_up_prompts: ["Are you working two jobs now?"],
      internal_label: 'Second job overload',
      intervention_timing: 'When user mentions money or working extra'
    },
    urgency: 'medium',
    sensitive: true
  },

  W050_BOUNDARY_COLLAPSE: {
    id: 'W050',
    name: 'Work-Life Boundary Collapse',
    planet: 'Mercury',
    category: 'work',
    description: 'Complete erosion of work-life separation',
    conditions: [
      { behavior: 'sleepSchedule', operator: 'HIGHLY_IRREGULAR', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 30 }
    ],
    logic: 'IF (no_routine) AND (chronic_overwork) THEN boundary_collapse_confirmed',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "When do you stop working? Do you ever truly disconnect?",
      follow_up_prompts: ["What does rest look like for you?"],
      internal_label: 'Boundary collapse',
      intervention_timing: 'When user mentions being always on or never resting'
    },
    urgency: 'high',
    sensitive: true
  },

  W051_WORK_VACATION_GUILT: {
    id: 'W051',
    name: 'Vacation Guilt/Can\'t Disconnect',
    planet: 'Mercury',
    category: 'work',
    description: 'On vacation but working—inability to rest',
    conditions: [
      { behavior: 'steps', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 10, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'REMAINS_LOW', threshold: 10, unit: 'percent', window: 5 }
    ],
    logic: 'IF (vacation_context) AND (stress_persists) THEN vacation_guilt_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.23,
    detection_window: [3, 7],
    silent_guidance: {
      discovery_question: "Are you on vacation? You don't seem relaxed.",
      follow_up_prompts: ["Are you working during your time off?"],
      internal_label: 'Vacation guilt',
      intervention_timing: 'When user mentions vacation or travel'
    },
    urgency: 'medium',
    sensitive: false
  },

  // ==================== PERFORMANCE & REVIEWS (4 patterns) ====================

  W052_PERFORMANCE_REVIEW_ANXIETY: {
    id: 'W052',
    name: 'Performance Review Anxiety',
    planet: 'Mercury',
    category: 'work',
    description: 'Stress leading up to annual review',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 10, unit: 'days', window: 14 }
    ],
    logic: 'IF (acute_anxiety) AND (resolves_quickly) THEN performance_review_likely',
    confidence_threshold: 0.71,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You seem anxious about something at work. What's coming up?",
      follow_up_prompts: ["Is it review time?"],
      internal_label: 'Review anxiety',
      intervention_timing: 'When user mentions evaluation or performance'
    },
    urgency: 'low',
    sensitive: false
  },

  W053_NEGATIVE_REVIEW: {
    id: 'W053',
    name: 'Negative Performance Review',
    planet: 'Mercury',
    category: 'work',
    description: 'Received critical feedback—ego hit',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 14, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 16, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 7 }
    ],
    logic: 'IF (acute_disappointment) AND (overcompensation_pattern) THEN negative_review_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Something at work seems to have really affected you. What happened?",
      follow_up_prompts: ["How did your review go?"],
      internal_label: 'Negative review impact',
      intervention_timing: 'When user mentions feedback or feeling criticized'
    },
    urgency: 'medium',
    sensitive: true
  },

  W054_EXCEPTIONAL_REVIEW: {
    id: 'W054',
    name: 'Exceptional Performance Recognition',
    planet: 'Mercury',
    category: 'work',
    description: 'Outstanding review with praise—confidence boost',
    conditions: [
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 10, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'IMPROVES', threshold: 12, unit: 'percent', window: 5 }
    ],
    logic: 'IF (sudden_improvement) AND (sustained_week) THEN positive_recognition_likely',
    confidence_threshold: 0.68,
    evidence_required: 2,
    false_positive_rate: 0.25,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "You seem lighter lately. Something good happen at work?",
      follow_up_prompts: ["Did you get recognized?"],
      internal_label: 'Positive recognition',
      intervention_timing: 'When user mentions work or achievement'
    },
    urgency: 'low',
    sensitive: false
  },

  W055_WRITTEN_WARNING: {
    id: 'W055',
    name: 'Written Warning/Disciplinary Action',
    planet: 'Mercury',
    category: 'work',
    description: 'Formal reprimand—job security fear',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 14, unit: 'percent', window: 3 }
    ],
    logic: 'IF (severe_acute_stress) AND (immediate_onset) THEN disciplinary_action_likely',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Something really serious happened at work. Do you want to talk about it?",
      follow_up_prompts: ["Are you worried about your job?"],
      internal_label: 'Disciplinary action stress',
      intervention_timing: 'When user mentions trouble or warnings'
    },
    urgency: 'critical',
    sensitive: true
  },

  // ==================== ANOMALIES & COMPLEX PATTERNS (16 patterns) ====================

  W056_WORKPLACE_ACCIDENT: {
    id: 'W056',
    name: 'Workplace Injury/Accident',
    planet: 'Mercury',
    category: 'work',
    description: 'Physical injury at work—workers comp situation',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 2 },
      { behavior: 'steps', operator: 'DROPS', threshold: 60, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 3 }
    ],
    logic: 'IF (sudden_immobility) AND (acute_stress) THEN workplace_injury_likely',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Are you okay? Did something happen to you physically?",
      follow_up_prompts: ["Was it at work?"],
      internal_label: 'Workplace injury',
      intervention_timing: 'When user mentions injury or accident'
    },
    urgency: 'critical',
    sensitive: true
  },

  W057_WHISTLEBLOWER_STRESS: {
    id: 'W057',
    name: 'Whistleblower/Reporting Misconduct',
    planet: 'Mercury',
    category: 'work',
    description: 'Reporting unethical behavior—retaliation fear',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'percent', window: 30 }
    ],
    logic: 'IF (sustained_severe_stress) AND (fear_pattern) THEN whistleblower_stress_likely',
    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You seem under immense pressure. Are you facing something difficult at work?",
      follow_up_prompts: ["Do you feel safe?"],
      internal_label: 'Whistleblower stress',
      intervention_timing: 'When user mentions reporting or ethics'
    },
    urgency: 'critical',
    sensitive: true
  },

  W058_MERGER_ACQUISITION: {
    id: 'W058',
    name: 'Company Merger/Acquisition',
    planet: 'Mercury',
    category: 'work',
    description: 'Company bought or merged—job uncertainty',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 12, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (sustained_moderate_anxiety) AND (uncertainty_pattern) THEN merger_stress_likely',
    confidence_threshold: 0.70,
    evidence_required: 2,
    false_positive_rate: 0.23,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "How's work been with all the changes happening?",
      follow_up_prompts: ["Is your company going through a merger?"],
      internal_label: 'Merger uncertainty',
      intervention_timing: 'When user mentions company changes'
    },
    urgency: 'medium',
    sensitive: false
  },

  W059_STRIKE_OR_WALKOUT: {
    id: 'W059',
    name: 'Labor Strike/Walkout',
    planet: 'Mercury',
    category: 'work',
    description: 'Participating in strike action—financial and moral stress',
    conditions: [
      { behavior: 'steps', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (increased_activity) AND (stress_pattern) THEN strike_participation_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.21,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You're out and about more than usual. What's going on at work?",
      follow_up_prompts: ["Is there a strike?"],
      internal_label: 'Strike participation',
      intervention_timing: 'When user mentions union or strike'
    },
    urgency: 'medium',
    sensitive: false
  },

  W060_UNION_ORGANIZING: {
    id: 'W060',
    name: 'Union Organizing Effort',
    planet: 'Mercury',
    category: 'work',
    description: 'Leading or participating in unionization—management pressure',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 18, unit: 'percent', window: 30 }
    ],
    logic: 'IF (sustained_stress) AND (increased_activity) THEN union_organizing_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You're carrying a lot right now. What's happening at work?",
      follow_up_prompts: ["Are you organizing with coworkers?"],
      internal_label: 'Union organizing stress',
      intervention_timing: 'When user mentions union or organizing'
    },
    urgency: 'medium',
    sensitive: true
  },

  W061_SABBATICAL_REJECTION: {
    id: 'W061',
    name: 'Sabbatical/Leave Request Denied',
    planet: 'Mercury',
    category: 'work',
    description: 'Burnout worsening after denied time off',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (disappointment_pattern) AND (worsening_burnout) THEN leave_denial_likely',
    confidence_threshold: 0.71,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You seem disappointed and more exhausted. What happened?",
      follow_up_prompts: ["Were you hoping to take time off?"],
      internal_label: 'Leave request denied',
      intervention_timing: 'When user mentions needing break or denial'
    },
    urgency: 'high',
    sensitive: true
  },

  W062_PROFESSIONAL_LICENSE_ISSUE: {
    id: 'W062',
    name: 'Professional License/Certification Issue',
    planet: 'Mercury',
    category: 'work',
    description: 'Risk of losing professional credentials',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 22, unit: 'percent', window: 5 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 3 }
    ],
    logic: 'IF (severe_acute_crisis) AND (career_threat) THEN license_jeopardy_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Your whole career seems threatened. What's happening?",
      follow_up_prompts: ["Is it a licensing issue?"],
      internal_label: 'License jeopardy',
      intervention_timing: 'When user mentions credentials or professional status'
    },
    urgency: 'critical',
    sensitive: true
  },

  W063_PUBLIC_SPEAKING_EVENT: {
    id: 'W063',
    name: 'Major Presentation/Public Speaking',
    planet: 'Mercury',
    category: 'work',
    description: 'Conference talk or high-stakes presentation anxiety',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 7, unit: 'days', window: 10 }
    ],
    logic: 'IF (acute_anxiety) AND (resolves_quickly) THEN presentation_anxiety_likely',
    confidence_threshold: 0.73,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [3, 7],
    silent_guidance: {
      discovery_question: "You seem nervous about something coming up. What is it?",
      follow_up_prompts: ["Do you have to present or speak publicly?"],
      internal_label: 'Presentation anxiety',
      intervention_timing: 'When user mentions speaking or presenting'
    },
    urgency: 'low',
    sensitive: false
  },

  W064_PATENT_OR_PUBLICATION: {
    id: 'W064',
    name: 'Patent Filing/Academic Publication',
    planet: 'Mercury',
    category: 'work',
    description: 'Intellectual property or research milestone stress',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 14 }
    ],
    logic: 'IF (sustained_moderate_stress) AND (deadline_pattern) THEN publication_stress_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.23,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're pushing hard on something important. What are you working on?",
      follow_up_prompts: ["Is it a patent or publication?"],
      internal_label: 'Publication deadline',
      intervention_timing: 'When user mentions research or intellectual property'
    },
    urgency: 'low',
    sensitive: false
  },

  W065_NONPROFIT_PIVOT: {
    id: 'W065',
    name: 'Corporate to Nonprofit Transition',
    planet: 'Mercury',
    category: 'work',
    description: 'Leaving high-paying job for mission-driven work—financial adjustment',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (moderate_volatility) AND (career_change_context) THEN nonprofit_transition_likely',
    confidence_threshold: 0.68,
    evidence_required: 2,
    false_positive_rate: 0.25,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Your work seems very different now. What changed?",
      follow_up_prompts: ["Did you switch to nonprofit work?"],
      internal_label: 'Nonprofit transition',
      intervention_timing: 'When user mentions career change or mission'
    },
    urgency: 'low',
    sensitive: false
  },

  W066_VISA_OR_WORK_PERMIT: {
    id: 'W066',
    name: 'Work Visa/Permit Jeopardy',
    planet: 'Mercury',
    category: 'work',
    description: 'Immigration status threatening job—deportation fear',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 25, unit: 'percent', window: 45 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'percent', window: 45 }
    ],
    logic: 'IF (sustained_severe_anxiety) AND (existential_threat) THEN visa_crisis_likely',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "You're under enormous stress for a long time. What's threatening you?",
      follow_up_prompts: ["Is it immigration or visa related?"],
      internal_label: 'Visa jeopardy crisis',
      intervention_timing: 'When user mentions visa or immigration'
    },
    urgency: 'critical',
    sensitive: true
  },

  W067_WORKPLACE_ROMANCE: {
    id: 'W067',
    name: 'Workplace Romance Complications',
    planet: 'Mercury',
    category: 'work',
    description: 'Relationship with coworker causing stress',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (high_volatility) AND (emotional_pattern) THEN workplace_romance_likely',
    confidence_threshold: 0.69,
    evidence_required: 2,
    false_positive_rate: 0.24,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Something complicated is happening. Want to talk about it?",
      follow_up_prompts: ["Is it a relationship?"],
      internal_label: 'Workplace romance stress',
      intervention_timing: 'When user mentions coworker or relationship'
    },
    urgency: 'low',
    sensitive: true
  },

  W068_WORKPLACE_TRAGEDY: {
    id: 'W068',
    name: 'Workplace Death/Tragedy',
    planet: 'Mercury',
    category: 'work',
    description: 'Coworker death or major workplace trauma',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 25, unit: 'percent', window: 5 }
    ],
    logic: 'IF (severe_grief_pattern) AND (immediate_onset) THEN workplace_tragedy_likely',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Something really terrible happened. I'm so sorry. What can I do?",
      follow_up_prompts: ["Was it someone from work?"],
      internal_label: 'Workplace tragedy grief',
      intervention_timing: 'When user mentions death or trauma'
    },
    urgency: 'critical',
    sensitive: true
  },

  W069_COMPETITIVE_COWORKER: {
    id: 'W069',
    name: 'Competitive Coworker Dynamic',
    planet: 'Mercury',
    category: 'work',
    description: 'Rivalry with colleague—constant comparison stress',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 10, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (sustained_mild_stress) AND (overwork_pattern) THEN competitive_stress_likely',
    confidence_threshold: 0.66,
    evidence_required: 2,
    false_positive_rate: 0.27,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Do you feel like you're constantly trying to prove yourself at work?",
      follow_up_prompts: ["Is there someone you're competing with?"],
      internal_label: 'Competitive coworker stress',
      intervention_timing: 'When user mentions competition or rivalry'
    },
    urgency: 'low',
    sensitive: false
  },

  W070_MENTORSHIP_BURDEN: {
    id: 'W070',
    name: 'Mentorship Overload',
    planet: 'Mercury',
    category: 'work',
    description: 'Excessive mentoring responsibilities draining energy',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (increased_activity) AND (declining_recovery) THEN mentorship_overload_likely',
    confidence_threshold: 0.67,
    evidence_required: 3,
    false_positive_rate: 0.26,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You're giving a lot to others. How much are you keeping for yourself?",
      follow_up_prompts: ["Are you mentoring people at work?"],
      internal_label: 'Mentorship drain',
      intervention_timing: 'When user mentions mentoring or teaching'
    },
    urgency: 'low',
    sensitive: false
  }

};
