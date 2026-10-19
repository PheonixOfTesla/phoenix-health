// Quick Twilio verification script
const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log('\n🔍 Verifying Twilio configuration...\n');

// Test 1: Check credentials
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.log('❌ Missing Twilio credentials in .env');
  process.exit(1);
}

console.log('✅ Twilio credentials found');
console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...`);
console.log(`   Phone: ${process.env.TWILIO_PHONE_NUMBER}`);

// Test 2: Verify account
client.api.accounts(process.env.TWILIO_ACCOUNT_SID)
  .fetch()
  .then(account => {
    console.log('\n✅ Twilio account verified');
    console.log(`   Status: ${account.status}`);
    console.log(`   Name: ${account.friendlyName}`);

    // Test 3: Check phone number
    return client.incomingPhoneNumbers.list({ limit: 1 });
  })
  .then(phoneNumbers => {
    console.log('\n✅ Phone number configured');
    console.log(`   Number: ${phoneNumbers[0].phoneNumber}`);
    console.log(`   Capabilities: Voice=${phoneNumbers[0].capabilities.voice}, SMS=${phoneNumbers[0].capabilities.sms}`);

    console.log('\n🎉 Twilio is ready to make calls!\n');
    console.log('📞 Ready to call:');
    console.log('   • Uber: 1-800-8237 (+18008237)');
    console.log('   • Lyft: 1-855-593-8435 (+18555938435)');
    console.log('\n💰 Cost per call: ~$0.04');
    console.log('💵 Charge per ride: $3-5');
    console.log('📈 Profit: $2.96-4.96 (99% margin)\n');
  })
  .catch(error => {
    console.log('\n❌ Twilio verification failed:', error.message);
    process.exit(1);
  });
