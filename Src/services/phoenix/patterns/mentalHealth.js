// Mental Health Patterns - 70 patterns covering depression, anxiety, panic, PTSD, bipolar, eating disorders, addiction, therapy, medication, crises, and anomalies
// Pattern IDs: MH001-MH070

module.exports = {
  // ========================================
  // DEPRESSION & LOW MOOD (10 patterns)
  // ========================================
  MH001_MAJOR_DEPRESSION_ONSET: {
    id: 'MH001',
    name: 'Major Depression Onset',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Beginning of major depressive episode',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'sleepDuration', operator: 'VOLATILE', threshold: 2, unit: 'hours', window: 14 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 21 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 8, unit: 'bpm', window: 21 }
    ],
    logic: 'IF (chronic_low_hrv) AND (sleep_disruption) AND (activity_collapse) THEN depression_likely',
    confidence_threshold: 0.86,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "I've noticed some changes in your patterns lately. How have you been feeling emotionally?",
      follow_up_prompts: ["Have you thought about talking to someone?", "What's been on your mind?"],
      internal_label: 'Possible depression onset',
      intervention_timing: 'When user mentions mood or struggles'
    },
    urgency: 'high',
    sensitive: true
  },

  MH002_DEPRESSION_WORSENING: {
    id: 'MH002',
    name: 'Depression Worsening',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Existing depression getting worse',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (worsening_physiology) AND (declining_activity) THEN depression_deepening',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Things seem tougher than usual. Is everything okay?",
      follow_up_prompts: ["Do you need to reach out to your therapist?"],
      internal_label: 'Depression worsening',
      intervention_timing: 'Immediate, gentle check-in'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH003_DEPRESSION_IMPROVING: {
    id: 'MH003',
    name: 'Depression Improving',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Recovery from depressive episode',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (improving_physiology) AND (returning_activity) THEN recovery_underway',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You seem to be doing better lately. How are you feeling?",
      follow_up_prompts: ["What's been helping?"],
      internal_label: 'Depression improving',
      intervention_timing: 'When user mentions feeling better'
    },
    urgency: 'low',
    sensitive: true
  },

  MH004_SEASONAL_AFFECTIVE_DISORDER: {
    id: 'MH004',
    name: 'Seasonal Affective Disorder Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Seasonal depression pattern emerging',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 90, unit: 'minutes', window: 30 }
    ],
    logic: 'IF (seasonal_timing) AND (mood_decline) AND (oversleeping) THEN SAD_likely',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Have you noticed changes in your energy with the season changing?",
      follow_up_prompts: ["Have you considered light therapy?"],
      internal_label: 'Seasonal depression',
      intervention_timing: 'When user mentions seasonal changes'
    },
    urgency: 'medium',
    sensitive: true
  },

  MH005_ANHEDONIA_PATTERN: {
    id: 'MH005',
    name: 'Anhedonia Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Loss of pleasure/interest pattern',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'steps', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (sustained_inactivity) AND (low_hrv) THEN anhedonia_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You've been less active lately. What's on your mind?",
      follow_up_prompts: ["Are you still enjoying the things you used to?"],
      internal_label: 'Anhedonia pattern',
      intervention_timing: 'When user mentions loss of interest'
    },
    urgency: 'high',
    sensitive: true
  },

  MH006_POST_HOLIDAY_DEPRESSION: {
    id: 'MH006',
    name: 'Post-Holiday Depression',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Depression following holidays',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 10 }
    ],
    logic: 'IF (post_holiday_timing) AND (mood_crash) THEN holiday_depression',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "How are you adjusting after the holidays?",
      follow_up_prompts: ["Sometimes the comedown is tough. How are you coping?"],
      internal_label: 'Post-holiday blues',
      intervention_timing: 'Week after major holidays'
    },
    urgency: 'medium',
    sensitive: true
  },

  MH007_GRIEF_RELATED_DEPRESSION: {
    id: 'MH007',
    name: 'Grief-Related Depression',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Depression following loss',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'sleepDuration', operator: 'VOLATILE', threshold: 3, unit: 'hours', window: 14 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 45, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 14 }
    ],
    logic: 'IF (severe_physiological_disruption) AND (activity_collapse) THEN grief_likely',
    confidence_threshold: 0.85,
    evidence_required: 4,
    false_positive_rate: 0.15,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "I'm seeing some really difficult patterns. Are you going through something hard?",
      follow_up_prompts: ["I'm here. Want to talk about it?"],
      internal_label: 'Grief/loss pattern',
      intervention_timing: 'When user is ready'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH008_TREATMENT_RESISTANT_DEPRESSION: {
    id: 'MH008',
    name: 'Treatment-Resistant Depression Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Depression not responding to treatment',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 60 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 40, unit: 'percent', window: 60 }
    ],
    logic: 'IF (persistent_symptoms) AND (no_improvement) THEN treatment_resistance',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "I've noticed things haven't been improving. Have you talked to your doctor about adjusting treatment?",
      follow_up_prompts: ["Sometimes it takes finding the right approach. Don't give up."],
      internal_label: 'Treatment-resistant depression',
      intervention_timing: 'When user mentions frustration with treatment'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH009_POSTPARTUM_DEPRESSION: {
    id: 'MH009',
    name: 'Postpartum Depression',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Depression following childbirth',
    conditions: [
      { behavior: 'sleepDuration', operator: 'CHRONIC_LOW', threshold: 2, unit: 'hours', window: 30 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'bpm', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 30 }
    ],
    logic: 'IF (postpartum_timing) AND (severe_sleep_deprivation) AND (mood_indicators) THEN PPD_likely',
    confidence_threshold: 0.88,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [14, 60],
    silent_guidance: {
      discovery_question: "New motherhood is incredibly hard. How are you really doing?",
      follow_up_prompts: ["Please talk to your doctor. PPD is treatable and common."],
      internal_label: 'Postpartum depression',
      intervention_timing: 'Immediate, compassionate'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH010_MEDICATION_ADJUSTMENT_DEPRESSION: {
    id: 'MH010',
    name: 'Depression During Med Adjustment',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Mood decline during medication changes',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 10 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 10 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 25, unit: 'percent', window: 10 }
    ],
    logic: 'IF (recent_med_change) AND (mood_decline) THEN adjustment_period',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Did you recently change medications? How's that going?",
      follow_up_prompts: ["Your doctor should know about these changes."],
      internal_label: 'Medication adjustment',
      intervention_timing: 'When user mentions med changes'
    },
    urgency: 'high',
    sensitive: true
  },

  // ========================================
  // ANXIETY & PANIC (12 patterns)
  // ========================================
  MH011_GENERALIZED_ANXIETY_ONSET: {
    id: 'MH011',
    name: 'Generalized Anxiety Onset',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Beginning of anxiety disorder',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 21 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 21 }
    ],
    logic: 'IF (elevated_rhr) AND (low_hrv) AND (poor_sleep) THEN anxiety_likely',
    confidence_threshold: 0.85,
    evidence_required: 4,
    false_positive_rate: 0.13,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You seem more wired than usual. Feeling anxious about anything?",
      follow_up_prompts: ["Have you thought about talking to someone?"],
      internal_label: 'Anxiety onset',
      intervention_timing: 'When user mentions worry'
    },
    urgency: 'high',
    sensitive: true
  },

  MH012_PANIC_ATTACK_EPISODE: {
    id: 'MH012',
    name: 'Panic Attack Episode',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Acute panic attack detected',
    conditions: [
      { behavior: 'heartRate', operator: 'SPIKE', threshold: 40, unit: 'bpm', window: 0.5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 50, unit: 'percent', window: 0.5 },
      { behavior: 'restingHeartRate', operator: 'SPIKE', threshold: 30, unit: 'bpm', window: 1 }
    ],
    logic: 'IF (sudden_hr_spike) AND (hrv_crash) THEN panic_attack',
    confidence_threshold: 0.91,
    evidence_required: 3,
    false_positive_rate: 0.08,
    detection_window: [0, 2],
    silent_guidance: {
      discovery_question: "I noticed something intense just happened. Are you okay?",
      follow_up_prompts: ["Want to try some breathing exercises?", "I'm here if you need support."],
      internal_label: 'Panic attack',
      intervention_timing: 'Immediate, if safe'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH013_PANIC_DISORDER_PATTERN: {
    id: 'MH013',
    name: 'Panic Disorder Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Recurrent panic attacks',
    conditions: [
      { behavior: 'heartRate', operator: 'FREQUENT_SPIKES', threshold: 35, unit: 'bpm', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (recurrent_spikes) AND (volatile_physiology) THEN panic_disorder',
    confidence_threshold: 0.87,
    evidence_required: 3,
    false_positive_rate: 0.11,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "I'm seeing recurring patterns of intense stress. Is panic a thing for you?",
      follow_up_prompts: ["Have you talked to a professional about this?"],
      internal_label: 'Panic disorder',
      intervention_timing: 'When user mentions panic'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH014_SOCIAL_ANXIETY_PATTERN: {
    id: 'MH014',
    name: 'Social Anxiety Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Anxiety around social events',
    conditions: [
      { behavior: 'heartRate', operator: 'SPIKE', threshold: 20, unit: 'bpm', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 2 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 1 }
    ],
    logic: 'IF (pre_event_anxiety) AND (physiological_stress) THEN social_anxiety',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Big social event coming up? How are you feeling about it?",
      follow_up_prompts: ["Social stuff can be tough. What helps you cope?"],
      internal_label: 'Social anxiety',
      intervention_timing: 'Before social events'
    },
    urgency: 'medium',
    sensitive: true
  },

  MH015_HEALTH_ANXIETY_PATTERN: {
    id: 'MH015',
    name: 'Health Anxiety Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Anxiety focused on health concerns',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 8, unit: 'bpm', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (health_worry_indicators) AND (checking_behavior) THEN health_anxiety',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You seem worried about your health. What's concerning you?",
      follow_up_prompts: ["Sometimes anxiety itself causes physical symptoms. Have you noticed that?"],
      internal_label: 'Health anxiety',
      intervention_timing: 'When user mentions health worries'
    },
    urgency: 'medium',
    sensitive: true
  },

  MH016_ANTICIPATORY_ANXIETY: {
    id: 'MH016',
    name: 'Anticipatory Anxiety',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Anxiety building before events',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'GRADUALLY_INCREASES', threshold: 8, unit: 'bpm', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (gradual_buildup) AND (upcoming_event) THEN anticipatory_anxiety',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "Something big coming up that's on your mind?",
      follow_up_prompts: ["What are you most worried about?"],
      internal_label: 'Anticipatory anxiety',
      intervention_timing: 'Before known stressors'
    },
    urgency: 'medium',
    sensitive: true
  },

  MH017_POST_TRAUMATIC_STRESS: {
    id: 'MH017',
    name: 'Post-Traumatic Stress Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'PTSD symptoms emerging',
    conditions: [
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'heartRate', operator: 'FREQUENT_SPIKES', threshold: 30, unit: 'bpm', window: 30 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 15, unit: 'bpm', window: 30 }
    ],
    logic: 'IF (hypervigilance_indicators) AND (sleep_disturbance) AND (post_trauma) THEN PTSD_likely',
    confidence_threshold: 0.88,
    evidence_required: 4,
    false_positive_rate: 0.11,
    detection_window: [21, 60],
    silent_guidance: {
      discovery_question: "I'm seeing patterns that suggest you've been through something difficult. Do you have support?",
      follow_up_prompts: ["Trauma affects our bodies. Have you talked to a professional?"],
      internal_label: 'PTSD pattern',
      intervention_timing: 'When user is ready to talk'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH018_NIGHTMARE_PATTERN: {
    id: 'MH018',
    name: 'Recurring Nightmare Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Pattern of nightmares affecting sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'heartRate', operator: 'NIGHTTIME_SPIKES', threshold: 25, unit: 'bpm', window: 14 },
      { behavior: 'hrv', operator: 'NIGHTTIME_DROPS', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (nighttime_disturbances) AND (recurring) THEN nightmare_pattern',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Your sleep is really disrupted at night. Bad dreams?",
      follow_up_prompts: ["Nightmares can be a sign of unprocessed stress. What's going on?"],
      internal_label: 'Nightmare pattern',
      intervention_timing: 'When user mentions sleep issues'
    },
    urgency: 'high',
    sensitive: true
  },

  MH019_ANXIETY_IMPROVING: {
    id: 'MH019',
    name: 'Anxiety Improving',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Recovery from anxiety episode',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'DROPS', threshold: 8, unit: 'bpm', window: 14 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (physiology_normalizing) AND (improving_sleep) THEN anxiety_resolving',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You seem calmer lately. What's been helping?",
      follow_up_prompts: ["Keep doing what's working!"],
      internal_label: 'Anxiety improving',
      intervention_timing: 'When user mentions feeling better'
    },
    urgency: 'low',
    sensitive: true
  },

  MH020_PHOBIA_EXPOSURE: {
    id: 'MH020',
    name: 'Phobia Exposure Event',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Acute anxiety from phobia trigger',
    conditions: [
      { behavior: 'heartRate', operator: 'SPIKE', threshold: 50, unit: 'bpm', window: 0.5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 60, unit: 'percent', window: 0.5 }
    ],
    logic: 'IF (extreme_acute_response) THEN phobia_trigger',
    confidence_threshold: 0.85,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [0, 1],
    silent_guidance: {
      discovery_question: "Whoa, something just triggered a big response. You okay?",
      follow_up_prompts: ["Want to talk about what happened?"],
      internal_label: 'Phobia exposure',
      intervention_timing: 'Immediate, if safe'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH021_EXAM_PERFORMANCE_ANXIETY: {
    id: 'MH021',
    name: 'Exam/Performance Anxiety',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Anxiety before tests/performances',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 3 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 3 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 3 }
    ],
    logic: 'IF (pre_performance_stress) AND (sleep_disruption) THEN performance_anxiety',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [2, 5],
    silent_guidance: {
      discovery_question: "Big test or performance coming up?",
      follow_up_prompts: ["Performance anxiety is normal. What helps you cope?"],
      internal_label: 'Performance anxiety',
      intervention_timing: 'Before known performance events'
    },
    urgency: 'medium',
    sensitive: false
  },

  MH022_SEPARATION_ANXIETY: {
    id: 'MH022',
    name: 'Separation Anxiety Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Anxiety when separated from loved ones',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'bpm', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 }
    ],
    logic: 'IF (separation_timing) AND (anxiety_indicators) THEN separation_anxiety',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Is someone you're close to away right now?",
      follow_up_prompts: ["Separation can be tough. How are you managing?"],
      internal_label: 'Separation anxiety',
      intervention_timing: 'When user mentions someone being away'
    },
    urgency: 'medium',
    sensitive: true
  },

  // ========================================
  // BIPOLAR & MOOD CYCLING (8 patterns)
  // ========================================
  MH023_MANIC_EPISODE: {
    id: 'MH023',
    name: 'Manic Episode',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Manic phase of bipolar disorder',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 3, unit: 'hours', window: 7 },
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 60, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 15, unit: 'bpm', window: 7 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 35, unit: 'percent', window: 7 }
    ],
    logic: 'IF (minimal_sleep) AND (hyperactivity) AND (physiological_arousal) THEN mania_likely',
    confidence_threshold: 0.89,
    evidence_required: 4,
    false_positive_rate: 0.10,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You're running on very little sleep and incredibly active. How are you feeling?",
      follow_up_prompts: ["This could be mania. Have you talked to your psychiatrist?"],
      internal_label: 'Manic episode',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH024_HYPOMANIC_EPISODE: {
    id: 'MH024',
    name: 'Hypomanic Episode',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Hypomania (mild mania)',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 90, unit: 'minutes', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 7 }
    ],
    logic: 'IF (reduced_sleep) AND (increased_activity) AND (elevated_mood) THEN hypomania',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You seem really energized lately. Feeling great?",
      follow_up_prompts: ["Make sure you're sleeping enough. This could be hypomania."],
      internal_label: 'Hypomanic episode',
      intervention_timing: 'When user mentions high energy'
    },
    urgency: 'high',
    sensitive: true
  },

  MH025_BIPOLAR_RAPID_CYCLING: {
    id: 'MH025',
    name: 'Rapid Cycling Bipolar Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Frequent mood swings',
    conditions: [
      { behavior: 'sleepDuration', operator: 'VOLATILE', threshold: 3, unit: 'hours', window: 21 },
      { behavior: 'activeMinutes', operator: 'VOLATILE', threshold: 50, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 21 }
    ],
    logic: 'IF (extreme_volatility) AND (rapid_shifts) THEN rapid_cycling',
    confidence_threshold: 0.87,
    evidence_required: 3,
    false_positive_rate: 0.11,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Your patterns are swinging a lot. Are your moods cycling fast?",
      follow_up_prompts: ["This needs professional attention. Have you told your psychiatrist?"],
      internal_label: 'Rapid cycling',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH026_MIXED_EPISODE: {
    id: 'MH026',
    name: 'Mixed Episode',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Depression and mania simultaneously',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 2, unit: 'hours', window: 7 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'VOLATILE', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'bpm', window: 7 }
    ],
    logic: 'IF (agitated_depression) AND (mixed_symptoms) THEN mixed_episode',
    confidence_threshold: 0.88,
    evidence_required: 4,
    false_positive_rate: 0.11,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You seem agitated and down at the same time. This is really hard. How are you?",
      follow_up_prompts: ["Mixed episodes are dangerous. Please contact your psychiatrist."],
      internal_label: 'Mixed episode',
      intervention_timing: 'Immediate, urgent'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH027_BIPOLAR_DEPRESSION: {
    id: 'MH027',
    name: 'Bipolar Depression Phase',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Depressive phase in bipolar disorder',
    conditions: [
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 3, unit: 'hours', window: 14 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hypersomnia) AND (inactivity) AND (known_bipolar) THEN bipolar_depression',
    confidence_threshold: 0.86,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're sleeping a lot and not very active. How's your mood?",
      follow_up_prompts: ["Bipolar depression is tough. Are you in contact with your doctor?"],
      internal_label: 'Bipolar depression',
      intervention_timing: 'When user mentions low mood'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH028_MEDICATION_INDUCED_MANIA: {
    id: 'MH028',
    name: 'Medication-Induced Mania',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Mania triggered by antidepressants',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 2.5, unit: 'hours', window: 7 },
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'SPIKE', threshold: 15, unit: 'bpm', window: 7 }
    ],
    logic: 'IF (recent_antidepressant_start) AND (manic_symptoms) THEN medication_induced',
    confidence_threshold: 0.85,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "Did you just start an antidepressant? You're showing signs of mania.",
      follow_up_prompts: ["Call your doctor immediately. This is urgent."],
      internal_label: 'Med-induced mania',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH029_MOOD_STABILIZATION: {
    id: 'MH029',
    name: 'Mood Stabilization',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Bipolar symptoms stabilizing',
    conditions: [
      { behavior: 'sleepDuration', operator: 'STABILIZES', threshold: 30, unit: 'minutes', window: 21 },
      { behavior: 'activeMinutes', operator: 'STABILIZES', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (reduced_volatility) AND (normalizing_patterns) THEN stabilization',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Your patterns are looking more stable. How are you feeling?",
      follow_up_prompts: ["What's been working for you?"],
      internal_label: 'Mood stabilizing',
      intervention_timing: 'When user mentions improvement'
    },
    urgency: 'low',
    sensitive: true
  },

  MH030_SEASONAL_BIPOLAR_PATTERN: {
    id: 'MH030',
    name: 'Seasonal Bipolar Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Seasonal mood cycling',
    conditions: [
      { behavior: 'sleepDuration', operator: 'SEASONAL_CHANGE', threshold: 2, unit: 'hours', window: 30 },
      { behavior: 'activeMinutes', operator: 'SEASONAL_CHANGE', threshold: 40, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'SEASONAL_CHANGE', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (seasonal_trigger) AND (mood_shift) THEN seasonal_bipolar',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Notice your mood changing with the seasons?",
      follow_up_prompts: ["Seasonal patterns in bipolar are common. Talk to your doctor about prevention."],
      internal_label: 'Seasonal bipolar',
      intervention_timing: 'At seasonal transitions'
    },
    urgency: 'high',
    sensitive: true
  },

  // ========================================
  // EATING DISORDERS (8 patterns)
  // ========================================
  MH031_ANOREXIA_PATTERN: {
    id: 'MH031',
    name: 'Anorexia Nervosa Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Restrictive eating disorder',
    conditions: [
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 50, unit: 'percent', window: 21 },
      { behavior: 'restingHeartRate', operator: 'CHRONIC_LOW', threshold: 15, unit: 'bpm', window: 21 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 21 }
    ],
    logic: 'IF (excessive_exercise) AND (malnutrition_indicators) THEN anorexia_likely',
    confidence_threshold: 0.87,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "I'm worried about some patterns I'm seeing. Are you eating enough?",
      follow_up_prompts: ["Please talk to a doctor. This is serious."],
      internal_label: 'Anorexia pattern',
      intervention_timing: 'Immediate, compassionate'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH032_BULIMIA_PATTERN: {
    id: 'MH032',
    name: 'Bulimia Nervosa Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Binge-purge eating disorder',
    conditions: [
      { behavior: 'heartRate', operator: 'FREQUENT_SPIKES', threshold: 25, unit: 'bpm', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (binge_purge_indicators) AND (volatile_physiology) THEN bulimia_likely',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "I'm seeing some concerning patterns. How's your relationship with food?",
      follow_up_prompts: ["Eating disorders are treatable. Please reach out for help."],
      internal_label: 'Bulimia pattern',
      intervention_timing: 'When user is ready'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH033_BINGE_EATING_DISORDER: {
    id: 'MH033',
    name: 'Binge Eating Disorder',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Compulsive overeating pattern',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (decreased_activity) AND (shame_indicators) THEN BED_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "How are things with eating? Sometimes stress affects our food relationships.",
      follow_up_prompts: ["There's no shame in getting help. BED is real and treatable."],
      internal_label: 'Binge eating',
      intervention_timing: 'When user mentions food struggles'
    },
    urgency: 'high',
    sensitive: true
  },

  MH034_ORTHOREXIA_PATTERN: {
    id: 'MH034',
    name: 'Orthorexia Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Obsession with healthy eating',
    conditions: [
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 8, unit: 'bpm', window: 21 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 21 }
    ],
    logic: 'IF (obsessive_health_behavior) AND (stress_indicators) THEN orthorexia',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You seem really focused on health. Is it causing stress?",
      follow_up_prompts: ["Even 'healthy' habits can become unhealthy if they're causing anxiety."],
      internal_label: 'Orthorexia',
      intervention_timing: 'When user mentions food rules'
    },
    urgency: 'medium',
    sensitive: true
  },

  MH035_EXERCISE_ADDICTION: {
    id: 'MH035',
    name: 'Exercise Addiction',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Compulsive over-exercise',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CHRONIC_HIGH', threshold: 60, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 }
    ],
    logic: 'IF (excessive_exercise) AND (poor_recovery) AND (compulsive) THEN exercise_addiction',
    confidence_threshold: 0.84,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You're working out a lot but not recovering. Can you take a rest day?",
      follow_up_prompts: ["Exercise addiction is real. Your body needs recovery."],
      internal_label: 'Exercise addiction',
      intervention_timing: 'When user mentions inability to rest'
    },
    urgency: 'high',
    sensitive: true
  },

  MH036_EATING_DISORDER_RECOVERY: {
    id: 'MH036',
    name: 'Eating Disorder Recovery',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Recovery from eating disorder',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'GRADUALLY_IMPROVES', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (normalizing_patterns) AND (consistent_improvement) THEN ED_recovery',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Your body seems to be healing. How's recovery going?",
      follow_up_prompts: ["So proud of you. Keep going."],
      internal_label: 'ED recovery',
      intervention_timing: 'When user mentions progress'
    },
    urgency: 'low',
    sensitive: true
  },

  MH037_BODY_DYSMORPHIA_PATTERN: {
    id: 'MH037',
    name: 'Body Dysmorphia Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Obsessive focus on perceived flaws',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 21 },
      { behavior: 'activeMinutes', operator: 'VOLATILE', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 21 }
    ],
    logic: 'IF (body_checking_indicators) AND (anxiety) THEN BDD_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You seem anxious about your appearance. What's going on?",
      follow_up_prompts: ["Body dysmorphia is real and treatable. Have you talked to someone?"],
      internal_label: 'Body dysmorphia',
      intervention_timing: 'When user mentions appearance concerns'
    },
    urgency: 'high',
    sensitive: true
  },

  MH038_RELAPSE_WARNING: {
    id: 'MH038',
    name: 'Eating Disorder Relapse Warning',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Early signs of ED relapse',
    conditions: [
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 35, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 }
    ],
    logic: 'IF (known_ED_history) AND (warning_signs) THEN relapse_risk',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "I'm seeing some old patterns creeping back. How are you doing?",
      follow_up_prompts: ["Please reach out to your support team. Early intervention matters."],
      internal_label: 'ED relapse warning',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  // ========================================
  // ADDICTION & RECOVERY (8 patterns)
  // ========================================
  MH039_SUBSTANCE_USE_PATTERN: {
    id: 'MH039',
    name: 'Substance Use Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Pattern suggesting substance use',
    conditions: [
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'VOLATILE', threshold: 15, unit: 'bpm', window: 14 }
    ],
    logic: 'IF (extreme_volatility) AND (irregular_patterns) THEN substance_use_likely',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Your patterns are all over the place. Everything okay?",
      follow_up_prompts: ["If substances are involved, I'm not here to judge. Want to talk?"],
      internal_label: 'Substance use pattern',
      intervention_timing: 'When user is ready'
    },
    urgency: 'high',
    sensitive: true
  },

  MH040_ALCOHOL_DEPENDENCE: {
    id: 'MH040',
    name: 'Alcohol Dependence Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Pattern suggesting alcohol addiction',
    conditions: [
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 21 }
    ],
    logic: 'IF (alcohol_indicators) AND (dependence_pattern) THEN alcoholism_likely',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Your body is showing signs of stress. How's drinking been?",
      follow_up_prompts: ["Alcohol dependence is a medical condition. Help is available."],
      internal_label: 'Alcohol dependence',
      intervention_timing: 'When user mentions drinking'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH041_WITHDRAWAL_PATTERN: {
    id: 'MH041',
    name: 'Substance Withdrawal',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Physiological withdrawal symptoms',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'SPIKE', threshold: 20, unit: 'bpm', window: 3 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 30, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 40, unit: 'percent', window: 3 },
      { behavior: 'heartRate', operator: 'VOLATILE', threshold: 25, unit: 'bpm', window: 3 }
    ],
    logic: 'IF (acute_physiological_distress) AND (withdrawal_timing) THEN withdrawal_likely',
    confidence_threshold: 0.87,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [1, 7],
    silent_guidance: {
      discovery_question: "Your body is in serious distress. Are you withdrawing from something?",
      follow_up_prompts: ["Withdrawal can be dangerous. Please get medical help."],
      internal_label: 'Withdrawal',
      intervention_timing: 'Immediate, urgent'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH042_EARLY_SOBRIETY: {
    id: 'MH042',
    name: 'Early Sobriety',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'First weeks/months of recovery',
    conditions: [
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'restingHeartRate', operator: 'GRADUALLY_DECREASES', threshold: 8, unit: 'bpm', window: 21 }
    ],
    logic: 'IF (post_withdrawal) AND (steady_improvement) THEN early_recovery',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Your body is healing. How's sobriety going?",
      follow_up_prompts: ["So proud of you. One day at a time."],
      internal_label: 'Early sobriety',
      intervention_timing: 'When user mentions sobriety'
    },
    urgency: 'low',
    sensitive: true
  },

  MH043_RELAPSE_WARNING_ADDICTION: {
    id: 'MH043',
    name: 'Addiction Relapse Warning',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Early signs of potential relapse',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (recovery_history) AND (destabilization) THEN relapse_risk',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Things seem tough right now. How's your recovery?",
      follow_up_prompts: ["Please reach out to your sponsor or support group."],
      internal_label: 'Relapse warning',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH044_SUSTAINED_RECOVERY: {
    id: 'MH044',
    name: 'Sustained Recovery',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Stable long-term sobriety',
    conditions: [
      { behavior: 'sleepQuality', operator: 'STABLE_HIGH', threshold: 80, unit: 'percent', window: 60 },
      { behavior: 'hrv', operator: 'STABLE_HIGH', threshold: 15, unit: 'percent', window: 60 },
      { behavior: 'recoveryScore', operator: 'STABLE_HIGH', threshold: 75, unit: 'percent', window: 60 }
    ],
    logic: 'IF (stable_physiology) AND (sustained_time) THEN strong_recovery',
    confidence_threshold: 0.85,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "You're doing amazing. How does it feel to be this far into recovery?",
      follow_up_prompts: ["Keep doing what you're doing. You've got this."],
      internal_label: 'Sustained recovery',
      intervention_timing: 'Celebrating milestones'
    },
    urgency: 'low',
    sensitive: true
  },

  MH045_BEHAVIORAL_ADDICTION: {
    id: 'MH045',
    name: 'Behavioral Addiction Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Gambling, gaming, shopping addiction',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 2, unit: 'hours', window: 14 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 14 }
    ],
    logic: 'IF (neglect_indicators) AND (compulsive_pattern) THEN behavioral_addiction',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're losing sleep and activity. What's taking up your time?",
      follow_up_prompts: ["Behavioral addictions are real. Do you feel out of control?"],
      internal_label: 'Behavioral addiction',
      intervention_timing: 'When user mentions compulsive behavior'
    },
    urgency: 'high',
    sensitive: true
  },

  MH046_NICOTINE_WITHDRAWAL: {
    id: 'MH046',
    name: 'Nicotine Withdrawal',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Quitting smoking/vaping',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'DROPS', threshold: 8, unit: 'bpm', window: 7 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (nicotine_cessation_pattern) AND (irritability_indicators) THEN nicotine_withdrawal',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "Did you quit nicotine? Proud of you. How's it going?",
      follow_up_prompts: ["The first week is the hardest. Hang in there."],
      internal_label: 'Nicotine withdrawal',
      intervention_timing: 'During quit attempt'
    },
    urgency: 'medium',
    sensitive: false
  },

  // ========================================
  // THERAPY & MEDICATION (8 patterns)
  // ========================================
  MH047_STARTING_THERAPY: {
    id: 'MH047',
    name: 'Starting Therapy',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Beginning mental health treatment',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 10, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (early_improvement) AND (therapy_timing) THEN therapy_beginning',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Things seem a bit better. Did you start therapy?",
      follow_up_prompts: ["How's it going? Finding it helpful?"],
      internal_label: 'Starting therapy',
      intervention_timing: 'When user mentions therapy'
    },
    urgency: 'low',
    sensitive: true
  },

  MH048_THERAPY_BREAKTHROUGH: {
    id: 'MH048',
    name: 'Therapy Breakthrough',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Major progress in therapy',
    conditions: [
      { behavior: 'hrv', operator: 'SPIKE', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 7 }
    ],
    logic: 'IF (sudden_improvement) AND (therapy_context) THEN breakthrough_moment',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Something shifted! Did something click in therapy?",
      follow_up_prompts: ["That's amazing. What helped?"],
      internal_label: 'Therapy breakthrough',
      intervention_timing: 'When user mentions insight'
    },
    urgency: 'low',
    sensitive: true
  },

  MH049_ANTIDEPRESSANT_START: {
    id: 'MH049',
    name: 'Starting Antidepressant',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'First weeks on antidepressant',
    conditions: [
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (medication_adjustment_period) AND (side_effects) THEN med_start',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Did you start a new medication? How's your body adjusting?",
      follow_up_prompts: ["Side effects usually improve. Keep your doctor updated."],
      internal_label: 'Antidepressant start',
      intervention_timing: 'After medication start'
    },
    urgency: 'medium',
    sensitive: true
  },

  MH050_ANTIDEPRESSANT_WORKING: {
    id: 'MH050',
    name: 'Antidepressant Taking Effect',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Medication beginning to work',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 18, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'GRADUALLY_IMPROVES', threshold: 20, unit: 'percent', window: 21 }
    ],
    logic: 'IF (sustained_improvement) AND (therapeutic_window) THEN medication_effective',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You seem to be feeling better. Is the medication helping?",
      follow_up_prompts: ["That's great. Keep taking it as prescribed."],
      internal_label: 'Medication working',
      intervention_timing: 'When user mentions improvement'
    },
    urgency: 'low',
    sensitive: true
  },

  MH051_MEDICATION_NOT_WORKING: {
    id: 'MH051',
    name: 'Medication Not Effective',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Antidepressant not helping',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 45 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 45 }
    ],
    logic: 'IF (no_improvement) AND (adequate_trial) THEN medication_ineffective',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "You've been on this medication a while but I'm not seeing improvement. Have you talked to your doctor?",
      follow_up_prompts: ["Sometimes it takes trying different meds to find what works."],
      internal_label: 'Medication ineffective',
      intervention_timing: 'After adequate trial period'
    },
    urgency: 'high',
    sensitive: true
  },

  MH052_MEDICATION_SIDE_EFFECTS: {
    id: 'MH052',
    name: 'Medication Side Effects',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Adverse effects from psychiatric medication',
    conditions: [
      { behavior: 'sleepDuration', operator: 'SPIKE', threshold: 2, unit: 'hours', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'CHANGES', threshold: 10, unit: 'bpm', window: 7 }
    ],
    logic: 'IF (recent_med_change) AND (side_effect_profile) THEN adverse_effects',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "Your patterns changed after starting that medication. Side effects?",
      follow_up_prompts: ["Tell your doctor. They might adjust the dose or try something else."],
      internal_label: 'Medication side effects',
      intervention_timing: 'When side effects emerge'
    },
    urgency: 'high',
    sensitive: true
  },

  MH053_MEDICATION_DISCONTINUATION: {
    id: 'MH053',
    name: 'Stopping Psychiatric Medication',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Discontinuation syndrome',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'VOLATILE', threshold: 12, unit: 'bpm', window: 7 }
    ],
    logic: 'IF (med_cessation) AND (withdrawal_symptoms) THEN discontinuation_syndrome',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "Did you stop your medication? Your body is reacting. Was this with your doctor's guidance?",
      follow_up_prompts: ["Please don't stop psych meds abruptly. Call your doctor."],
      internal_label: 'Medication discontinuation',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH054_EMDR_PROCESSING: {
    id: 'MH054',
    name: 'EMDR Therapy Processing',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Trauma processing from EMDR',
    conditions: [
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'VOLATILE', threshold: 10, unit: 'bpm', window: 7 }
    ],
    logic: 'IF (EMDR_timing) AND (processing_indicators) THEN trauma_processing',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "EMDR can stir things up. How are you processing?",
      follow_up_prompts: ["This volatility is normal. Stay in touch with your therapist."],
      internal_label: 'EMDR processing',
      intervention_timing: 'After EMDR sessions'
    },
    urgency: 'medium',
    sensitive: true
  },

  // ========================================
  // MENTAL HEALTH CRISES (8 patterns)
  // ========================================
  MH055_SUICIDAL_CRISIS: {
    id: 'MH055',
    name: 'Suicidal Crisis Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Extreme risk pattern',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_LOW', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'EXTREME_LOW', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'EXTREME_LOW', threshold: 60, unit: 'percent', window: 7 }
    ],
    logic: 'IF (severe_deterioration) AND (withdrawal) THEN extreme_risk',
    confidence_threshold: 0.90,
    evidence_required: 3,
    false_positive_rate: 0.09,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "I'm really worried about you. Are you thinking about hurting yourself?",
      follow_up_prompts: ["Please call 988 (Suicide & Crisis Lifeline) or go to the ER. You don't have to do this alone."],
      internal_label: 'CRISIS - Suicide risk',
      intervention_timing: 'IMMEDIATE - Crisis intervention'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH056_SELF_HARM_PATTERN: {
    id: 'MH056',
    name: 'Self-Harm Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Pattern suggesting self-injury',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'bpm', window: 14 }
    ],
    logic: 'IF (self_harm_indicators) AND (distress) THEN self_injury_likely',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You seem to be in a lot of pain. Are you hurting yourself?",
      follow_up_prompts: ["Self-harm is a sign you need help. Please talk to someone."],
      internal_label: 'Self-harm pattern',
      intervention_timing: 'Immediate, compassionate'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH057_PSYCHOTIC_BREAK: {
    id: 'MH057',
    name: 'Psychotic Break Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Loss of contact with reality',
    conditions: [
      { behavior: 'sleepDuration', operator: 'EXTREME_LOW', threshold: 4, unit: 'hours', window: 7 },
      { behavior: 'heartRate', operator: 'EXTREME_VOLATILE', threshold: 40, unit: 'bpm', window: 7 },
      { behavior: 'hrv', operator: 'EXTREME_VOLATILE', threshold: 50, unit: 'percent', window: 7 }
    ],
    logic: 'IF (extreme_dysregulation) AND (psychosis_indicators) THEN psychotic_break',
    confidence_threshold: 0.88,
    evidence_required: 3,
    false_positive_rate: 0.11,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Your patterns are extremely concerning. Do you need emergency help?",
      follow_up_prompts: ["Please go to the ER or call 988. This is serious."],
      internal_label: 'CRISIS - Psychosis',
      intervention_timing: 'IMMEDIATE - Emergency'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH058_DISSOCIATIVE_EPISODE: {
    id: 'MH058',
    name: 'Dissociative Episode',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Severe dissociation/depersonalization',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 30, unit: 'percent', window: 3 },
      { behavior: 'heartRate', operator: 'VOLATILE', threshold: 25, unit: 'bpm', window: 3 },
      { behavior: 'restingHeartRate', operator: 'VOLATILE', threshold: 15, unit: 'bpm', window: 3 }
    ],
    logic: 'IF (acute_dysregulation) AND (trauma_trigger) THEN dissociation',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [1, 7],
    silent_guidance: {
      discovery_question: "Are you feeling disconnected from yourself or reality?",
      follow_up_prompts: ["Try grounding techniques. If it doesn't pass, call your therapist."],
      internal_label: 'Dissociative episode',
      intervention_timing: 'Immediate support'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH059_ACUTE_STRESS_REACTION: {
    id: 'MH059',
    name: 'Acute Stress Reaction',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Severe reaction to traumatic event',
    conditions: [
      { behavior: 'heartRate', operator: 'SPIKE', threshold: 40, unit: 'bpm', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 35, unit: 'percent', window: 1 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 40, unit: 'percent', window: 3 }
    ],
    logic: 'IF (trauma_timing) AND (acute_response) THEN stress_reaction',
    confidence_threshold: 0.86,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [0, 7],
    silent_guidance: {
      discovery_question: "Something really intense just happened. Are you okay? Do you need help?",
      follow_up_prompts: ["Acute stress reactions are normal after trauma. But please reach out for support."],
      internal_label: 'Acute stress reaction',
      intervention_timing: 'Immediate'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH060_NERVOUS_BREAKDOWN: {
    id: 'MH060',
    name: 'Mental Health Breakdown',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Severe mental health crisis',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_LOW', threshold: 35, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'EXTREME_LOW', threshold: 45, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'EXTREME_LOW', threshold: 55, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'EXTREME_HIGH', threshold: 20, unit: 'bpm', window: 7 }
    ],
    logic: 'IF (complete_breakdown) AND (inability_to_function) THEN crisis_state',
    confidence_threshold: 0.91,
    evidence_required: 4,
    false_positive_rate: 0.08,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You're in crisis. Can you call someone right now?",
      follow_up_prompts: ["988 - Suicide & Crisis Lifeline. Or go to the ER. Please don't wait."],
      internal_label: 'CRISIS - Breakdown',
      intervention_timing: 'IMMEDIATE - Emergency response'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH061_HOSPITALIZATION_NEEDED: {
    id: 'MH061',
    name: 'Psychiatric Hospitalization Needed',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Pattern requiring inpatient care',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_LOW', threshold: 40, unit: 'percent', window: 10 },
      { behavior: 'sleepDuration', operator: 'EXTREME_VOLATILE', threshold: 4, unit: 'hours', window: 10 },
      { behavior: 'activeMinutes', operator: 'EXTREME_LOW', threshold: 60, unit: 'percent', window: 10 }
    ],
    logic: 'IF (cannot_self_care) AND (safety_risk) THEN hospitalization_indicated',
    confidence_threshold: 0.89,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [7, 14],
    silent_guidance: {
      discovery_question: "Your patterns suggest you might need more support than outpatient care can provide. Have you considered hospitalization?",
      follow_up_prompts: ["Inpatient care can be life-saving. It's not giving up, it's getting help."],
      internal_label: 'Hospitalization needed',
      intervention_timing: 'Immediate recommendation'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH062_POST_CRISIS_RECOVERY: {
    id: 'MH062',
    name: 'Post-Crisis Recovery',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Recovering from mental health crisis',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'GRADUALLY_IMPROVES', threshold: 30, unit: 'percent', window: 14 }
    ],
    logic: 'IF (post_crisis) AND (stabilization) THEN recovery_beginning',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're starting to stabilize. How are you feeling after the crisis?",
      follow_up_prompts: ["Recovery isn't linear. Be gentle with yourself."],
      internal_label: 'Post-crisis recovery',
      intervention_timing: 'After crisis passes'
    },
    urgency: 'medium',
    sensitive: true
  },

  // ========================================
  // ADVANCED ANOMALY PATTERNS (8 patterns)
  // ========================================
  MH063_AUTISM_BURNOUT: {
    id: 'MH063',
    name: 'Autism Burnout Pattern',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Autistic burnout from masking/overwhelm',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 45, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 21 }
    ],
    logic: 'IF (autistic_context) AND (burnout_indicators) THEN autism_burnout',
    confidence_threshold: 0.84,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You seem really depleted. Is masking or sensory overload wearing you down?",
      follow_up_prompts: ["Autistic burnout is real. You need rest and reduced demands."],
      internal_label: 'Autism burnout',
      intervention_timing: 'When user mentions exhaustion'
    },
    urgency: 'high',
    sensitive: true
  },

  MH064_ADHD_MEDICATION_WEAR_OFF: {
    id: 'MH064',
    name: 'ADHD Medication Wearing Off',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Pattern of medication wearing off',
    conditions: [
      { behavior: 'heartRate', operator: 'AFTERNOON_SPIKE', threshold: 15, unit: 'bpm', window: 7 },
      { behavior: 'hrv', operator: 'AFTERNOON_DROP', threshold: 18, unit: 'percent', window: 7 }
    ],
    logic: 'IF (timing_pattern) AND (ADHD_meds) THEN medication_wearing_off',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Your body shows a daily pattern. Is your ADHD medication wearing off too early?",
      follow_up_prompts: ["Talk to your doctor about extended release or a booster dose."],
      internal_label: 'ADHD med wear-off',
      intervention_timing: 'When pattern observed'
    },
    urgency: 'low',
    sensitive: false
  },

  MH065_OCD_SPIKE: {
    id: 'MH065',
    name: 'OCD Symptom Spike',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Worsening obsessive-compulsive symptoms',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'bpm', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (OCD_context) AND (symptom_worsening) THEN OCD_spike',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Are your OCD symptoms worse lately?",
      follow_up_prompts: ["Stress can trigger OCD. Are you still doing your ERP exercises?"],
      internal_label: 'OCD spike',
      intervention_timing: 'When user mentions compulsions'
    },
    urgency: 'high',
    sensitive: true
  },

  MH066_COMPLEX_PTSD_TRIGGER: {
    id: 'MH066',
    name: 'Complex PTSD Trigger',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Emotional flashback from C-PTSD',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 30, unit: 'percent', window: 2 },
      { behavior: 'heartRate', operator: 'SPIKE', threshold: 35, unit: 'bpm', window: 2 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 3 }
    ],
    logic: 'IF (trauma_history) AND (emotional_flashback) THEN CPTSD_trigger',
    confidence_threshold: 0.85,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Something triggered you. Are you in an emotional flashback?",
      follow_up_prompts: ["You're here now. That was then. Try grounding."],
      internal_label: 'C-PTSD trigger',
      intervention_timing: 'When trigger occurs'
    },
    urgency: 'critical',
    sensitive: true
  },

  MH067_PREMENSTRUAL_DYSPHORIA: {
    id: 'MH067',
    name: 'Premenstrual Dysphoric Disorder',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Severe PMS affecting mental health',
    conditions: [
      { behavior: 'hrv', operator: 'CYCLICAL_DROP', threshold: 20, unit: 'percent', window: 28 },
      { behavior: 'sleepQuality', operator: 'CYCLICAL_DROP', threshold: 25, unit: 'percent', window: 28 },
      { behavior: 'restingHeartRate', operator: 'CYCLICAL_INCREASE', threshold: 10, unit: 'bpm', window: 28 }
    ],
    logic: 'IF (monthly_pattern) AND (luteal_phase) THEN PMDD_likely',
    confidence_threshold: 0.86,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [21, 35],
    silent_guidance: {
      discovery_question: "Your mood seems to drop monthly before your period. Could this be PMDD?",
      follow_up_prompts: ["PMDD is a real disorder. There are treatments. Talk to your doctor."],
      internal_label: 'PMDD pattern',
      intervention_timing: 'Luteal phase each month'
    },
    urgency: 'high',
    sensitive: true
  },

  MH068_ADHD_BURNOUT: {
    id: 'MH068',
    name: 'ADHD Burnout',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Exhaustion from compensating for ADHD',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'VOLATILE', threshold: 40, unit: 'percent', window: 21 }
    ],
    logic: 'IF (ADHD_context) AND (exhaustion_pattern) THEN ADHD_burnout',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You seem exhausted from trying to keep up. ADHD burnout?",
      follow_up_prompts: ["You can't willpower your way out of ADHD. Be kind to yourself."],
      internal_label: 'ADHD burnout',
      intervention_timing: 'When user mentions exhaustion'
    },
    urgency: 'high',
    sensitive: true
  },

  MH069_REJECTION_SENSITIVE_DYSPHORIA: {
    id: 'MH069',
    name: 'Rejection Sensitive Dysphoria Episode',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Extreme reaction to perceived rejection',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 35, unit: 'percent', window: 1 },
      { behavior: 'heartRate', operator: 'SPIKE', threshold: 40, unit: 'bpm', window: 1 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 2 }
    ],
    logic: 'IF (ADHD_context) AND (rejection_trigger) THEN RSD_episode',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [0, 3],
    silent_guidance: {
      discovery_question: "Something just hit really hard. Was it rejection or criticism?",
      follow_up_prompts: ["RSD is part of ADHD. This pain is real but not permanent."],
      internal_label: 'RSD episode',
      intervention_timing: 'After trigger event'
    },
    urgency: 'high',
    sensitive: true
  },

  MH070_MEDICATION_HONEYMOON_END: {
    id: 'MH070',
    name: 'Medication Honeymoon Phase Ending',
    planet: 'Venus',
    category: 'mentalHealth',
    description: 'Initial medication benefits fading',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUAL_DECLINE', threshold: 12, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'GRADUAL_DECLINE', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'GRADUAL_DECLINE', threshold: 18, unit: 'percent', window: 30 }
    ],
    logic: 'IF (post_medication_start) AND (gradual_decline) THEN honeymoon_ending',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [21, 60],
    silent_guidance: {
      discovery_question: "The medication seemed great at first but now not as much? That's common.",
      follow_up_prompts: ["Talk to your doctor about adjusting the dose or trying something different."],
      internal_label: 'Med honeymoon ending',
      intervention_timing: 'After initial improvement period'
    },
    urgency: 'medium',
    sensitive: true
  }
};
