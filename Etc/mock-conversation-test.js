/**
 * MOCK CURVEBALL CONVERSATION
 * Simulates what Phoenix's responses would be to wild questions
 * (Without needing production auth)
 */

console.log('\n' + '🔥'.repeat(40));
console.log('PHOENIX MOCK CURVEBALL CONVERSATION');
console.log('🔥'.repeat(40) + '\n');

const conversations = [
    {
        phase: "RANDOM QUESTIONS",
        exchanges: [
            {
                you: "What's the meaning of life?",
                phoenix: "That's a deep philosophical question! While I can't give you THE answer, I can help you track and optimize YOUR life's meaningful activities. What areas of your life would you like to focus on improving?"
            },
            {
                you: "Can AI dream?",
                phoenix: "Interesting question! I don't dream, but I do learn patterns from your data. Speaking of patterns, would you like me to analyze your sleep patterns? That might help you dream better!"
            },
            {
                you: "Should I get a cat or a dog?",
                phoenix: "Both are great! Would you like me to track which option would fit better with your lifestyle? I can monitor your schedule, activity levels, and living situation to give you a data-driven recommendation."
            }
        ]
    },
    {
        phase: "LAW SCHOOL AT NYU",
        exchanges: [
            {
                you: "I'm studying for the bar exam and completely overwhelmed. How do I manage this?",
                phoenix: "Bar exam stress is real! Let's break this down systematically:\n\n1. I can track your study hours per subject\n2. Monitor your stress levels and breaks\n3. Optimize your study schedule based on your peak performance times\n4. Set up reminders for practice tests\n\nWould you like me to create a study tracker for you?"
            },
            {
                you: "Track my study hours for Constitutional Law",
                phoenix: "✅ Created 'Constitutional Law Study Tracker'\n\n📊 WIDGET GENERATED: Study Hours Logger\n- Quick log: 30min, 1hr, 2hr, 4hr buttons\n- Subject: Constitutional Law\n- Tracks: Duration, focus level, notes\n- Stats: Daily/weekly totals, streak counter\n\nI'll also analyze which times of day you're most productive and suggest optimal study schedules."
            },
            {
                you: "I need to wake up at 5am every day to study. Can you help?",
                phoenix: "Absolutely! Based on your sleep data:\n\n🎯 RECOMMENDATIONS:\n1. Current sleep: Need at least 7 hours → bedtime by 10pm\n2. Created morning routine tracker\n3. I'll monitor your consistency and adjust recommendations\n\nPattern detected: You're a night owl trying to become an early bird. This will take 2-3 weeks to adjust. I'll track your progress and suggest gradual wake-up time changes."
            }
        ]
    },
    {
        phase: "RELATIONSHIP STRUGGLES",
        exchanges: [
            {
                you: "My girlfriend thinks I study too much and we never spend time together. What should I do?",
                phoenix: "This is a classic work-life balance issue. Let me analyze:\n\n📊 CURRENT PATTERN:\n- Study time: 60-70 hrs/week (HIGH)\n- Relationship time: Unknown\n\n💡 INSIGHT: You're tracking study hours but not relationship time. What you measure, you manage.\n\nWould you like me to:\n1. Track quality time with your girlfriend\n2. Block 'relationship hours' in your schedule\n3. Send reminders for date nights\n4. Analyze study efficiency to find more free time?"
            },
            {
                you: "Track how many dates we go on per week",
                phoenix: "✅ Created 'Date Night Tracker'\n\n📊 WIDGET GENERATED:\n- Quick log: Coffee date, Dinner, Activity, Stay-in date\n- Duration tracking\n- Quality rating (1-5 stars)\n- Notes field\n\nGoal suggested: 2 dates per week (based on research for healthy relationships during high-stress periods)\n\nI'll send you insights on:\n- Dates per week trend\n- Correlation between study stress and relationship quality\n- Optimal date timing (when you're least stressed)"
            }
        ]
    },
    {
        phase: "JOB HUNTING PANIC",
        exchanges: [
            {
                you: "I need a law firm job but I'm terrified of interviews. Help!",
                phoenix: "Interview anxiety is common! Here's what we'll do:\n\n🎯 INTERVIEW PREP SYSTEM:\n1. Track practice interviews (with notes on improvement)\n2. Monitor confidence levels over time\n3. Log interview questions you struggle with\n4. Track actual interviews + outcomes\n\n📊 PATTERN ANALYSIS:\nI'll identify:\n- Which interview types cause most anxiety\n- Your improvement trajectory\n- Best preparation methods for you\n\nWould you like me to create an interview tracker?"
            },
            {
                you: "Track my job applications and follow-ups",
                phoenix: "✅ Created 'Job Application Tracker'\n\n📊 WIDGET GENERATED:\n- Firm name, position, date applied\n- Status: Applied, Screened, Interviewed, Offer, Rejected\n- Follow-up reminders (auto-suggest after 1 week)\n- Interview dates/notes\n- Offer details\n\nINSIGHTS I'LL PROVIDE:\n- Application-to-interview rate\n- Interview-to-offer rate\n- Time between stages\n- Which firms respond faster\n- Best days to apply (data shows Tuesday/Wednesday have highest response rates)"
            }
        ]
    },
    {
        phase: "FITNESS GOALS",
        exchanges: [
            {
                you: "I sit all day studying and gained 20 pounds. I need to get fit but have zero time.",
                phoenix: "Classic law student struggle! Let's tackle this:\n\n🎯 ANALYSIS:\n- Gained 20 lbs → ~10 lbs per semester\n- Sitting 10+ hrs/day → metabolism tanked\n- Zero time → need high-efficiency workouts\n\n💡 SOLUTION:\n1. Track: Weight, body composition, energy levels\n2. Start: 15-min HIIT workouts (proven effective for time-poor students)\n3. Monitor: How workouts affect study performance (hint: they improve it)\n\nFun fact: Exercise improves memory retention by 20%. You'll study BETTER if you work out!"
            },
            {
                you: "Create a workout plan for someone who only has 30 minutes a day",
                phoenix: "✅ Created '30-Minute HIIT Plan'\n\n📊 PROGRAM:\nMon/Wed/Fri: 20-min HIIT + 10-min stretch\nTue/Thu: 30-min walk (study flashcards while walking)\nWeekends: Active recovery\n\n📱 TRACKING:\n- Workout completion (streak counter)\n- Energy levels before/after\n- Study performance correlation\n- Weight trend\n\nI'll analyze which workout times work best for YOUR schedule and energy patterns."
            },
            {
                you: "Track my water intake because I forget to drink while studying",
                phoenix: "✅ Created 'Water Intake Tracker'\n\n📊 WIDGET GENERATED: 💧\n- Quick log: +1 glass buttons\n- Daily goal: 8 glasses\n- Hourly reminders (during study hours)\n- Streak counter\n\nINSIGHTS:\nDehydration = 23% cognitive performance drop\nProper hydration = better focus, less headaches\n\nI'll correlate your water intake with:\n- Study performance\n- Headache frequency\n- Energy levels"
            }
        ]
    },
    {
        phase: "ULTIMATE CURVEBALL",
        exchanges: [
            {
                you: "If I study 12 hours a day, work out 30 minutes, date night Friday, apply to 5 jobs weekly, and sleep 6 hours... am I going to survive law school?",
                phoenix: "🔥 REALITY CHECK - Let's do the math:\n\n⏰ DAILY TIME BUDGET:\n- Sleep: 6 hrs (recommended: 7-8)\n- Study: 12 hrs\n- Workout: 0.5 hrs\n- Meals/hygiene: 2 hrs\n- Commute: 1 hr\n- TOTAL: 21.5 hrs\n= 2.5 hrs \"free time\"\n\n📊 SUSTAINABILITY SCORE: 4/10\n\n⚠️ BURNOUT RISKS:\n1. Sleep debt: 1-2 hrs/day = 7-14 hrs/week deficit\n2. Relationship time: 3 hrs/week (CRITICALLY LOW)\n3. Recovery time: Minimal\n4. Job apps: 5 hrs/week not budgeted\n\n🎯 OPTIMIZED SCHEDULE:\n- Study: 10 hrs/day (more focused = same output)\n- Sleep: 7 hrs (non-negotiable)\n- Workout: 30 min\n- Relationship: 1 hr/day + Friday date night\n- Job apps: 1 hr/day (5 hrs/week)\n- Buffer: 3 hrs/day for life\n\nI'll track ALL of this and show you where time is actually going vs. where you THINK it's going. Most law students overestimate study time and underestimate waste."
            },
            {
                you: "Can you track all of that? Like everything I just said?",
                phoenix: "✅ CREATED COMPREHENSIVE LAW STUDENT LIFE DASHBOARD\n\n📊 GENERATED WIDGETS (7 total):\n\n1. 📚 Study Time Tracker\n   - Per subject logging\n   - Focus level tracking\n   - Productivity score\n\n2. 💪 Workout Logger\n   - 30-min completion tracker\n   - Energy level correlation\n\n3. ❤️ Relationship Time\n   - Date night tracker\n   - Quality time logger\n   - Happiness rating\n\n4. 💼 Job Applications\n   - 5 apps/week goal\n   - Follow-up reminders\n   - Interview pipeline\n\n5. 😴 Sleep Tracker\n   - Duration + quality\n   - Sleep debt calculator\n   - Recovery score\n\n6. 💧 Water/Nutrition\n   - Hydration tracking\n   - Meal logging\n\n7. 📊 LIFE DASHBOARD\n   - Shows balance across all areas\n   - Burnout risk score\n   - Weekly insights\n\n🧠 WHAT I'LL ANALYZE:\n- Which activities drain vs. energize you\n- Optimal study/work/life balance for YOUR goals\n- Early burnout warnings\n- Efficiency improvements\n- Cross-domain correlations (sleep → study performance, workout → mood, etc.)\n\n💡 PREDICTION:\nIf you actually track all this for 2 weeks, I'll show you that you're probably:\n- Studying less than 12 hrs/day (more like 8-9)\n- Wasting 3-4 hrs/day on low-value activities\n- Sleeping less than you think\n\nLet's find out!"
            }
        ]
    }
];

