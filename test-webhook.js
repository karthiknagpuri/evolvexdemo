import fetch from 'node-fetch';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Test user data
const userData = {
  id: generateUUID(),
  email_addresses: [{
    email_address: 'test@example.com',
    id: 'ema_test_' + Date.now(),
    verification: { status: 'verified', strategy: 'email_code' }
  }],
  username: 'testuser_' + Date.now(),
  first_name: 'Test',
  last_name: 'User',
  image_url: 'https://example.com/avatar.jpg',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Test webhook
async function testWebhook() {
  try {
    console.log('Testing webhook with user data:', userData);
    
    const payload = {
      data: userData,
      object: 'event',
      type: 'user.created'
    };
    
    const response = await fetch('http://localhost:3000/api/clerk-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('Webhook response:', result);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
      console.log('Created user profile:', result.data);
    } else {
      console.error('❌ Webhook test failed:', result);
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

// Run test
testWebhook(); 