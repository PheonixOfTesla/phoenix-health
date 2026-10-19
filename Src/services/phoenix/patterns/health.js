/**
 * PHOENIX AI - HEALTH & MEDICAL LIFE PATTERNS (80 PATTERNS)
 *
 * Planet: Mars (Physical Body, Energy, Vitality)
 * Category: health
 *
 * Covers:
 * - Acute illness & infections
 * - Chronic disease management
 * - Injuries & accidents
 * - Surgery & recovery
 * - Medication changes
 * - Diagnostic tests & results
 * - Hospitalization
 * - Pain management
 * - Allergies & sensitivities
 * - Immune system issues
 * - Plus variants, complications, and anomalies
 */

module.exports = {

  // ==================== ACUTE ILLNESS (10 patterns) ====================

  H001_COMMON_COLD: {
    id: 'H001',
    name: 'Common Cold/Upper Respiratory Infection',
    planet: 'Mars',
    category: 'health',
    description: 'Acute viral infection with 3-7 day course',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 3 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 7, unit: 'days', window: 10 }
    ],
    logic: 'IF (rhr_spike + hrv_drop + fatigue) AND (resolves_within_week) THEN common_cold_likely',
    confidence_threshold: 0.82,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Your body seems to be fighting something. Not feeling well?",
      follow_up_prompts: ["How's your energy?"],
      internal_label: 'Common cold detected',
      intervention_timing: 'When user mentions feeling sick or tired'
    },
    urgency: 'low',
    sensitive: false
  },

  H002_FLU: {
    id: 'H002',
    name: 'Influenza',
    planet: 'Mars',
    category: 'health',
    description: 'Severe viral infection with high fever',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 2 },
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 60, unit: 'percent', window: 3 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 40, unit: 'percent', window: 3 }
    ],
    logic: 'IF (severe_physiological_stress) AND (near_immobility) THEN flu_likely',
    confidence_threshold: 0.86,
    evidence_required: 5,
    false_positive_rate: 0.09,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Your body is really struggling right now. What's going on?",
      follow_up_prompts: ["Do you have a fever?"],
      internal_label: 'Influenza detected',
      intervention_timing: 'When user mentions being sick'
    },
    urgency: 'high',
    sensitive: false
  },

  H003_COVID19: {
    id: 'H003',
    name: 'COVID-19 Infection',
    planet: 'Mars',
    category: 'health',
    description: 'Coronavirus infection with distinctive pattern',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 5 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 10 }
    ],
    logic: 'IF (moderate_acute_illness) AND (prolonged_recovery) THEN covid_likely',
    confidence_threshold: 0.79,
    evidence_required: 4,
    false_positive_rate: 0.15,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "You've been under the weather for a while. What's going on?",
      follow_up_prompts: ["Did you test positive for anything?"],
      internal_label: 'COVID-19 pattern',
      intervention_timing: 'When user mentions illness or testing'
    },
    urgency: 'high',
    sensitive: true
  },

  H004_FOOD_POISONING: {
    id: 'H004',
    name: 'Food Poisoning/Gastroenteritis',
    planet: 'Mars',
    category: 'health',
    description: 'Acute GI distress with rapid onset',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 1 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 2 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 70, unit: 'percent', window: 2 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 3, unit: 'days', window: 5 }
    ],
    logic: 'IF (sudden_severe_illness) AND (resolves_quickly) THEN food_poisoning_likely',
    confidence_threshold: 0.81,
    evidence_required: 4,
    false_positive_rate: 0.13,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "You got hit hard suddenly. What happened?",
      follow_up_prompts: ["Was it something you ate?"],
      internal_label: 'Food poisoning',
      intervention_timing: 'When user mentions stomach issues'
    },
    urgency: 'medium',
    sensitive: false
  },

  H005_MIGRAINE: {
    id: 'H005',
    name: 'Migraine Episode',
    planet: 'Mars',
    category: 'health',
    description: 'Severe headache with neurological symptoms',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 1 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 2 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 60, unit: 'percent', window: 2 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 3, unit: 'days', window: 5 }
    ],
    logic: 'IF (acute_neurological_stress) AND (immobility) AND (resolves_72h) THEN migraine_likely',
    confidence_threshold: 0.77,
    evidence_required: 4,
    false_positive_rate: 0.17,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Something knocked you out. Are you okay?",
      follow_up_prompts: ["Was it a headache?"],
      internal_label: 'Migraine episode',
      intervention_timing: 'When user mentions headache or being down'
    },
    urgency: 'medium',
    sensitive: false
  },

  H006_SINUS_INFECTION: {
    id: 'H006',
    name: 'Sinus Infection',
    planet: 'Mars',
    category: 'health',
    description: 'Bacterial sinusitis requiring antibiotics',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (sustained_moderate_illness) AND (week_duration) THEN sinus_infection_likely',
    confidence_threshold: 0.74,
    evidence_required: 4,
    false_positive_rate: 0.19,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "You've been dragging for a while. Not feeling better?",
      follow_up_prompts: ["Is it your sinuses?"],
      internal_label: 'Sinus infection',
      intervention_timing: 'When user mentions congestion or infection'
    },
    urgency: 'medium',
    sensitive: false
  },

  H007_UTI: {
    id: 'H007',
    name: 'Urinary Tract Infection',
    planet: 'Mars',
    category: 'health',
    description: 'Bladder or kidney infection',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 3 }
    ],
    logic: 'IF (acute_infection_pattern) AND (moderate_severity) THEN uti_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "Your body is fighting an infection. What's going on?",
      follow_up_prompts: ["Is it a UTI?"],
      internal_label: 'UTI detected',
      intervention_timing: 'When user mentions infection or discomfort'
    },
    urgency: 'medium',
    sensitive: true
  },

  H008_STREP_THROAT: {
    id: 'H008',
    name: 'Strep Throat',
    planet: 'Mars',
    category: 'health',
    description: 'Bacterial throat infection',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 14, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 2 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 45, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 3 }
    ],
    logic: 'IF (acute_bacterial_infection) AND (severe_fatigue) THEN strep_likely',
    confidence_threshold: 0.78,
    evidence_required: 4,
    false_positive_rate: 0.16,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "You seem really sick suddenly. What's wrong?",
      follow_up_prompts: ["Is it your throat?"],
      internal_label: 'Strep throat',
      intervention_timing: 'When user mentions sore throat'
    },
    urgency: 'medium',
    sensitive: false
  },

  H009_VERTIGO: {
    id: 'H009',
    name: 'Vertigo/Inner Ear Issues',
    planet: 'Mars',
    category: 'health',
    description: 'Dizziness and balance problems',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 50, unit: 'percent', window: 3 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 }
    ],
    logic: 'IF (sudden_immobility) AND (balance_issue_pattern) THEN vertigo_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.21,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "You're not moving much. Are you dizzy?",
      follow_up_prompts: ["Is it vertigo?"],
      internal_label: 'Vertigo episode',
      intervention_timing: 'When user mentions dizziness or balance'
    },
    urgency: 'medium',
    sensitive: false
  },

  H010_ALLERGIC_REACTION: {
    id: 'H010',
    name: 'Severe Allergic Reaction',
    planet: 'Mars',
    category: 'health',
    description: 'Acute allergic response requiring intervention',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 1 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 2 }
    ],
    logic: 'IF (sudden_severe_physiological_stress) THEN allergic_reaction_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [1, 2],
    silent_guidance: {
      discovery_question: "Something happened very suddenly. Are you having a reaction?",
      follow_up_prompts: ["Did you eat or touch something new?"],
      internal_label: 'Allergic reaction',
      intervention_timing: 'Immediate - when pattern detected'
    },
    urgency: 'critical',
    sensitive: true
  },

  // ==================== CHRONIC DISEASE (12 patterns) ====================

  H011_DIABETES_DIAGNOSIS: {
    id: 'H011',
    name: 'New Diabetes Diagnosis',
    planet: 'Mars',
    category: 'health',
    description: 'Initial diagnosis with lifestyle adjustment stress',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'CHANGES_PATTERN', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (moderate_stress) AND (lifestyle_changes) THEN new_diagnosis_likely',
    confidence_threshold: 0.73,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Your routine changed significantly. Did you get some health news?",
      follow_up_prompts: ["Was it a diagnosis?"],
      internal_label: 'New chronic diagnosis',
      intervention_timing: 'When user mentions health changes or diagnosis'
    },
    urgency: 'medium',
    sensitive: true
  },

  H012_DIABETES_POORLY_CONTROLLED: {
    id: 'H012',
    name: 'Poorly Controlled Diabetes',
    planet: 'Mars',
    category: 'health',
    description: 'Chronic hyperglycemia with complications',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 45 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 20, unit: 'percent', window: 45 }
    ],
    logic: 'IF (chronic_poor_health_markers FOR 45_days) THEN uncontrolled_diabetes_likely',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Your body has been struggling for a while. How's your health management going?",
      follow_up_prompts: ["Are you diabetic? How are your numbers?"],
      internal_label: 'Uncontrolled diabetes',
      intervention_timing: 'When user mentions diabetes or health struggles'
    },
    urgency: 'high',
    sensitive: true
  },

  H013_HYPERTENSION_CRISIS: {
    id: 'H013',
    name: 'Hypertension Crisis',
    planet: 'Mars',
    category: 'health',
    description: 'Acute blood pressure spike',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 2 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 3 }
    ],
    logic: 'IF (cardiovascular_stress_spike) THEN hypertension_crisis_likely',
    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "Your cardiovascular system seems stressed. Have you checked your blood pressure?",
      follow_up_prompts: ["Are you feeling okay?"],
      internal_label: 'Hypertension crisis',
      intervention_timing: 'When user mentions pressure, headache, or cardiovascular issues'
    },
    urgency: 'critical',
    sensitive: true
  },

  H014_ASTHMA_EXACERBATION: {
    id: 'H014',
    name: 'Asthma Exacerbation',
    planet: 'Mars',
    category: 'health',
    description: 'Acute worsening of asthma symptoms',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 3 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 5 }
    ],
    logic: 'IF (respiratory_distress_pattern) AND (activity_limitation) THEN asthma_flare_likely',
    confidence_threshold: 0.79,
    evidence_required: 4,
    false_positive_rate: 0.15,
    detection_window: [3, 7],
    silent_guidance: {
      discovery_question: "You're struggling more than usual. Is it your breathing?",
      follow_up_prompts: ["Do you have your inhaler?"],
      internal_label: 'Asthma exacerbation',
      intervention_timing: 'When user mentions breathing or asthma'
    },
    urgency: 'high',
    sensitive: true
  },

  H015_ARTHRITIS_FLARE: {
    id: 'H015',
    name: 'Arthritis Flare-Up',
    planet: 'Mars',
    category: 'health',
    description: 'Joint inflammation causing mobility issues',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 35, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 }
    ],
    logic: 'IF (reduced_mobility) AND (pain_pattern) THEN arthritis_flare_likely',
    confidence_threshold: 0.77,
    evidence_required: 4,
    false_positive_rate: 0.17,
    detection_window: [3, 7],
    silent_guidance: {
      discovery_question: "You're moving less. Are your joints bothering you?",
      follow_up_prompts: ["Is it arthritis?"],
      internal_label: 'Arthritis flare',
      intervention_timing: 'When user mentions pain or joints'
    },
    urgency: 'medium',
    sensitive: false
  },

  H016_CHRONIC_PAIN_SPIKE: {
    id: 'H016',
    name: 'Chronic Pain Exacerbation',
    planet: 'Mars',
    category: 'health',
    description: 'Worsening of ongoing pain condition',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (pain_stress_pattern) AND (functional_limitation) THEN chronic_pain_spike_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "Your pain seems worse than usual. What's going on?",
      follow_up_prompts: ["Have you talked to your doctor?"],
      internal_label: 'Chronic pain exacerbation',
      intervention_timing: 'When user mentions pain increase'
    },
    urgency: 'medium',
    sensitive: true
  },

  H017_HEART_ARRHYTHMIA: {
    id: 'H017',
    name: 'Heart Arrhythmia Episode',
    planet: 'Mars',
    category: 'health',
    description: 'Irregular heartbeat detection',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'HIGHLY_VOLATILE', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 }
    ],
    logic: 'IF (heart_rate_irregularity) AND (hrv_volatility) THEN arrhythmia_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "Your heart rhythm seems irregular. Have you noticed palpitations?",
      follow_up_prompts: ["Should you call your doctor?"],
      internal_label: 'Arrhythmia detected',
      intervention_timing: 'Immediate - when pattern detected'
    },
    urgency: 'critical',
    sensitive: true
  },

  H018_THYROID_DYSFUNCTION: {
    id: 'H018',
    name: 'Thyroid Imbalance',
    planet: 'Mars',
    category: 'health',
    description: 'Hypo or hyperthyroid symptoms emerging',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'CHANGES_BASELINE', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'CHANGES_PATTERN', threshold: 30, unit: 'percent', window: 30 }
    ],
    logic: 'IF (metabolic_shift) AND (sustained_3_weeks) THEN thyroid_issue_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.21,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Your energy and metabolism seem off. Have you had your thyroid checked?",
      follow_up_prompts: ["Are you on thyroid medication?"],
      internal_label: 'Thyroid dysfunction',
      intervention_timing: 'When user mentions fatigue or metabolism'
    },
    urgency: 'medium',
    sensitive: true
  },

  H019_AUTOIMMUNE_FLARE: {
    id: 'H019',
    name: 'Autoimmune Disease Flare',
    planet: 'Mars',
    category: 'health',
    description: 'Lupus, MS, RA, or other autoimmune exacerbation',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 25, unit: 'percent', window: 10 }
    ],
    logic: 'IF (severe_systemic_stress) AND (prolonged_disability) THEN autoimmune_flare_likely',
    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Your body is really struggling. Is your condition flaring?",
      follow_up_prompts: ["Have you called your rheumatologist?"],
      internal_label: 'Autoimmune flare',
      intervention_timing: 'When user mentions flare or autoimmune condition'
    },
    urgency: 'high',
    sensitive: true
  },

  H020_COPD_EXACERBATION: {
    id: 'H020',
    name: 'COPD Exacerbation',
    planet: 'Mars',
    category: 'health',
    description: 'Worsening chronic lung disease',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (respiratory_crisis) AND (severe_limitation) THEN copd_exacerbation_likely',
    confidence_threshold: 0.82,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "Your breathing seems worse. Do you need to go to the hospital?",
      follow_up_prompts: ["Are you using your oxygen?"],
      internal_label: 'COPD exacerbation',
      intervention_timing: 'Immediate - when pattern detected'
    },
    urgency: 'critical',
    sensitive: true
  },

  H021_KIDNEY_DISEASE_PROGRESSION: {
    id: 'H021',
    name: 'Kidney Disease Worsening',
    planet: 'Mars',
    category: 'health',
    description: 'Declining renal function',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 22, unit: 'percent', window: 30 }
    ],
    logic: 'IF (chronic_systemic_decline FOR 30_days) THEN kidney_progression_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Your overall health metrics are declining. When was your last kidney check?",
      follow_up_prompts: ["Are you seeing your nephrologist?"],
      internal_label: 'Kidney disease progression',
      intervention_timing: 'When user mentions kidney issues or labs'
    },
    urgency: 'high',
    sensitive: true
  },

  H022_CANCER_TREATMENT_SIDE_EFFECTS: {
    id: 'H022',
    name: 'Cancer Treatment Impact',
    planet: 'Mars',
    category: 'health',
    description: 'Chemo/radiation side effects',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 50, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 30, unit: 'percent', window: 21 }
    ],
    logic: 'IF (severe_chronic_depletion FOR 21_days) THEN cancer_treatment_impact_likely',
    confidence_threshold: 0.84,
    evidence_required: 4,
    false_positive_rate: 0.11,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Treatment is really taking its toll. How are you holding up?",
      follow_up_prompts: ["Are you in touch with your oncology team?"],
      internal_label: 'Cancer treatment effects',
      intervention_timing: 'When user mentions treatment or cancer'
    },
    urgency: 'high',
    sensitive: true
  },

  // ==================== INJURIES (8 patterns) ====================

  H023_ACUTE_INJURY: {
    id: 'H023',
    name: 'Acute Physical Injury',
    planet: 'Mars',
    category: 'health',
    description: 'Sudden traumatic injury (sprain, strain, fracture)',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 60, unit: 'percent', window: 1 },
      { behavior: 'steps', operator: 'DROPS', threshold: 70, unit: 'percent', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 2 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 }
    ],
    logic: 'IF (sudden_immobility) AND (pain_pattern) THEN acute_injury_likely',
    confidence_threshold: 0.83,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Did you hurt yourself? You stopped moving suddenly.",
      follow_up_prompts: ["Do you need to see a doctor?"],
      internal_label: 'Acute injury',
      intervention_timing: 'Immediate - when pattern detected'
    },
    urgency: 'high',
    sensitive: false
  },

  H024_CONCUSSION: {
    id: 'H024',
    name: 'Concussion/Head Injury',
    planet: 'Mars',
    category: 'health',
    description: 'Traumatic brain injury symptoms',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 2 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 5 },
      { behavior: 'restingHeartRate', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 5 }
    ],
    logic: 'IF (neurological_disruption) AND (severe_symptoms) THEN concussion_likely',
    confidence_threshold: 0.79,
    evidence_required: 4,
    false_positive_rate: 0.15,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Did you hit your head? These patterns are concerning.",
      follow_up_prompts: ["Have you been evaluated?"],
      internal_label: 'Concussion detected',
      intervention_timing: 'Immediate - critical evaluation needed'
    },
    urgency: 'critical',
    sensitive: true
  },

  H025_BACK_INJURY: {
    id: 'H025',
    name: 'Back Injury',
    planet: 'Mars',
    category: 'health',
    description: 'Lumbar/thoracic spine injury',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 50, unit: 'percent', window: 3 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 55, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 }
    ],
    logic: 'IF (sudden_mobility_loss) AND (pain_sleep_disruption) THEN back_injury_likely',
    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "You're barely moving. Is it your back?",
      follow_up_prompts: ["How bad is the pain?"],
      internal_label: 'Back injury',
      intervention_timing: 'When user mentions back or pain'
    },
    urgency: 'high',
    sensitive: false
  },

  H026_SPORTS_INJURY: {
    id: 'H026',
    name: 'Sports/Athletic Injury',
    planet: 'Mars',
    category: 'health',
    description: 'Exercise-related injury in active person',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 70, unit: 'percent', window: 2 },
      { behavior: 'steps', operator: 'DROPS', threshold: 60, unit: 'percent', window: 2 },
      { behavior: 'baseline_was_high', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 14 }
    ],
    logic: 'IF (athlete_sudden_inactivity) THEN sports_injury_likely',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "You went from very active to nothing. What happened?",
      follow_up_prompts: ["Did you hurt yourself working out?"],
      internal_label: 'Sports injury',
      intervention_timing: 'When user mentions injury or athletics'
    },
    urgency: 'medium',
    sensitive: false
  },

  H027_SURGICAL_COMPLICATION: {
    id: 'H027',
    name: 'Post-Surgery Complication',
    planet: 'Mars',
    category: 'health',
    description: 'Infection or issue after surgery',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 5 },
      { behavior: 'post_surgery_context', operator: 'WITHIN', threshold: 30, unit: 'days', window: 30 }
    ],
    logic: 'IF (acute_deterioration) AND (recent_surgery) THEN complication_likely',
    confidence_threshold: 0.82,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Something's not right after your surgery. Have you called your surgeon?",
      follow_up_prompts: ["Do you have fever or increased pain?"],
      internal_label: 'Surgical complication',
      intervention_timing: 'Immediate - when pattern detected'
    },
    urgency: 'critical',
    sensitive: true
  },

  H028_OVERUSE_INJURY: {
    id: 'H028',
    name: 'Overuse Injury (Tendinitis/Stress Fracture)',
    planet: 'Mars',
    category: 'health',
    description: 'Repetitive strain injury from overtraining',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'SUDDEN_DROP', threshold: 50, unit: 'percent', window: 16 }
    ],
    logic: 'IF (overtraining_pattern) THEN (forced_rest) THEN overuse_injury_likely',
    confidence_threshold: 0.78,
    evidence_required: 4,
    false_positive_rate: 0.16,
    detection_window: [14, 21],
    silent_guidance: {
      discovery_question: "You've been pushing hard, and now you're stopped. Overuse injury?",
      follow_up_prompts: ["Have you been ignoring pain?"],
      internal_label: 'Overuse injury',
      intervention_timing: 'When user mentions pain or forced rest'
    },
    urgency: 'medium',
    sensitive: false
  },

  H029_BURN_INJURY: {
    id: 'H029',
    name: 'Burn Injury',
    planet: 'Mars',
    category: 'health',
    description: 'Thermal injury requiring care',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 2 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 5 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 3 }
    ],
    logic: 'IF (acute_pain_stress) AND (inflammation_pattern) THEN burn_injury_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Did you burn yourself? That looks painful.",
      follow_up_prompts: ["Have you had it looked at?"],
      internal_label: 'Burn injury',
      intervention_timing: 'When user mentions burn or injury'
    },
    urgency: 'high',
    sensitive: false
  },

  H030_DENTAL_EMERGENCY: {
    id: 'H030',
    name: 'Dental Emergency/Tooth Pain',
    planet: 'Mars',
    category: 'health',
    description: 'Severe dental issue requiring intervention',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 35, unit: 'percent', window: 3 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 3 }
    ],
    logic: 'IF (severe_pain_pattern) AND (sleep_disruption) THEN dental_emergency_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "You're in pain and not sleeping. Is it a tooth?",
      follow_up_prompts: ["Have you called a dentist?"],
      internal_label: 'Dental emergency',
      intervention_timing: 'When user mentions tooth or pain'
    },
    urgency: 'high',
    sensitive: false
  },

  // ==================== SURGERY & PROCEDURES (8 patterns) ====================

  H031_PRE_SURGERY_ANXIETY: {
    id: 'H031',
    name: 'Pre-Surgery Anxiety',
    planet: 'Mars',
    category: 'health',
    description: 'Stress leading up to scheduled surgery',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 }
    ],
    logic: 'IF (anticipatory_anxiety) AND (sustained_week) THEN pre_surgery_stress_likely',
    confidence_threshold: 0.73,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You seem anxious about something coming up. What is it?",
      follow_up_prompts: ["Do you have a procedure scheduled?"],
      internal_label: 'Pre-surgery anxiety',
      intervention_timing: 'When user mentions surgery or fear'
    },
    urgency: 'low',
    sensitive: false
  },

  H032_POST_SURGERY_RECOVERY: {
    id: 'H032',
    name: 'Normal Post-Surgery Recovery',
    planet: 'Mars',
    category: 'health',
    description: 'Expected healing process after surgery',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 60, unit: 'percent', window: 14 },
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 10, unit: 'percent', window: 14 }
    ],
    logic: 'IF (immobility + healing_pattern) THEN post_surgery_recovery_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You're resting a lot. Are you recovering from surgery?",
      follow_up_prompts: ["How's healing going?"],
      internal_label: 'Post-surgery recovery',
      intervention_timing: 'When user mentions surgery or recovery'
    },
    urgency: 'low',
    sensitive: false
  },

  H033_MAJOR_SURGERY: {
    id: 'H033',
    name: 'Major Surgery Impact',
    planet: 'Mars',
    category: 'health',
    description: 'Significant surgical procedure with extended recovery',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 80, unit: 'percent', window: 3 },
      { behavior: 'steps', operator: 'DROPS', threshold: 85, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 5 }
    ],
    logic: 'IF (near_immobility) AND (surgical_stress) THEN major_surgery_likely',
    confidence_threshold: 0.85,
    evidence_required: 4,
    false_positive_rate: 0.10,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "You had major surgery. How are you feeling?",
      follow_up_prompts: ["Do you have support at home?"],
      internal_label: 'Major surgery',
      intervention_timing: 'When user mentions surgery'
    },
    urgency: 'medium',
    sensitive: true
  },

  H034_OUTPATIENT_PROCEDURE: {
    id: 'H034',
    name: 'Outpatient Procedure',
    planet: 'Mars',
    category: 'health',
    description: 'Minor procedure with quick recovery',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 2 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 5, unit: 'days', window: 7 }
    ],
    logic: 'IF (brief_disruption) AND (quick_recovery) THEN outpatient_procedure_likely',
    confidence_threshold: 0.71,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "Looks like you had a procedure. Everything go okay?",
      follow_up_prompts: ["Are you feeling better?"],
      internal_label: 'Outpatient procedure',
      intervention_timing: 'When user mentions medical appointment'
    },
    urgency: 'low',
    sensitive: false
  },

  H035_ORGAN_TRANSPLANT: {
    id: 'H035',
    name: 'Organ Transplant Surgery',
    planet: 'Mars',
    category: 'health',
    description: 'Major transplant surgery with lifelong implications',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 90, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 50, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 30, unit: 'percent', window: 30 }
    ],
    logic: 'IF (extreme_surgical_impact) AND (prolonged_recovery) THEN transplant_likely',
    confidence_threshold: 0.87,
    evidence_required: 4,
    false_positive_rate: 0.08,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You're going through something massive. How can I support you?",
      follow_up_prompts: ["Are you in close contact with your medical team?"],
      internal_label: 'Transplant surgery',
      intervention_timing: 'When user mentions transplant'
    },
    urgency: 'critical',
    sensitive: true
  },

  H036_COSMETIC_SURGERY: {
    id: 'H036',
    name: 'Cosmetic Surgery Recovery',
    planet: 'Mars',
    category: 'health',
    description: 'Elective cosmetic procedure',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 10, unit: 'percent', window: 10 }
    ],
    logic: 'IF (moderate_disruption) AND (healing_pattern) THEN cosmetic_surgery_likely',
    confidence_threshold: 0.69,
    evidence_required: 3,
    false_positive_rate: 0.24,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "You're recovering from something. Want to talk about it?",
      follow_up_prompts: ["How's healing going?"],
      internal_label: 'Cosmetic surgery',
      intervention_timing: 'When user mentions procedure or recovery'
    },
    urgency: 'low',
    sensitive: true
  },

  H037_EMERGENCY_SURGERY: {
    id: 'H037',
    name: 'Emergency Surgery',
    planet: 'Mars',
    category: 'health',
    description: 'Unplanned urgent surgical intervention',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 85, unit: 'percent', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 2 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 2 }
    ],
    logic: 'IF (sudden_severe_disruption) AND (crisis_pattern) THEN emergency_surgery_likely',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.11,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Something serious happened. Are you okay?",
      follow_up_prompts: ["Were you in the hospital?"],
      internal_label: 'Emergency surgery',
      intervention_timing: 'Immediate - when pattern detected'
    },
    urgency: 'critical',
    sensitive: true
  },

  H038_BIOPSY_ANXIETY: {
    id: 'H038',
    name: 'Biopsy/Test Results Anxiety',
    planet: 'Mars',
    category: 'health',
    description: 'Stress waiting for diagnostic results',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 14, unit: 'days', window: 14 }
    ],
    logic: 'IF (anticipatory_anxiety) AND (resolves_after_results) THEN biopsy_anxiety_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.21,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You're worried about something. Waiting for test results?",
      follow_up_prompts: ["Do you want to talk about it?"],
      internal_label: 'Biopsy/test anxiety',
      intervention_timing: 'When user mentions testing or waiting'
    },
    urgency: 'medium',
    sensitive: true
  },

  // ==================== MEDICATION CHANGES (6 patterns) ====================

  H039_NEW_MEDICATION_SIDE_EFFECTS: {
    id: 'H039',
    name: 'New Medication Side Effects',
    planet: 'Mars',
    category: 'health',
    description: 'Adverse reactions to new prescription',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'CHANGES_PATTERN', threshold: 25, unit: 'percent', window: 7 }
    ],
    logic: 'IF (new_physiological_disruption) AND (sustained_week) THEN medication_reaction_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Your body seems to be reacting to something. Did you start a new medication?",
      follow_up_prompts: ["Have you told your doctor?"],
      internal_label: 'Medication side effects',
      intervention_timing: 'When user mentions new medication or feeling off'
    },
    urgency: 'medium',
    sensitive: true
  },

  H040_MEDICATION_TITRATION: {
    id: 'H040',
    name: 'Medication Dose Adjustment',
    planet: 'Mars',
    category: 'health',
    description: 'Body adjusting to new dosage',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 12, unit: 'percent', window: 10 },
      { behavior: 'restingHeartRate', operator: 'CHANGES_BASELINE', threshold: 10, unit: 'percent', window: 10 }
    ],
    logic: 'IF (metabolic_adjustment) AND (stabilizes_after_2_weeks) THEN dose_change_likely',
    confidence_threshold: 0.70,
    evidence_required: 2,
    false_positive_rate: 0.23,
    detection_window: [7, 14],
    silent_guidance: {
      discovery_question: "Did your doctor change your medication dose?",
      follow_up_prompts: ["How are you adjusting?"],
      internal_label: 'Medication titration',
      intervention_timing: 'When user mentions medication changes'
    },
    urgency: 'low',
    sensitive: false
  },

  H041_STOPPING_MEDICATION: {
    id: 'H041',
    name: 'Medication Discontinuation',
    planet: 'Mars',
    category: 'health',
    description: 'Withdrawal or rebound effects from stopping meds',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 5 }
    ],
    logic: 'IF (withdrawal_pattern) AND (recent_discontinuation) THEN medication_cessation_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Did you stop taking a medication? Your body seems to be adjusting.",
      follow_up_prompts: ["Did your doctor approve that?"],
      internal_label: 'Medication discontinuation',
      intervention_timing: 'When user mentions stopping meds'
    },
    urgency: 'medium',
    sensitive: true
  },

  H042_ANTIBIOTIC_COURSE: {
    id: 'H042',
    name: 'Antibiotic Treatment',
    planet: 'Mars',
    category: 'health',
    description: 'Taking antibiotics for infection',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'GRADUALLY_IMPROVES', threshold: 20, unit: 'percent', window: 10 },
      { behavior: 'sleepQuality', operator: 'IMPROVES', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (improvement_pattern) AND (recovery_from_infection) THEN antibiotic_treatment_likely',
    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "Looks like you're getting better. Are you on antibiotics?",
      follow_up_prompts: ["Make sure to finish the full course!"],
      internal_label: 'Antibiotic treatment',
      intervention_timing: 'When user mentions infection or antibiotics'
    },
    urgency: 'low',
    sensitive: false
  },

  H043_INSULIN_ADJUSTMENT: {
    id: 'H043',
    name: 'Insulin Dosing Changes',
    planet: 'Mars',
    category: 'health',
    description: 'Diabetic adjusting insulin regimen',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'CHANGES_PATTERN', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (glycemic_volatility) AND (diabetic_context) THEN insulin_adjustment_likely',
    confidence_threshold: 0.73,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Your patterns are all over the place. Are you adjusting your insulin?",
      follow_up_prompts: ["How are your blood sugars?"],
      internal_label: 'Insulin adjustment',
      intervention_timing: 'When user mentions diabetes or insulin'
    },
    urgency: 'medium',
    sensitive: true
  },

  H044_ANTIDEPRESSANT_CHANGE: {
    id: 'H044',
    name: 'Antidepressant Change',
    planet: 'Mars',
    category: 'health',
    description: 'Starting/switching mental health medication',
    conditions: [
      { behavior: 'sleepSchedule', operator: 'CHANGES_PATTERN', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'CHANGES_PATTERN', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (neurochemical_adjustment) AND (sustained_2_weeks) THEN antidepressant_change_likely',
    confidence_threshold: 0.71,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Your rhythms are shifting. Did you change your mental health meds?",
      follow_up_prompts: ["How are you feeling on the new one?"],
      internal_label: 'Antidepressant change',
      intervention_timing: 'When user mentions medication or mental health'
    },
    urgency: 'medium',
    sensitive: true
  },

  // ==================== HOSPITALIZATION (4 patterns) ====================

  H045_HOSPITAL_ADMISSION: {
    id: 'H045',
    name: 'Hospital Admission',
    planet: 'Mars',
    category: 'health',
    description: 'Inpatient stay for medical issue',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 80, unit: 'percent', window: 3 },
      { behavior: 'sleepSchedule', operator: 'HIGHLY_IRREGULAR', threshold: 40, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 5 }
    ],
    logic: 'IF (near_immobility) AND (disrupted_routine) THEN hospitalization_likely',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Were you in the hospital? I hope you're okay.",
      follow_up_prompts: ["What happened?"],
      internal_label: 'Hospitalization',
      intervention_timing: 'When user mentions hospital or health crisis'
    },
    urgency: 'high',
    sensitive: true
  },

  H046_ICU_STAY: {
    id: 'H046',
    name: 'ICU/Critical Care',
    planet: 'Mars',
    category: 'health',
    description: 'Critical illness requiring intensive care',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 95, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 35, unit: 'percent', window: 5 },
      { behavior: 'sleepSchedule', operator: 'HIGHLY_IRREGULAR', threshold: 50, unit: 'percent', window: 7 }
    ],
    logic: 'IF (near_death_pattern) AND (complete_immobility) THEN icu_stay_likely',
    confidence_threshold: 0.88,
    evidence_required: 3,
    false_positive_rate: 0.08,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "You went through something extremely serious. How are you now?",
      follow_up_prompts: ["Are you getting follow-up care?"],
      internal_label: 'ICU stay',
      intervention_timing: 'When user mentions critical illness'
    },
    urgency: 'critical',
    sensitive: true
  },

  H047_ER_VISIT: {
    id: 'H047',
    name: 'Emergency Room Visit',
    planet: 'Mars',
    category: 'health',
    description: 'Acute ER visit without admission',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 60, unit: 'percent', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 2 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 3, unit: 'days', window: 5 }
    ],
    logic: 'IF (acute_disruption) AND (quick_resolution) THEN er_visit_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Did you have to go to the ER? Everything okay now?",
      follow_up_prompts: ["What happened?"],
      internal_label: 'ER visit',
      intervention_timing: 'When user mentions emergency or hospital'
    },
    urgency: 'high',
    sensitive: false
  },

  H048_HOSPITAL_DISCHARGE: {
    id: 'H048',
    name: 'Hospital Discharge Recovery',
    planet: 'Mars',
    category: 'health',
    description: 'Transitioning home after inpatient stay',
    conditions: [
      { behavior: 'steps', operator: 'GRADUALLY_INCREASES', threshold: 20, unit: 'percent', window: 10 },
      { behavior: 'sleepSchedule', operator: 'NORMALIZING', threshold: 15, unit: 'percent', window: 10 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 10 }
    ],
    logic: 'IF (recovery_trajectory) AND (routine_restoration) THEN post_hospital_discharge_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [7, 14],
    silent_guidance: {
      discovery_question: "You're recovering at home now. How's it going?",
      follow_up_prompts: ["Do you have support?"],
      internal_label: 'Hospital discharge',
      intervention_timing: 'When user mentions coming home from hospital'
    },
    urgency: 'medium',
    sensitive: false
  },

  // ==================== DIAGNOSTIC EVENTS (6 patterns) ====================

  H049_CANCER_DIAGNOSIS: {
    id: 'H049',
    name: 'Cancer Diagnosis',
    planet: 'Mars',
    category: 'health',
    description: 'Receiving cancer diagnosis',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 25, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 35, unit: 'percent', window: 5 }
    ],
    logic: 'IF (severe_existential_crisis) AND (profound_shock) THEN cancer_diagnosis_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Something really serious happened. I'm here for you.",
      follow_up_prompts: ["Do you want to talk about it?"],
      internal_label: 'Cancer diagnosis',
      intervention_timing: 'When user mentions diagnosis or cancer'
    },
    urgency: 'critical',
    sensitive: true
  },

  H050_CLEAR_SCAN_RELIEF: {
    id: 'H050',
    name: 'Clear Scan/Test Results',
    planet: 'Mars',
    category: 'health',
    description: 'Relief from good medical news',
    conditions: [
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'IMPROVES', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 5 }
    ],
    logic: 'IF (sudden_relief_pattern) AND (anxiety_resolution) THEN good_news_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "You seem so much lighter. Did you get good news?",
      follow_up_prompts: ["That's wonderful!"],
      internal_label: 'Clear scan relief',
      intervention_timing: 'When user mentions test results or relief'
    },
    urgency: 'low',
    sensitive: false
  },

  H051_ABNORMAL_LAB_RESULTS: {
    id: 'H051',
    name: 'Abnormal Lab Results',
    planet: 'Mars',
    category: 'health',
    description: 'Concerning bloodwork or test findings',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 }
    ],
    logic: 'IF (moderate_anxiety) AND (medical_context) THEN abnormal_results_likely',
    confidence_threshold: 0.70,
    evidence_required: 2,
    false_positive_rate: 0.23,
    detection_window: [3, 7],
    silent_guidance: {
      discovery_question: "Did you get some lab results that concerned you?",
      follow_up_prompts: ["Are you following up with your doctor?"],
      internal_label: 'Abnormal lab anxiety',
      intervention_timing: 'When user mentions labs or testing'
    },
    urgency: 'medium',
    sensitive: true
  },

  H052_GENETIC_TEST_RESULTS: {
    id: 'H052',
    name: 'Genetic Testing Results',
    planet: 'Mars',
    category: 'health',
    description: 'Learning about hereditary health risks',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'CHANGES_PATTERN', threshold: 25, unit: 'percent', window: 10 }
    ],
    logic: 'IF (existential_anxiety) AND (lifestyle_changes) THEN genetic_results_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.21,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Did you learn something about your health that changed your perspective?",
      follow_up_prompts: ["How are you processing that?"],
      internal_label: 'Genetic test results',
      intervention_timing: 'When user mentions genetics or family history'
    },
    urgency: 'medium',
    sensitive: true
  },

  H053_IMAGING_PROCEDURE: {
    id: 'H053',
    name: 'Imaging Test (MRI/CT/PET)',
    planet: 'Mars',
    category: 'health',
    description: 'Undergoing diagnostic imaging',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 5, unit: 'days', window: 7 }
    ],
    logic: 'IF (mild_anxiety_spike) AND (resolves_quickly) THEN imaging_test_likely',
    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.25,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "Did you have a scan or imaging test?",
      follow_up_prompts: ["Are you waiting for results?"],
      internal_label: 'Imaging procedure',
      intervention_timing: 'When user mentions medical testing'
    },
    urgency: 'low',
    sensitive: false
  },

  H054_ENDOSCOPY_COLONOSCOPY: {
    id: 'H054',
    name: 'Endoscopy/Colonoscopy',
    planet: 'Mars',
    category: 'health',
    description: 'GI diagnostic procedure',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 2 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'pattern_resolves', operator: 'WITHIN', threshold: 3, unit: 'days', window: 5 }
    ],
    logic: 'IF (procedure_disruption) AND (quick_recovery) THEN endoscopy_likely',
    confidence_threshold: 0.73,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "Did you have a GI procedure? How'd it go?",
      follow_up_prompts: ["Any findings?"],
      internal_label: 'Endoscopy/colonoscopy',
      intervention_timing: 'When user mentions procedure'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== COMPLEX HEALTH PATTERNS (10 patterns) ====================

  H055_CHRONIC_FATIGUE_SYNDROME: {
    id: 'H055',
    name: 'Chronic Fatigue Syndrome/ME',
    planet: 'Mars',
    category: 'health',
    description: 'Post-exertional malaise and chronic exhaustion',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 50, unit: 'percent', window: 60 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 60 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 40, unit: 'percent', window: 60 },
      { behavior: 'post_exertional_crash', operator: 'PATTERN_PRESENT', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (chronic_exhaustion FOR 60_days) AND (post_exertional_malaise) THEN cfs_likely',
    confidence_threshold: 0.83,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "You've been exhausted for a long time. Have you been diagnosed with anything?",
      follow_up_prompts: ["Have you heard of ME/CFS?"],
      internal_label: 'Chronic fatigue syndrome',
      intervention_timing: 'When user mentions chronic exhaustion'
    },
    urgency: 'high',
    sensitive: true
  },

  H056_LONG_COVID: {
    id: 'H056',
    name: 'Long COVID Symptoms',
    planet: 'Mars',
    category: 'health',
    description: 'Persistent symptoms after COVID infection',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 60 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 40, unit: 'percent', window: 60 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 60 },
      { behavior: 'post_covid_context', operator: 'WITHIN', threshold: 180, unit: 'days', window: 180 }
    ],
    logic: 'IF (chronic_post_viral_syndrome) AND (recent_covid) THEN long_covid_likely',
    confidence_threshold: 0.81,
    evidence_required: 4,
    false_positive_rate: 0.13,
    detection_window: [30, 90],
    silent_guidance: {
      discovery_question: "You haven't bounced back since COVID. How long has it been?",
      follow_up_prompts: ["Have you talked to a long COVID specialist?"],
      internal_label: 'Long COVID',
      intervention_timing: 'When user mentions lingering symptoms'
    },
    urgency: 'high',
    sensitive: true
  },

  H057_EATING_DISORDER_RELAPSE: {
    id: 'H057',
    name: 'Eating Disorder Behaviors',
    planet: 'Mars',
    category: 'health',
    description: 'Restrictive eating or exercise patterns',
    conditions: [
      { behavior: 'activeMinutes', operator: 'EXCESSIVE', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 21 }
    ],
    logic: 'IF (compulsive_exercise) AND (poor_recovery) THEN eating_disorder_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You're pushing your body really hard without recovering. Are you okay?",
      follow_up_prompts: ["Do you have support around this?"],
      internal_label: 'Eating disorder pattern',
      intervention_timing: 'When user mentions exercise or eating'
    },
    urgency: 'critical',
    sensitive: true
  },

  H058_HEAT_EXHAUSTION: {
    id: 'H058',
    name: 'Heat Exhaustion/Heat Stroke',
    planet: 'Mars',
    category: 'health',
    description: 'Overheating from exercise or environment',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 1 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 70, unit: 'percent', window: 2 }
    ],
    logic: 'IF (sudden_thermoregulation_failure) THEN heat_exhaustion_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [1, 2],
    silent_guidance: {
      discovery_question: "Did you overheat? That's dangerous.",
      follow_up_prompts: ["Are you hydrating and cooling down?"],
      internal_label: 'Heat exhaustion',
      intervention_timing: 'Immediate - when pattern detected'
    },
    urgency: 'critical',
    sensitive: false
  },

  H059_DEHYDRATION: {
    id: 'H059',
    name: 'Severe Dehydration',
    planet: 'Mars',
    category: 'health',
    description: 'Fluid deficit affecting physiology',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 2 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 3 }
    ],
    logic: 'IF (cardiovascular_stress) AND (performance_decline) THEN dehydration_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Are you drinking enough water? Your body seems dehydrated.",
      follow_up_prompts: ["When did you last have fluids?"],
      internal_label: 'Dehydration',
      intervention_timing: 'When user mentions feeling unwell'
    },
    urgency: 'high',
    sensitive: false
  },

  H060_ELECTROLYTE_IMBALANCE: {
    id: 'H060',
    name: 'Electrolyte Imbalance',
    planet: 'Mars',
    category: 'health',
    description: 'Sodium, potassium, or other imbalance',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'VOLATILE', threshold: 18, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 35, unit: 'percent', window: 5 }
    ],
    logic: 'IF (cardiac_instability) AND (muscle_dysfunction) THEN electrolyte_issue_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [3, 7],
    silent_guidance: {
      discovery_question: "Your heart rhythm is off. Have you been sick or not eating?",
      follow_up_prompts: ["You might need labs checked."],
      internal_label: 'Electrolyte imbalance',
      intervention_timing: 'When user mentions heart issues or weakness'
    },
    urgency: 'high',
    sensitive: true
  },

  H061_BLOOD_CLOT: {
    id: 'H061',
    name: 'Blood Clot/DVT',
    planet: 'Mars',
    category: 'health',
    description: 'Thrombosis causing pain and swelling',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 60, unit: 'percent', window: 2 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 3 }
    ],
    logic: 'IF (sudden_limb_immobility) AND (vascular_stress) THEN blood_clot_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Do you have pain and swelling in your leg? This could be serious.",
      follow_up_prompts: ["You need to see a doctor immediately."],
      internal_label: 'Blood clot suspected',
      intervention_timing: 'Immediate - emergency evaluation needed'
    },
    urgency: 'critical',
    sensitive: true
  },

  H062_ANEMIA: {
    id: 'H062',
    name: 'Anemia',
    planet: 'Mars',
    category: 'health',
    description: 'Low iron/hemoglobin causing fatigue',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 }
    ],
    logic: 'IF (chronic_fatigue) AND (elevated_rhr) THEN anemia_likely',
    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You've been really tired for a while. When was your last bloodwork?",
      follow_up_prompts: ["Could be anemia—have you had your iron checked?"],
      internal_label: 'Anemia suspected',
      intervention_timing: 'When user mentions chronic fatigue'
    },
    urgency: 'medium',
    sensitive: false
  },

  H063_VITAMIN_D_DEFICIENCY: {
    id: 'H063',
    name: 'Vitamin D Deficiency',
    planet: 'Mars',
    category: 'health',
    description: 'Low vitamin D causing fatigue and mood issues',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 45 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 45 },
      { behavior: 'seasonal_pattern', operator: 'WINTER', threshold: 1, unit: 'boolean', window: 45 }
    ],
    logic: 'IF (chronic_fatigue) AND (winter_onset) THEN vitamin_d_deficiency_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.23,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Winter is hitting you hard. Have you had your vitamin D checked?",
      follow_up_prompts: ["Might be worth supplementing."],
      internal_label: 'Vitamin D deficiency',
      intervention_timing: 'When user mentions winter fatigue'
    },
    urgency: 'low',
    sensitive: false
  },

  H064_ALTITUDE_SICKNESS: {
    id: 'H064',
    name: 'Altitude Sickness',
    planet: 'Mars',
    category: 'health',
    description: 'High elevation affecting physiology',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 3 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 45, unit: 'percent', window: 5 }
    ],
    logic: 'IF (acute_physiological_stress) AND (elevation_context) THEN altitude_sickness_likely',
    confidence_threshold: 0.79,
    evidence_required: 4,
    false_positive_rate: 0.15,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Are you at high elevation? Your body is struggling.",
      follow_up_prompts: ["You might need to descend or get oxygen."],
      internal_label: 'Altitude sickness',
      intervention_timing: 'When user mentions travel or mountains'
    },
    urgency: 'high',
    sensitive: false
  },

  // ==================== REPRODUCTIVE HEALTH (6 patterns) ====================

  H065_MENSTRUAL_PAIN: {
    id: 'H065',
    name: 'Severe Menstrual Cramping',
    planet: 'Mars',
    category: 'health',
    description: 'Dysmenorrhea affecting function',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 2 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 3 },
      { behavior: 'pattern_cyclical', operator: 'MONTHLY', threshold: 1, unit: 'boolean', window: 90 }
    ],
    logic: 'IF (cyclical_pain_pattern) AND (monthly_recurrence) THEN menstrual_pain_likely',
    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "Are you dealing with your period? Seems painful.",
      follow_up_prompts: ["Have you talked to a doctor about the pain?"],
      internal_label: 'Menstrual cramping',
      intervention_timing: 'When user mentions period or pain'
    },
    urgency: 'low',
    sensitive: true
  },

  H066_ENDOMETRIOSIS_FLARE: {
    id: 'H066',
    name: 'Endometriosis Flare',
    planet: 'Mars',
    category: 'health',
    description: 'Severe endometrial pain and inflammation',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 28, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 7 }
    ],
    logic: 'IF (severe_pelvic_pain) AND (functional_disability) THEN endometriosis_flare_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "Your endo seems to be flaring. How bad is it?",
      follow_up_prompts: ["Do you need to see your gynecologist?"],
      internal_label: 'Endometriosis flare',
      intervention_timing: 'When user mentions pelvic pain'
    },
    urgency: 'high',
    sensitive: true
  },

  H067_PCOS_SYMPTOMS: {
    id: 'H067',
    name: 'PCOS Symptom Exacerbation',
    planet: 'Mars',
    category: 'health',
    description: 'Polycystic ovarian syndrome flare',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 18, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'CHANGES_PATTERN', threshold: 25, unit: 'percent', window: 21 }
    ],
    logic: 'IF (hormonal_disruption) AND (metabolic_changes) THEN pcos_flare_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Your PCOS seems to be acting up. What's changed?",
      follow_up_prompts: ["Are you managing it with your doctor?"],
      internal_label: 'PCOS exacerbation',
      intervention_timing: 'When user mentions PCOS or hormones'
    },
    urgency: 'medium',
    sensitive: true
  },

  H068_MENOPAUSE_SYMPTOMS: {
    id: 'H068',
    name: 'Menopause/Perimenopause Symptoms',
    planet: 'Mars',
    category: 'health',
    description: 'Hot flashes, sleep disruption, mood changes',
    conditions: [
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 25, unit: 'percent', window: 45 },
      { behavior: 'restingHeartRate', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 45 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 45 }
    ],
    logic: 'IF (hormonal_volatility) AND (chronic_sleep_disruption) THEN menopause_likely',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Are you going through menopause? These patterns suggest hormonal changes.",
      follow_up_prompts: ["Have you talked to your doctor about HRT?"],
      internal_label: 'Menopause symptoms',
      intervention_timing: 'When user mentions hot flashes or hormones'
    },
    urgency: 'medium',
    sensitive: true
  },

  H069_PROSTATE_ISSUES: {
    id: 'H069',
    name: 'Prostate Problems',
    planet: 'Mars',
    category: 'health',
    description: 'BPH or prostatitis symptoms',
    conditions: [
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 22, unit: 'percent', window: 30 },
      { behavior: 'sleepSchedule', operator: 'IRREGULAR', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 12, unit: 'percent', window: 30 }
    ],
    logic: 'IF (nocturnal_disruption) AND (male_context) THEN prostate_issue_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.21,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You're up a lot at night. Prostate bothering you?",
      follow_up_prompts: ["Have you seen a urologist?"],
      internal_label: 'Prostate issues',
      intervention_timing: 'When user mentions urinary issues'
    },
    urgency: 'medium',
    sensitive: true
  },

  H070_ERECTILE_DYSFUNCTION: {
    id: 'H070',
    name: 'Erectile Dysfunction (Cardiovascular Marker)',
    planet: 'Mars',
    category: 'health',
    description: 'ED as early cardiovascular warning sign',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 45 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'percent', window: 45 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 45 }
    ],
    logic: 'IF (vascular_dysfunction) AND (cardiovascular_decline) THEN ed_cardiovascular_marker_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Your cardiovascular health seems off. Have you noticed any changes?",
      follow_up_prompts: ["ED can be an early sign—worth getting checked."],
      internal_label: 'ED cardiovascular marker',
      intervention_timing: 'When user mentions cardiovascular or intimate health'
    },
    urgency: 'medium',
    sensitive: true
  },

  // ==================== ADDITIONAL ANOMALIES (10 patterns) ====================

  H071_CHEMOTHERAPY_CYCLE: {
    id: 'H071',
    name: 'Chemotherapy Treatment Cycle',
    planet: 'Mars',
    category: 'health',
    description: 'Predictable decline and recovery with chemo schedule',
    conditions: [
      { behavior: 'hrv', operator: 'CYCLICAL_DROPS', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'CYCLICAL_DROPS', threshold: 50, unit: 'percent', window: 21 },
      { behavior: 'pattern_cyclical', operator: 'EVERY_2_3_WEEKS', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (cyclical_severe_decline) AND (treatment_schedule) THEN chemo_cycle_confirmed',
    confidence_threshold: 0.85,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "I can see your treatment schedule in the data. How are you holding up?",
      follow_up_prompts: ["What can I do to support you?"],
      internal_label: 'Chemo cycle pattern',
      intervention_timing: 'When user mentions treatment'
    },
    urgency: 'high',
    sensitive: true
  },

  H072_DIALYSIS_SCHEDULE: {
    id: 'H072',
    name: 'Dialysis Treatment Schedule',
    planet: 'Mars',
    category: 'health',
    description: 'Regular dialysis causing cyclical fatigue',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 60, unit: 'percent', window: 1 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 40, unit: 'percent', window: 1 },
      { behavior: 'pattern_cyclical', operator: 'EVERY_2_3_DAYS', threshold: 1, unit: 'boolean', window: 21 }
    ],
    logic: 'IF (cyclical_exhaustion) AND (3x_weekly_pattern) THEN dialysis_schedule_confirmed',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "I can see your dialysis days. How are you managing?",
      follow_up_prompts: ["Are you on a transplant list?"],
      internal_label: 'Dialysis schedule',
      intervention_timing: 'When user mentions kidney disease'
    },
    urgency: 'high',
    sensitive: true
  },

  H073_RADIATION_THERAPY: {
    id: 'H073',
    name: 'Radiation Therapy Course',
    planet: 'Mars',
    category: 'health',
    description: 'Daily radiation causing cumulative fatigue',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_DECLINES', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'GRADUALLY_DECLINES', threshold: 40, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'GRADUALLY_DECLINES', threshold: 35, unit: 'percent', window: 30 }
    ],
    logic: 'IF (cumulative_decline) AND (daily_treatment_context) THEN radiation_therapy_likely',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Radiation is really taking its toll. How many more sessions?",
      follow_up_prompts: ["What helps you get through it?"],
      internal_label: 'Radiation therapy',
      intervention_timing: 'When user mentions cancer treatment'
    },
    urgency: 'high',
    sensitive: true
  },

  H074_IMMUNOTHERAPY_RESPONSE: {
    id: 'H074',
    name: 'Immunotherapy Treatment',
    planet: 'Mars',
    category: 'health',
    description: 'Immune activation from cancer immunotherapy',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (immune_activation_pattern) AND (treatment_context) THEN immunotherapy_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Your immune system is really active. How's immunotherapy going?",
      follow_up_prompts: ["Are you managing the side effects okay?"],
      internal_label: 'Immunotherapy response',
      intervention_timing: 'When user mentions cancer treatment'
    },
    urgency: 'medium',
    sensitive: true
  },

  H075_STEROID_TREATMENT: {
    id: 'H075',
    name: 'Corticosteroid Treatment',
    planet: 'Mars',
    category: 'health',
    description: 'Prednisone or other steroid effects',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 7 }
    ],
    logic: 'IF (steroid_activation_pattern) AND (insomnia) THEN corticosteroid_treatment_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Are you on steroids? I can see the effects.",
      follow_up_prompts: ["How long is your course?"],
      internal_label: 'Steroid treatment',
      intervention_timing: 'When user mentions steroids or prednisone'
    },
    urgency: 'low',
    sensitive: false
  },

  H076_PHYSICAL_THERAPY: {
    id: 'H076',
    name: 'Physical Therapy Progress',
    planet: 'Mars',
    category: 'health',
    description: 'Gradual recovery through PT',
    conditions: [
      { behavior: 'activeMinutes', operator: 'GRADUALLY_INCREASES', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'steps', operator: 'GRADUALLY_INCREASES', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (steady_functional_improvement) THEN physical_therapy_progress_likely',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You're making really good progress! PT going well?",
      follow_up_prompts: ["What's your goal?"],
      internal_label: 'PT progress',
      intervention_timing: 'When user mentions recovery or PT'
    },
    urgency: 'low',
    sensitive: false
  },

  H077_CHRONIC_INSOMNIA: {
    id: 'H077',
    name: 'Chronic Insomnia',
    planet: 'Mars',
    category: 'health',
    description: 'Persistent severe sleep disorder',
    conditions: [
      { behavior: 'sleepDuration', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 35, unit: 'percent', window: 60 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 60 }
    ],
    logic: 'IF (chronic_sleep_deprivation FOR 60_days) THEN insomnia_confirmed',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.11,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "You haven't slept well in months. Have you seen a sleep specialist?",
      follow_up_prompts: ["This is really affecting your health."],
      internal_label: 'Chronic insomnia',
      intervention_timing: 'When user mentions sleep issues'
    },
    urgency: 'high',
    sensitive: true
  },

  H078_SLEEP_APNEA: {
    id: 'H078',
    name: 'Sleep Apnea Pattern',
    planet: 'Mars',
    category: 'health',
    description: 'Obstructive sleep apnea affecting recovery',
    conditions: [
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 30, unit: 'percent', window: 45 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 45 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'percent', window: 45 }
    ],
    logic: 'IF (poor_sleep_quality) AND (low_recovery) AND (elevated_rhr) THEN sleep_apnea_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "You never wake up rested. Have you been tested for sleep apnea?",
      follow_up_prompts: ["You might need a sleep study."],
      internal_label: 'Sleep apnea suspected',
      intervention_timing: 'When user mentions poor sleep or snoring'
    },
    urgency: 'high',
    sensitive: true
  },

  H079_CPAP_ADJUSTMENT: {
    id: 'H079',
    name: 'CPAP Treatment Start',
    planet: 'Mars',
    category: 'health',
    description: 'Starting CPAP for sleep apnea',
    conditions: [
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'GRADUALLY_IMPROVES', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'restingHeartRate', operator: 'DECREASES', threshold: 10, unit: 'percent', window: 21 }
    ],
    logic: 'IF (sleep_quality_improvement) AND (cardiovascular_improvement) THEN cpap_treatment_likely',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Your sleep is so much better! Did you start CPAP?",
      follow_up_prompts: ["How are you adjusting to it?"],
      internal_label: 'CPAP treatment start',
      intervention_timing: 'When user mentions CPAP or sleep improvement'
    },
    urgency: 'low',
    sensitive: false
  },

  H080_OXYGEN_THERAPY: {
    id: 'H080',
    name: 'Supplemental Oxygen Therapy',
    planet: 'Mars',
    category: 'health',
    description: 'Using supplemental oxygen at home',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 60, unit: 'percent', window: 45 },
      { behavior: 'steps', operator: 'CHRONIC_LOW', threshold: 70, unit: 'percent', window: 45 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 15, unit: 'percent', window: 45 }
    ],
    logic: 'IF (severe_respiratory_limitation) AND (chronic_hypoxia_pattern) THEN oxygen_therapy_likely',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "You're on oxygen now. How are you managing?",
      follow_up_prompts: ["Are you getting enough support?"],
      internal_label: 'Oxygen therapy',
      intervention_timing: 'When user mentions breathing or oxygen'
    },
    urgency: 'high',
    sensitive: true
  }

};
