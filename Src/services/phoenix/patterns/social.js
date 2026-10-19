// Social Patterns - 55 patterns covering friendships, loneliness, community, social anxiety, conflict, networking, moving, belonging
// Pattern IDs: SOC001-SOC055

module.exports = {
  // Friendships & Social Connections (12 patterns)
  SOC001_NEW_CLOSE_FRIENDSHIP: {
    id: 'SOC001',
    name: 'New Close Friendship',
    planet: 'Venus',
    category: 'social',
    description: 'Forming meaningful new friendship',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 21 }
    ],
    logic: 'IF (improved_wellbeing) AND (social_connection) THEN new_friendship',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You seem happier! Make a new friend?",
      follow_up_prompts: ["New friendships are special!"],
      internal_label: 'New friendship',
      intervention_timing: 'When user mentions new person'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC002_FRIENDSHIP_ENDING: {
    id: 'SOC002',
    name: 'Friendship Ending',
    planet: 'Venus',
    category: 'social',
    description: 'Losing close friend',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 }
    ],
    logic: 'IF (social_loss) AND (grief) THEN friendship_ending',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You seem down. Lose a friend?",
      follow_up_prompts: ["Friendship breakups hurt. I'm here."],
      internal_label: 'Friendship loss',
      intervention_timing: 'When user mentions friend'
    },
    urgency: 'high',
    sensitive: true
  },

  SOC003_FRIEND_GROUP_DRAMA: {
    id: 'SOC003',
    name: 'Friend Group Conflict',
    planet: 'Venus',
    category: 'social',
    description: 'Drama in social circle',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (social_stress) AND (volatility) THEN group_drama',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Friend drama happening?",
      follow_up_prompts: ["Group conflict is exhausting. Take care of yourself."],
      internal_label: 'Friend drama',
      intervention_timing: 'When user mentions conflict'
    },
    urgency: 'medium',
    sensitive: false
  },

  SOC004_BEST_FRIEND_MOVING: {
    id: 'SOC004',
    name: 'Best Friend Moving Away',
    planet: 'Venus',
    category: 'social',
    description: 'Close friend relocating',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 }
    ],
    logic: 'IF (anticipatory_grief) AND (relocation) THEN friend_moving',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Best friend moving away?",
      follow_up_prompts: ["Distance is hard but friendship can survive it."],
      internal_label: 'Friend moving',
      intervention_timing: 'Pre-move period'
    },
    urgency: 'medium',
    sensitive: true
  },

  SOC005_RECONNECTING_OLD_FRIEND: {
    id: 'SOC005',
    name: 'Reconnecting with Old Friend',
    planet: 'Venus',
    category: 'social',
    description: 'Rekindling old friendship',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 }
    ],
    logic: 'IF (positive_surprise) AND (reconnection) THEN old_friend',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Reconnect with an old friend?",
      follow_up_prompts: ["Old friendships have history. Nice to reconnect!"],
      internal_label: 'Friend reconnection',
      intervention_timing: 'When user mentions reunion'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC006_BETRAYAL_BY_FRIEND: {
    id: 'SOC006',
    name: 'Friend Betrayal',
    planet: 'Venus',
    category: 'social',
    description: 'Trust broken by friend',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'SPIKE', threshold: 12, unit: 'bpm', window: 7 }
    ],
    logic: 'IF (acute_distress) AND (betrayal) THEN friend_betrayal',
    confidence_threshold: 0.85,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Someone betray your trust?",
      follow_up_prompts: ["Betrayal by a friend cuts deep. That's not okay."],
      internal_label: 'Betrayal',
      intervention_timing: 'When user mentions betrayal'
    },
    urgency: 'critical',
    sensitive: true
  },

  SOC007_TOXIC_FRIENDSHIP_ENDING: {
    id: 'SOC007',
    name: 'Ending Toxic Friendship',
    planet: 'Venus',
    category: 'social',
    description: 'Cutting off unhealthy friend',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (relief) AND (boundary_setting) THEN toxic_friendship_end',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Cut off a toxic friend?",
      follow_up_prompts: ["That takes courage. Your wellbeing matters."],
      internal_label: 'Toxic friendship end',
      intervention_timing: 'After boundary set'
    },
    urgency: 'low',
    sensitive: true
  },

  SOC008_FRIEND_MENTAL_HEALTH_CRISIS: {
    id: 'SOC008',
    name: "Friend's Mental Health Crisis",
    planet: 'Venus',
    category: 'social',
    description: 'Supporting friend in crisis',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 }
    ],
    logic: 'IF (caregiver_stress) AND (friend_crisis) THEN supporting_friend',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Friend going through something hard?",
      follow_up_prompts: ["Supporting others is draining. Don't forget your own needs."],
      internal_label: 'Friend in crisis',
      intervention_timing: 'During support period'
    },
    urgency: 'high',
    sensitive: true
  },

  SOC009_JOINING_FRIEND_GROUP: {
    id: 'SOC009',
    name: 'Joining New Friend Group',
    planet: 'Venus',
    category: 'social',
    description: 'Becoming part of social circle',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 21 }
    ],
    logic: 'IF (social_expansion) AND (belonging) THEN new_friend_group',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Found a new friend group?",
      follow_up_prompts: ["Belonging feels good!"],
      internal_label: 'New friend group',
      intervention_timing: 'When user mentions new friends'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC010_OUTGROWING_FRIENDS: {
    id: 'SOC010',
    name: 'Outgrowing Friend Group',
    planet: 'Venus',
    category: 'social',
    description: 'Growing apart from friends',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 18, unit: 'percent', window: 30 }
    ],
    logic: 'IF (social_disconnect) AND (values_shift) THEN outgrowing',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Feeling disconnected from old friends?",
      follow_up_prompts: ["People grow. Sometimes that means growing apart."],
      internal_label: 'Outgrowing friends',
      intervention_timing: 'When user mentions disconnect'
    },
    urgency: 'medium',
    sensitive: true
  },

  SOC011_FRIEND_MARRIAGE_JEALOUSY: {
    id: 'SOC011',
    name: 'Friend Getting Married',
    planet: 'Venus',
    category: 'social',
    description: 'Friend life stage shift',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (mixed_emotions) AND (life_stage_gap) THEN friend_marriage',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Friend getting married?",
      follow_up_prompts: ["Happy for them but worried about the friendship changing? That's normal."],
      internal_label: 'Friend marriage',
      intervention_timing: 'Pre-wedding'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC012_LONG_DISTANCE_FRIENDSHIP: {
    id: 'SOC012',
    name: 'Long Distance Friendship Strain',
    planet: 'Venus',
    category: 'social',
    description: 'Distance affecting friendship',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUAL_DECLINE', threshold: 10, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'GRADUAL_DECLINE', threshold: 12, unit: 'percent', window: 60 }
    ],
    logic: 'IF (slow_loss) AND (distance) THEN friendship_fading',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Long distance friendship getting hard?",
      follow_up_prompts: ["Distance makes it tough. Reach out!"],
      internal_label: 'Distance strain',
      intervention_timing: 'When user mentions missing friend'
    },
    urgency: 'medium',
    sensitive: false
  },

  // Loneliness & Social Isolation (10 patterns)
  SOC013_ACUTE_LONELINESS: {
    id: 'SOC013',
    name: 'Acute Loneliness',
    planet: 'Venus',
    category: 'social',
    description: 'Sudden intense loneliness',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 28, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 14 }
    ],
    logic: 'IF (social_pain) AND (isolation) THEN acute_loneliness',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Feeling really lonely?",
      follow_up_prompts: ["Loneliness hurts. Want to talk about it?"],
      internal_label: 'Acute loneliness',
      intervention_timing: 'Immediate support'
    },
    urgency: 'critical',
    sensitive: true
  },

  SOC014_CHRONIC_LONELINESS: {
    id: 'SOC014',
    name: 'Chronic Loneliness',
    planet: 'Venus',
    category: 'social',
    description: 'Long-term social isolation',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 60 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 28, unit: 'percent', window: 60 }
    ],
    logic: 'IF (sustained_isolation) AND (health_impact) THEN chronic_loneliness',
    confidence_threshold: 0.87,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Been feeling lonely for a while?",
      follow_up_prompts: ["Chronic loneliness affects health. Please reach out for connection."],
      internal_label: 'Chronic loneliness',
      intervention_timing: 'Urgent intervention'
    },
    urgency: 'critical',
    sensitive: true
  },

  SOC015_MOVING_SOCIAL_ISOLATION: {
    id: 'SOC015',
    name: 'Post-Move Social Isolation',
    planet: 'Venus',
    category: 'social',
    description: 'Lonely after relocating',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 25, unit: 'percent', window: 30 }
    ],
    logic: 'IF (relocation) AND (no_social_network) THEN move_isolation',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Struggling to make friends in your new place?",
      follow_up_prompts: ["New city loneliness is real. Join groups, try Meetup, be patient."],
      internal_label: 'Move isolation',
      intervention_timing: 'Post-move months'
    },
    urgency: 'high',
    sensitive: true
  },

  SOC016_EMPTY_NEST_LONELINESS: {
    id: 'SOC016',
    name: 'Empty Nest Loneliness',
    planet: 'Venus',
    category: 'social',
    description: 'Kids leaving home',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 30 }
    ],
    logic: 'IF (parent) AND (kids_leaving) THEN empty_nest',
    confidence_threshold: 0.83,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Kids left for college?",
      follow_up_prompts: ["Empty nest is a real transition. Time to rediscover yourself."],
      internal_label: 'Empty nest',
      intervention_timing: 'After kids leave'
    },
    urgency: 'high',
    sensitive: true
  },

  SOC017_REMOTE_WORK_ISOLATION: {
    id: 'SOC017',
    name: 'Remote Work Social Isolation',
    planet: 'Venus',
    category: 'social',
    description: 'Lonely from WFH',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (remote_work) AND (social_deprivation) THEN WFH_isolation',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Remote work getting lonely?",
      follow_up_prompts: ["WFH isolation is common. Try coworking spaces or social hobbies."],
      internal_label: 'WFH isolation',
      intervention_timing: 'Prolonged remote work'
    },
    urgency: 'medium',
    sensitive: false
  },

  SOC018_PANDEMIC_SOCIAL_ATROPHY: {
    id: 'SOC018',
    name: 'Social Skills Atrophy',
    planet: 'Venus',
    category: 'social',
    description: 'Lost social confidence',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 21 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (social_anxiety) AND (post_isolation) THEN skill_atrophy',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Socializing feels harder after isolation?",
      follow_up_prompts: ["Social skills are like muscles. You'll get them back."],
      internal_label: 'Social atrophy',
      intervention_timing: 'Re-entry to social life'
    },
    urgency: 'medium',
    sensitive: true
  },

  SOC019_ONLY_CHILD_LONELINESS: {
    id: 'SOC019',
    name: 'Only Child Social Pattern',
    planet: 'Venus',
    category: 'social',
    description: 'Only child isolation',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 60 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 60 }
    ],
    logic: 'IF (child) AND (no_siblings) AND (isolation) THEN only_child_lonely',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Being an only child feeling lonely?",
      follow_up_prompts: ["Join clubs, sports, activities. Building friendships is important."],
      internal_label: 'Only child lonely',
      intervention_timing: 'Ongoing support'
    },
    urgency: 'high',
    sensitive: true
  },

  SOC020_WIDOW_WIDOWER_ISOLATION: {
    id: 'SOC020',
    name: 'Widowhood Social Isolation',
    planet: 'Venus',
    category: 'social',
    description: 'Lonely after spouse death',
    conditions: [
      { behavior: 'hrv', operator: 'EXTREME_LOW', threshold: 30, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 60 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 40, unit: 'percent', window: 60 }
    ],
    logic: 'IF (grief) AND (social_network_collapse) THEN widowhood_isolation',
    confidence_threshold: 0.89,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Grief and loneliness after losing your spouse?",
      follow_up_prompts: ["Widowhood is devastating. Grief support groups help."],
      internal_label: 'Widowhood isolation',
      intervention_timing: 'Critical support needed'
    },
    urgency: 'critical',
    sensitive: true
  },

  SOC021_ELDER_LONELINESS: {
    id: 'SOC021',
    name: 'Elder Social Isolation',
    planet: 'Venus',
    category: 'social',
    description: 'Aging loneliness',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 90 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 90 }
    ],
    logic: 'IF (elderly) AND (shrinking_network) THEN elder_isolation',
    confidence_threshold: 0.85,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [60, 120],
    silent_guidance: {
      discovery_question: "Feeling more isolated as you age?",
      follow_up_prompts: ["Senior centers, volunteer work, stay connected."],
      internal_label: 'Elder isolation',
      intervention_timing: 'Ongoing concern'
    },
    urgency: 'critical',
    sensitive: true
  },

  SOC022_INTROVERT_SOCIAL_RECOVERY: {
    id: 'SOC022',
    name: 'Introvert Social Recovery',
    planet: 'Venus',
    category: 'social',
    description: 'Recovering from socialization',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 3 }
    ],
    logic: 'IF (post_social_relief) AND (alone_recharge) THEN introvert_recovery',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Need alone time after being social?",
      follow_up_prompts: ["Introverts recharge alone. That's healthy!"],
      internal_label: 'Introvert recovery',
      intervention_timing: 'Post-social period'
    },
    urgency: 'low',
    sensitive: false
  },

  // Community & Belonging (8 patterns)
  SOC023_JOINING_COMMUNITY: {
    id: 'SOC023',
    name: 'Joining New Community',
    planet: 'Venus',
    category: 'social',
    description: 'Finding belonging in group',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (belonging) AND (community_engagement) THEN joining_community',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Found a community you belong to?",
      follow_up_prompts: ["Belonging is powerful!"],
      internal_label: 'Joining community',
      intervention_timing: 'When user mentions group'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC024_LEAVING_RELIGIOUS_COMMUNITY: {
    id: 'SOC024',
    name: 'Leaving Religious Community',
    planet: 'Venus',
    category: 'social',
    description: 'Losing faith community',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 28, unit: 'percent', window: 30 }
    ],
    logic: 'IF (identity_crisis) AND (community_loss) THEN faith_leaving',
    confidence_threshold: 0.84,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Leaving your faith community?",
      follow_up_prompts: ["Losing belief AND community is a double loss."],
      internal_label: 'Faith leaving',
      intervention_timing: 'Deconstruction period'
    },
    urgency: 'high',
    sensitive: true
  },

  SOC025_FINDING_CHOSEN_FAMILY: {
    id: 'SOC025',
    name: 'Finding Chosen Family',
    planet: 'Venus',
    category: 'social',
    description: 'Building non-blood family',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 22, unit: 'percent', window: 45 }
    ],
    logic: 'IF (deep_belonging) AND (chosen_family) THEN found_family',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Found your chosen family?",
      follow_up_prompts: ["Blood doesn't make family. Love and loyalty do."],
      internal_label: 'Chosen family',
      intervention_timing: 'When user mentions tribe'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC026_VOLUNTEER_COMMUNITY: {
    id: 'SOC026',
    name: 'Volunteer Community Building',
    planet: 'Venus',
    category: 'social',
    description: 'Connection through service',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 30 }
    ],
    logic: 'IF (purpose) AND (community) THEN volunteer_belonging',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Volunteering bringing you connection?",
      follow_up_prompts: ["Service builds community and purpose!"],
      internal_label: 'Volunteer community',
      intervention_timing: 'When user mentions volunteering'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC027_HOBBY_COMMUNITY: {
    id: 'SOC027',
    name: 'Hobby Community Connection',
    planet: 'Venus',
    category: 'social',
    description: 'Friends through shared interest',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 22, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 30 }
    ],
    logic: 'IF (shared_passion) AND (social_bonds) THEN hobby_community',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Finding friends through your hobby?",
      follow_up_prompts: ["Shared interests make great foundations for friendship!"],
      internal_label: 'Hobby community',
      intervention_timing: 'When user mentions hobby'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC028_ONLINE_COMMUNITY: {
    id: 'SOC028',
    name: 'Online Community Connection',
    planet: 'Venus',
    category: 'social',
    description: 'Digital social belonging',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 21 }
    ],
    logic: 'IF (digital_belonging) AND (online_friends) THEN online_community',
    confidence_threshold: 0.73,
    evidence_required: 2,
    false_positive_rate: 0.23,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Finding community online?",
      follow_up_prompts: ["Online friendships are real friendships!"],
      internal_label: 'Online community',
      intervention_timing: 'When user mentions online friends'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC029_NEIGHBORHOOD_COMMUNITY: {
    id: 'SOC029',
    name: 'Neighborhood Community',
    planet: 'Venus',
    category: 'social',
    description: 'Local community building',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 30 }
    ],
    logic: 'IF (local_connection) AND (neighbor_bonds) THEN neighborhood_community',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Getting to know your neighbors?",
      follow_up_prompts: ["Local community makes home feel like home!"],
      internal_label: 'Neighborhood ties',
      intervention_timing: 'When user mentions neighbors'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC030_ALUMNI_REUNION: {
    id: 'SOC030',
    name: 'Alumni/Reunion Connection',
    planet: 'Venus',
    category: 'social',
    description: 'Reconnecting with old cohort',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 25, unit: 'percent', window: 7 }
    ],
    logic: 'IF (nostalgia) AND (reconnection) THEN reunion_connection',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "School reunion or alumni event?",
      follow_up_prompts: ["Reunions can be fun or weird or both!"],
      internal_label: 'Reunion',
      intervention_timing: 'Around reunion event'
    },
    urgency: 'low',
    sensitive: false
  },

  // Social Anxiety & Awkwardness (8 patterns)
  SOC031_SOCIAL_ANXIETY_EPISODE: {
    id: 'SOC031',
    name: 'Social Anxiety Episode',
    planet: 'Venus',
    category: 'social',
    description: 'Acute social anxiety',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'SPIKE', threshold: 15, unit: 'bpm', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 2 }
    ],
    logic: 'IF (pre_social_panic) AND (avoidance) THEN social_anxiety',
    confidence_threshold: 0.83,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Social event triggering anxiety?",
      follow_up_prompts: ["Social anxiety is real. Breathing exercises can help."],
      internal_label: 'Social anxiety',
      intervention_timing: 'Pre-event'
    },
    urgency: 'high',
    sensitive: true
  },

  SOC032_PUBLIC_SPEAKING_ANXIETY: {
    id: 'SOC032',
    name: 'Public Speaking Anxiety',
    planet: 'Venus',
    category: 'social',
    description: 'Performance anxiety',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'SPIKE', threshold: 20, unit: 'bpm', window: 1 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 3 }
    ],
    logic: 'IF (performance_fear) AND (public_speaking) THEN speech_anxiety',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Presentation or speech coming up?",
      follow_up_prompts: ["Public speaking fear is super common. Practice helps!"],
      internal_label: 'Speech anxiety',
      intervention_timing: 'Pre-presentation'
    },
    urgency: 'medium',
    sensitive: false
  },

  SOC033_PARTY_ANXIETY: {
    id: 'SOC033',
    name: 'Party/Event Social Anxiety',
    planet: 'Venus',
    category: 'social',
    description: 'Large gathering anxiety',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 }
    ],
    logic: 'IF (crowd_anxiety) AND (party_context) THEN party_stress',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Big party or event stressing you out?",
      follow_up_prompts: ["It's okay to leave early or skip it entirely."],
      internal_label: 'Party anxiety',
      intervention_timing: 'Pre-event'
    },
    urgency: 'medium',
    sensitive: false
  },

  SOC034_FIRST_DATE_ANXIETY: {
    id: 'SOC034',
    name: 'First Date Anxiety',
    planet: 'Venus',
    category: 'social',
    description: 'Dating nervousness',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'bpm', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 1 }
    ],
    logic: 'IF (romantic_anxiety) AND (first_date) THEN date_nerves',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "First date coming up?",
      follow_up_prompts: ["Nerves are normal! Be yourself."],
      internal_label: 'Date anxiety',
      intervention_timing: 'Day of date'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC035_SOCIAL_EMBARRASSMENT: {
    id: 'SOC035',
    name: 'Social Embarrassment',
    planet: 'Venus',
    category: 'social',
    description: 'Acute embarrassment',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 1 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 3 }
    ],
    logic: 'IF (shame) AND (social_mishap) THEN embarrassment',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [1, 7],
    silent_guidance: {
      discovery_question: "Something embarrassing happen?",
      follow_up_prompts: ["Everyone has awkward moments. People forget faster than you think."],
      internal_label: 'Embarrassment',
      intervention_timing: 'After incident'
    },
    urgency: 'medium',
    sensitive: true
  },

  SOC036_SOCIAL_RECOVERY: {
    id: 'SOC036',
    name: 'Post-Social Recovery',
    planet: 'Venus',
    category: 'social',
    description: 'Recovering from socializing',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 2 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 2 }
    ],
    logic: 'IF (exhaustion_relief) AND (solitude) THEN social_recovery',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Recovering from a social event?",
      follow_up_prompts: ["Social hangovers are real!"],
      internal_label: 'Social recovery',
      intervention_timing: 'Post-event'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC037_REJECTION_SENSITIVITY: {
    id: 'SOC037',
    name: 'Social Rejection Sensitivity',
    planet: 'Venus',
    category: 'social',
    description: 'Fear of social rejection',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 14 }
    ],
    logic: 'IF (hypervigilance) AND (rejection_fear) THEN rejection_sensitivity',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Worried about being rejected socially?",
      follow_up_prompts: ["Not everyone will like you and that's okay. Find your people."],
      internal_label: 'Rejection sensitivity',
      intervention_timing: 'Ongoing pattern'
    },
    urgency: 'medium',
    sensitive: true
  },

  SOC038_IMPOSTER_SYNDROME_SOCIAL: {
    id: 'SOC038',
    name: 'Social Imposter Syndrome',
    planet: 'Venus',
    category: 'social',
    description: 'Feeling like social fraud',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (belonging_doubt) AND (imposter_feelings) THEN social_imposter',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Feeling like you don't belong?",
      follow_up_prompts: ["If they invited you, you belong there."],
      internal_label: 'Social imposter',
      intervention_timing: 'When user mentions not belonging'
    },
    urgency: 'medium',
    sensitive: true
  },

  // Moving & Relocation (6 patterns)
  SOC039_MOVING_STRESS: {
    id: 'SOC039',
    name: 'Moving/Relocation Stress',
    planet: 'Venus',
    category: 'social',
    description: 'Stress of relocating',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 28, unit: 'percent', window: 30 }
    ],
    logic: 'IF (relocation_stress) AND (life_upheaval) THEN moving_stress',
    confidence_threshold: 0.84,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Moving to a new place?",
      follow_up_prompts: ["Moving is one of life's biggest stressors. Be patient with yourself."],
      internal_label: 'Moving stress',
      intervention_timing: 'During move'
    },
    urgency: 'high',
    sensitive: false
  },

  SOC040_NEW_CITY_ADJUSTMENT: {
    id: 'SOC040',
    name: 'New City Adjustment',
    planet: 'Venus',
    category: 'social',
    description: 'Settling into new location',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 12, unit: 'percent', window: 60 },
      { behavior: 'activeMinutes', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 60 }
    ],
    logic: 'IF (settling) AND (exploration) THEN city_adjustment',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Settling into your new city?",
      follow_up_prompts: ["Give it a year before you decide if you like it!"],
      internal_label: 'City adjustment',
      intervention_timing: 'First year'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC041_HOMESICKNESS: {
    id: 'SOC041',
    name: 'Homesickness',
    planet: 'Venus',
    category: 'social',
    description: 'Missing home after move',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 21 }
    ],
    logic: 'IF (grief_for_home) AND (displacement) THEN homesickness',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [14, 45],
    silent_guidance: {
      discovery_question: "Missing home?",
      follow_up_prompts: ["Homesickness hurts. Stay connected to home while building new roots."],
      internal_label: 'Homesickness',
      intervention_timing: 'Post-move months'
    },
    urgency: 'medium',
    sensitive: true
  },

  SOC042_EXPAT_ISOLATION: {
    id: 'SOC042',
    name: 'Expat Social Isolation',
    planet: 'Venus',
    category: 'social',
    description: 'Living abroad loneliness',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 60 }
    ],
    logic: 'IF (cultural_isolation) AND (expat_life) THEN expat_lonely',
    confidence_threshold: 0.83,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Struggling with expat life?",
      follow_up_prompts: ["Living abroad is isolating. Join expat groups!"],
      internal_label: 'Expat isolation',
      intervention_timing: 'Prolonged abroad'
    },
    urgency: 'high',
    sensitive: true
  },

  SOC043_REVERSE_CULTURE_SHOCK: {
    id: 'SOC043',
    name: 'Reverse Culture Shock',
    planet: 'Venus',
    category: 'social',
    description: 'Returning home feels foreign',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 21 }
    ],
    logic: 'IF (home_feels_foreign) AND (return_adjustment) THEN reverse_shock',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [14, 45],
    silent_guidance: {
      discovery_question: "Home feels weird after being away?",
      follow_up_prompts: ["Reverse culture shock is real. You've changed."],
      internal_label: 'Reverse culture shock',
      intervention_timing: 'Return period'
    },
    urgency: 'medium',
    sensitive: false
  },

  SOC044_MILITARY_RELOCATION: {
    id: 'SOC044',
    name: 'Military Family Relocation',
    planet: 'Venus',
    category: 'social',
    description: 'PCS move stress',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 22, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 30 }
    ],
    logic: 'IF (military_move) AND (repeated_displacement) THEN PCS_stress',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "PCS move?",
      follow_up_prompts: ["Military families move a lot. That's exhausting."],
      internal_label: 'Military move',
      intervention_timing: 'During PCS'
    },
    urgency: 'high',
    sensitive: false
  },

  // Miscellaneous Social (11 patterns)
  SOC045_GHOSTED: {
    id: 'SOC045',
    name: 'Being Ghosted',
    planet: 'Venus',
    category: 'social',
    description: 'Sudden contact cutoff',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 }
    ],
    logic: 'IF (rejection) AND (ghosting) THEN ghosted_pain',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Someone ghost you?",
      follow_up_prompts: ["Ghosting is cowardly and it hurts. You deserve better."],
      internal_label: 'Ghosted',
      intervention_timing: 'After ghosting'
    },
    urgency: 'medium',
    sensitive: true
  },

  SOC046_SOCIAL_MEDIA_FOMO: {
    id: 'SOC046',
    name: 'Social Media FOMO',
    planet: 'Venus',
    category: 'social',
    description: 'Fear of missing out',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (comparison) AND (social_media) THEN FOMO',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Social media making you feel left out?",
      follow_up_prompts: ["Social media is highlights only. Everyone's real life is messier."],
      internal_label: 'FOMO',
      intervention_timing: 'When pattern emerges'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC047_CANCELLED_PLANS_RELIEF: {
    id: 'SOC047',
    name: 'Cancelled Plans Relief',
    planet: 'Venus',
    category: 'social',
    description: 'Happy plans fell through',
    conditions: [
      { behavior: 'hrv', operator: 'SPIKE', threshold: 15, unit: 'percent', window: 1 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 1 }
    ],
    logic: 'IF (relief) AND (cancelled_plans) THEN cancellation_joy',
    confidence_threshold: 0.73,
    evidence_required: 2,
    false_positive_rate: 0.23,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Plans got cancelled and you're relieved?",
      follow_up_prompts: ["That's a sign you were overcommitted!"],
      internal_label: 'Cancellation relief',
      intervention_timing: 'When plans cancel'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC048_SOCIAL_BURNOUT: {
    id: 'SOC048',
    name: 'Social Burnout',
    planet: 'Venus',
    category: 'social',
    description: 'Exhausted from peopling',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 22, unit: 'percent', window: 21 }
    ],
    logic: 'IF (social_exhaustion) AND (overcommitment) THEN social_burnout',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Burnt out on socializing?",
      follow_up_prompts: ["It's okay to say no and recharge."],
      internal_label: 'Social burnout',
      intervention_timing: 'When pattern emerges'
    },
    urgency: 'medium',
    sensitive: false
  },

  SOC049_NETWORKING_SUCCESS: {
    id: 'SOC049',
    name: 'Professional Networking Win',
    planet: 'Venus',
    category: 'social',
    description: 'Valuable connection made',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 }
    ],
    logic: 'IF (opportunity) AND (connection_made) THEN networking_win',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Make a good professional connection?",
      follow_up_prompts: ["Networking pays off!"],
      internal_label: 'Networking win',
      intervention_timing: 'After event'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC050_GENERATIONAL_DISCONNECT: {
    id: 'SOC050',
    name: 'Generational Social Gap',
    planet: 'Venus',
    category: 'social',
    description: 'Age gap social disconnect',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (age_gap) AND (disconnect) THEN generational_gap',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Feeling disconnected from your age group?",
      follow_up_prompts: ["Age is just one thing. Find your vibe tribe."],
      internal_label: 'Generational gap',
      intervention_timing: 'When user mentions age'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC051_CLIQUE_EXCLUSION: {
    id: 'SOC051',
    name: 'Social Clique Exclusion',
    planet: 'Venus',
    category: 'social',
    description: 'Being left out of group',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 }
    ],
    logic: 'IF (exclusion_pain) AND (clique) THEN left_out',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Feeling left out of the group?",
      follow_up_prompts: ["Cliques are middle school energy. You deserve better friends."],
      internal_label: 'Clique exclusion',
      intervention_timing: 'When user mentions exclusion'
    },
    urgency: 'medium',
    sensitive: true
  },

  SOC052_ROOMMATE_CONFLICT: {
    id: 'SOC052',
    name: 'Roommate Conflict',
    planet: 'Venus',
    category: 'social',
    description: 'Living situation tension',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (home_stress) AND (roommate_issues) THEN roommate_conflict',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Roommate drama?",
      follow_up_prompts: ["Living with people is hard. Clear communication helps."],
      internal_label: 'Roommate conflict',
      intervention_timing: 'When user mentions roommate'
    },
    urgency: 'medium',
    sensitive: false
  },

  SOC053_MENTOR_RELATIONSHIP: {
    id: 'SOC053',
    name: 'Finding Mentor',
    planet: 'Venus',
    category: 'social',
    description: 'Meaningful mentorship',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (guidance) AND (mentorship) THEN mentor_found',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Found a mentor?",
      follow_up_prompts: ["Good mentors are invaluable!"],
      internal_label: 'Mentorship',
      intervention_timing: 'When user mentions mentor'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC054_BECOMING_MENTOR: {
    id: 'SOC054',
    name: 'Becoming a Mentor',
    planet: 'Venus',
    category: 'social',
    description: 'Mentoring someone',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 30 }
    ],
    logic: 'IF (purpose) AND (mentoring) THEN mentor_role',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Mentoring someone?",
      follow_up_prompts: ["Giving back feels good!"],
      internal_label: 'Mentor role',
      intervention_timing: 'When user mentions mentee'
    },
    urgency: 'low',
    sensitive: false
  },

  SOC055_TOXIC_WORK_CULTURE: {
    id: 'SOC055',
    name: 'Toxic Workplace Social Culture',
    planet: 'Venus',
    category: 'social',
    description: 'Unhealthy work environment',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 22, unit: 'percent', window: 30 }
    ],
    logic: 'IF (workplace_toxicity) AND (social_damage) THEN toxic_culture',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Work culture toxic?",
      follow_up_prompts: ["Toxic workplaces damage mental health. Consider your options."],
      internal_label: 'Toxic work culture',
      intervention_timing: 'Ongoing concern'
    },
    urgency: 'high',
    sensitive: true
  }
};
