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

const targetFolders = [
  'adventure',
  'military'
];

const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const parts = sortedKeys.map(key => `${key}=${params[key]}`);
  const signatureString = parts.join('&') + apiSecret;
  return crypto.createHash('sha1').update(signatureString).digest('hex');
}

async function uploadFile(filePath, cloudinaryFolder) {
  const filename = path.basename(filePath, path.extname(filePath));
  const fileBuffer = await readFile(filePath);
  const fileBlob = new Blob([fileBuffer]);
  
  const timestamp = Math.round(Date.now() / 1000);
  
  // Cloudinary params to sign
  const params = {
    folder: cloudinaryFolder,
    timestamp: timestamp
  };
  
  const signature = generateSignature(params, apiSecret);
  
  const formData = new FormData();
  formData.append('file', fileBlob, path.basename(filePath));
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', cloudinaryFolder);
  formData.append('signature', signature);
  
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

async function main() {
  console.log(`Starting Cloudinary upload to cloud: "${cloudName}"`);
  console.log(`Root gallery folder: "${rootFolder}"`);
  
  for (const folderName of targetFolders) {
    const localDirPath = path.join(sourceRoot, folderName);
    const cloudinaryFolder = `${rootFolder}/${folderName}`;
    
    let entries = [];
    try {
      entries = await readdir(localDirPath, { withFileTypes: true });
    } catch (err) {
      console.log(`[Warning] Directory not found, skipping: "${folderName}"`);
      continue;
    }
    
    const imageFiles = entries
      .filter(entry => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()))
      .map(entry => entry.name);
      
    if (imageFiles.length === 0) {
      console.log(`No images found in folder: "${folderName}"`);
      continue;
    }
    
    console.log(`\nUploading ${imageFiles.length} images from "${folderName}" to "${cloudinaryFolder}"...`);
    
    for (const file of imageFiles) {
      const filePath = path.join(localDirPath, file);
      try {
        console.log(`  Uploading ${file}...`);
        const result = await uploadFile(filePath, cloudinaryFolder);
        console.log(`    Success! Public ID: ${result.public_id}`);
      } catch (err) {
        console.error(`    [Error] Failed to upload ${file}:`, err.message);
      }
    }
  }
  
  console.log('\nUpload process completed.');
}

main().catch(err => {
  console.error('Upload script crashed:', err);
});
