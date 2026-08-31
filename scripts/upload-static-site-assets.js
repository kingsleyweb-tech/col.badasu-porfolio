import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const rootFolder = process.env.CLOUDINARY_GALLERY_ROOT || 'colonel-badasu';

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Error: Cloudinary credentials missing from environment.');
  process.exit(1);
}

const sourceRoot = path.join(process.cwd(), 'src', 'assets', 'images');
const staticFolders = ['hero', 'career', 'achievements', 'gallery', ''];
const collectionFolders = new Set([
  'adventure', 'boundary opearations', 'collaborations', 'ecowas',
  'ghana-boundary commission', 'interviewing', 'jungle', 'meetiings',
  'military', 'operation wth imigration', 'photos', 'sea border operation',
  'tv3', 'university of london graduation', '__optimized__'
]);

const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const parts = sortedKeys.map(key => `${key}=${params[key]}`);
  const signatureString = parts.join('&') + apiSecret;
  return crypto.createHash('sha1').update(signatureString).digest('hex');
}

async function uploadFile(filePath, subFolder) {
  const filename = path.basename(filePath, path.extname(filePath));
  const fileBuffer = await readFile(filePath);
  const fileBlob = new Blob([fileBuffer]);
  
  const timestamp = Math.floor(Date.now() / 1000);
  const folderPath = subFolder ? `${rootFolder}/site/${subFolder}` : `${rootFolder}/site/root`;
  
  const params = {
    folder: folderPath,
    public_id: filename,
    timestamp: timestamp,
    overwrite: 'true',
    unique_filename: 'false'
  };

  const signature = generateSignature(params, apiSecret);

  const formData = new FormData();
  formData.append('file', fileBlob, path.basename(filePath));
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folderPath);
  formData.append('public_id', filename);
  formData.append('overwrite', 'true');
  formData.append('unique_filename', 'false');

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json;
}

async function main() {
  console.log(`Starting Cloudinary upload for static portfolio site assets...`);
  console.log(`Cloud Name: "${cloudName}"`);
  console.log(`Root folder: "${rootFolder}/site/"\n`);

  const report = [];

  for (const folder of staticFolders) {
    const dirPath = path.join(sourceRoot, folder);
    try {
      const dirStat = await stat(dirPath);
      if (!dirStat.isDirectory()) continue;
    } catch {
      continue;
    }

    const files = await readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isDirectory()) continue;
      const ext = path.extname(file.name).toLowerCase();
      if (!supportedExtensions.has(ext)) continue;

      const fullPath = path.join(dirPath, file.name);
      const relative = path.relative(sourceRoot, fullPath);
      const subFolder = folder || 'root';

      process.stdout.write(`Uploading ${relative}... `);
      try {
        const result = await uploadFile(fullPath, subFolder);
        console.log(`SUCCESS (${result.secure_url})`);
        report.push({
          local: relative,
          publicId: result.public_id,
          url: result.secure_url,
          size: result.bytes,
          status: 'SUCCESS'
        });
      } catch (err) {
        console.log(`FAILED (${err.message})`);
        report.push({
          local: relative,
          status: 'FAILED',
          error: err.message
        });
      }
    }
  }

  console.log('\n--- UPLOAD REPORT ---');
  console.table(report);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
