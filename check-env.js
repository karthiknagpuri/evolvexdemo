// Script to verify environment variables
console.log('Checking environment variables...');

// Required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CLERK_WEBHOOK_SECRET',
  'NODE_ENV'
];

// Check each required variable
let allSet = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value;
  const maskedValue = isSet ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 'NOT SET';
  
  console.log(`${varName}: ${isSet ? '✅' : '❌'} ${maskedValue}`);
  
  if (!isSet) {
    allSet = false;
  }
});

// Check Supabase URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  const isValidUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
  console.log(`Supabase URL format: ${isValidUrl ? '✅ Valid' : '❌ Invalid'}`);
}

// Check service role key format
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceRoleKey) {
  const isValidKey = serviceRoleKey.startsWith('eyJ') && serviceRoleKey.length > 100;
  console.log(`Service role key format: ${isValidKey ? '✅ Valid' : '❌ Invalid'}`);
}

// Summary
console.log('\nSummary:');
console.log(`All required variables are set: ${allSet ? '✅' : '❌'}`);

if (!allSet) {
  console.log('\nMissing variables:');
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`- ${varName}`);
    }
  });
  
  console.log('\nPlease add the missing variables to your .env.local file');
  process.exit(1);
} else {
  console.log('\n✅ All environment variables are set correctly!');
} 