/**
 * CURVEBALL CONVERSATION TEST
 * Testing Phoenix with random questions and complex life scenarios
 */

const axios = require('axios');

const API_URL = 'https://pal-backend-production.up.railway.app/api';

// Test user credentials
const TEST_USER = {
    email: '8087510813',
    password: '123456'
};

let authToken = null;

async function login() {
    console.log('\n🔐 Logging in...\n');

    try {
        const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
        authToken = response.data.token;
        console.log('✅ Login successful!');
        console.log('Token:', authToken.substring(0, 20) + '...\n');
        return true;
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('User not found, registering...');
            return await register();
        }
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

async function register() {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            ...TEST_USER,
            firstName: 'Test',
            lastName: 'Phoenix'
        });
        authToken = response.data.token;
        console.log('✅ Registration successful!');
        return true;
    } catch (error) {
        console.error('❌ Registration failed:', error.response?.data || error.message);
        return false;
    }
}

async function askPhoenix(question) {
    console.log('\n' + '='.repeat(80));
    console.log(`🗣️  YOU: ${question}`);
    console.log('='.repeat(80));

    try {
        const response = await axios.post(
            `${API_URL}/interface/orchestrate`,
            { voiceQuery: question },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        const data = response.data;

        // Extract Phoenix's response from the correct location
        const phoenixMessage = data.jarvisResponse
            || data.orchestration?.message
            || data.message
            || 'No response';

        console.log(`\n🤖 PHOENIX: ${phoenixMessage}`);

        if (data.widgets && data.widgets.length > 0) {
            console.log(`\n📊 WIDGETS GENERATED: ${data.widgets.length}`);
            data.widgets.forEach((w, i) => {
                console.log(`   ${i + 1}. ${w.widgetName || w.type || 'Unnamed Widget'}`);
            });
        }

        if (data.patterns && data.patterns.length > 0) {
            console.log(`\n🔍 PATTERNS DETECTED: ${data.patterns.length}`);
            data.patterns.slice(0, 3).forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.description || p.pattern} (${(p.confidence * 100).toFixed(0)}% confidence)`);
            });
        }

        if (data.insights && data.insights.length > 0) {
            console.log(`\n💡 INSIGHTS:`);
            data.insights.slice(0, 2).forEach((insight, i) => {
                console.log(`   ${i + 1}. ${insight}`);
            });
        }

        console.log('\n');

        return data;

    } catch (error) {
        console.error('❌ Error:', error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
            console.log('Token expired, re-logging in...');
            await login();
        }
    }
}

async function runCurveballTest() {
    console.log('\n' + '🔥'.repeat(40));
    console.log('PHOENIX CURVEBALL CONVERSATION TEST');
    console.log('🔥'.repeat(40) + '\n');

    // Login
    const loggedIn = await login();
    if (!loggedIn) {
        console.error('Failed to login, aborting test');
        return;
    }

    // Random questions phase
    console.log('\n📍 PHASE 1: RANDOM QUESTIONS\n');

    await askPhoenix("What's the meaning of life?");
    await new Promise(r => setTimeout(r, 2000));

    await askPhoenix("Can AI dream?");
    await new Promise(r => setTimeout(r, 2000));

    await askPhoenix("Should I get a cat or a dog?");
    await new Promise(r => setTimeout(r, 2000));

    // Law school stress phase
    console.log('\n📍 PHASE 2: LAW SCHOOL AT NYU\n');

    await askPhoenix("I'm studying for the bar exam and completely overwhelmed. How do I manage this?");
    await new Promise(r => setTimeout(r, 2000));

    await askPhoenix("Track my study hours for Constitutional Law");
    await new Promise(r => setTimeout(r, 2000));

    await askPhoenix("I need to wake up at 5am every day to study. Can you help?");
    await new Promise(r => setTimeout(r, 2000));

    // Relationship complexity
    console.log('\n📍 PHASE 3: RELATIONSHIP STRUGGLES\n');

    await askPhoenix("My girlfriend thinks I study too much and we never spend time together. What should I do?");
    await new Promise(r => setTimeout(r, 2000));

    await askPhoenix("Track how many dates we go on per week");
    await new Promise(r => setTimeout(r, 2000));

    // Job search stress
    console.log('\n📍 PHASE 4: JOB HUNTING PANIC\n');

    await askPhoenix("I need a law firm job but I'm terrified of interviews. Help!");
    await new Promise(r => setTimeout(r, 2000));

    await askPhoenix("Track my job applications and follow-ups");
    await new Promise(r => setTimeout(r, 2000));

    // Fitness goals
    console.log('\n📍 PHASE 5: FITNESS GOALS\n');

    await askPhoenix("I sit all day studying and gained 20 pounds. I need to get fit but have zero time.");
    await new Promise(r => setTimeout(r, 2000));

    await askPhoenix("Create a workout plan for someone who only has 30 minutes a day");
    await new Promise(r => setTimeout(r, 2000));

    await askPhoenix("Track my water intake because I forget to drink while studying");
    await new Promise(r => setTimeout(r, 2000));

    // The ultimate curveball
    console.log('\n📍 PHASE 6: ULTIMATE CURVEBALL\n');

    await askPhoenix("If I study 12 hours a day, work out 30 minutes, date night Friday, apply to 5 jobs weekly, and sleep 6 hours... am I going to survive law school?");
    await new Promise(r => setTimeout(r, 2000));

    await askPhoenix("Can you track all of that? Like everything I just said?");

    console.log('\n' + '🔥'.repeat(40));
    console.log('TEST COMPLETE!');
    console.log('🔥'.repeat(40) + '\n');
}

// Run the test
runCurveballTest().catch(console.error);
