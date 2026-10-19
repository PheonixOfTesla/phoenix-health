require('dotenv').config();
const aiRouter = require('./Src/services/ai/router');
const optimalMind = require('./Src/services/ai/optimalMind');
const piperLocal = require('./Src/services/genesis/piperLocal');

console.log('🔍 INSPECTING CORE MACHINE CONFIGURATION...\n');

// 1. CHECK INTELLIGENCE (KIMI K2)
console.log('🧠 INTELLIGENCE CHECK:');
console.log(`   AI Router Default: ${aiRouter.metrics ? 'Active' : 'Unknown'}`);
// Inspect the private property 'kimiModel' in optimalMind if possible, or check config
console.log(`   OptimalMind Model: ${optimalMind.kimiModel || 'Unknown'}`);

const isKimiConfigured = !!process.env.OPENROUTER_API_KEY || !!process.env.MOONSHOT_API_KEY;
console.log(`   Kimi API Key Present: ${isKimiConfigured ? '✅ Yes' : '❌ No'}`);

if (optimalMind.kimiModel === 'moonshotai/kimi-k2') {
    console.log('   ✅ VERIFIED: Routing to Kimi K2');
} else {
    console.log(`   ⚠️  WARNING: Routing to ${optimalMind.kimiModel}`);
}

console.log('\n---------------------------------------------------\n');

// 2. CHECK VOICE (PIPER ONNX)
console.log('🗣️  VOICE BACKEND CHECK:');
const piperEnabled = process.env.ENABLE_LOCAL_PIPER === 'true';
console.log(`   ENABLE_LOCAL_PIPER Env Var: ${piperEnabled}`);

try {
    const isAvailable = piperLocal.isAvailable();
    console.log(`   Piper Binary Loaded: ${isAvailable ? '✅ Yes' : '❌ No'}`);
    
    if (piperEnabled && isAvailable) {
        console.log('   ✅ VERIFIED: Backend Piper is ACTIVE');
    } else if (piperEnabled && !isAvailable) {
        console.log('   ⚠️  WARNING: Piper enabled but binary failed to load');
    } else {
        console.log('   ℹ️  NOTE: Backend Piper is DISABLED (Client-side sovereignty preferred)');
    }
} catch (e) {
    console.log(`   ❌ ERROR Checking Piper: ${e.message}`);
}

console.log('\n🏁 CORE SYSTEM CHECK COMPLETE');
