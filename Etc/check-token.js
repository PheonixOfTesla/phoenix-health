// Decode the JWT token we got from login
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDk2ZjQ1NWI3YTRjMThjYzNjZTE2MSIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjI2OTY5MDAsImV4cCI6MTc2MzMwMTcwMH0.n54Lg3dY0nznUUU4AFQLOhmB-Lm8UBGt-UzrK9-TbxA";

// Decode JWT manually (base64 decode the payload)
const parts = token.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

console.log('Token Payload:', payload);
console.log('');
console.log('Issued At:', new Date(payload.iat * 1000));
console.log('Expires:', new Date(payload.exp * 1000));
console.log('');

const now = Math.floor(Date.now() / 1000);
const timeLeft = payload.exp - now;

console.log('Current Time:', new Date());
console.log('Time Until Expiry:', Math.floor(timeLeft / 3600), 'hours', Math.floor((timeLeft % 3600) / 60), 'minutes');
console.log('');

if (timeLeft < 0) {
    console.log('❌ TOKEN IS EXPIRED');
} else if (timeLeft < 300) {
    console.log('⚠️  TOKEN EXPIRES IN < 5 MINUTES (dashboard will reject it)');
} else {
    console.log('✅ TOKEN IS VALID');
}
