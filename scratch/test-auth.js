const cloudName = 'mediaflows_bfd5dc2a-3c89-4897-834f-a90d04700f70';
const apiKey = '274387586577666';

// Test secrets: without space and with space
const secrets = [
  'pW3xOpNzm_6vbur-ZwhGfkFi2ME',
  ' pW3xOpNzm_6vbur-ZwhGfkFi2ME'
];

async function test(secret) {
  const credentials = Buffer.from(`${apiKey}:${secret}`).toString('base64');
  console.log(`Testing secret: "${secret}"`);
  
  try {
    const result = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/folders/colonel-badasu`, {
      headers: {
        Authorization: `Basic ${credentials}`
      }
    });
    console.log(`Status: ${result.status}`);
    if (result.ok) {
      const data = await result.json();
      console.log('Success!', data);
      return true;
    } else {
      const text = await result.text();
      console.log(`Error Response: ${text}`);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
  return false;
}

for (const secret of secrets) {
  const success = await test(secret);
  if (success) break;
}