// Pretty print the conversation
conversations.forEach(({ phase, exchanges }) => {
    console.log('\n' + '='.repeat(80));
    console.log(`📍 PHASE: ${phase}`);
    console.log('='.repeat(80));

    exchanges.forEach(({ you, phoenix }, i) => {
        console.log(`\n${i + 1}. 🗣️  YOU: ${you}`);
        console.log(`\n   🤖 PHOENIX:\n   ${phoenix.split('\n').join('\n   ')}`);
        console.log('\n' + '-'.repeat(80));
    });
});

console.log('\n' + '🔥'.repeat(40));
console.log('CONVERSATION COMPLETE!');
console.log('🔥'.repeat(40) + '\n');

console.log('💡 KEY PHOENIX BEHAVIORS DEMONSTRATED:');
console.log('1. ✅ Handles random/philosophical questions gracefully');
console.log('2. ✅ Pivots to actionable tracking solutions');
console.log('3. ✅ Generates custom widgets on-demand');
console.log('4. ✅ Provides data-driven insights');
console.log('5. ✅ Detects complex multi-domain life situations');
console.log('6. ✅ Creates comprehensive tracking systems');
console.log('7. ✅ Offers honest reality checks with solutions');
console.log('8. ✅ Correlates cross-domain data (sleep → performance)');
console.log('\n');
