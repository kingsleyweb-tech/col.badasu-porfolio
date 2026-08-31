const apiKey = '274387586577666';
const secret = 'pW3xOpNzm_6vbur-ZwhGfkFi2ME';
const credentials = Buffer.from(`${apiKey}:${secret}`).toString('base64');

const candidates = [
  'gaf',
  'badasu',
  'col-badasu-portfolio',
  'col-badasu-porfolio',
  'col.badasu-porfolio',
  'colbadasuporfolio',
  'colbadasuportfolio',
  'kingsleywebtech',
  'kingsleyweb-tech',
  'henrybadasu',
  'henry-badasu',
  'henrykwakubadasu',
  'henry-kwaku-badasu'
];

async function test(cloudName) {
  try {
    const result = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/folders`, {
      headers: {
        Authorization: `Basic ${credentials}`
      }
    });
    const text = await result.text();
    if (result.ok) {
      console.log(`[SUCCESS] Cloud Name: "${cloudName}" - Status: ${result.status}`);
      return true;
    } else {
      console.log(`[FAILED] Cloud Name: "${cloudName}" - Status: ${result.status} - Response: ${text.trim()}`);
    }
  } catch (err) {
    console.log(`[ERROR] Cloud Name: "${cloudName}" - Error:`, err.message);
  }
  return false;
}

for (const name of candidates) {
  const ok = await test(name);
  if (ok) {
    console.log(`FOUND WORKING CLOUD NAME: ${name}`);
    break;
  }
}
