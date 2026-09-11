import fs from 'fs'

const envText = fs.readFileSync('.env', 'utf-8')
envText.split('\n').forEach(line => {
  const [k, v] = line.split('=')
  if (k && v) process.env[k.trim()] = v.trim()
})

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
const rootFolder = process.env.CLOUDINARY_GALLERY_ROOT || 'colonel-badasu'

const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

async function testFullUploadAndDelete() {
  console.log('--- Step 1: Check folder list in Cloudinary ---')
  const listResBefore = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/folders/${rootFolder}`,
    { headers: { Authorization: `Basic ${credentials}` } }
  )
  const foldersBefore = (await listResBefore.json()).folders || []
  console.log('Folders in Cloudinary:', foldersBefore.map(f => f.name))

  console.log('--- Step 2: Delete "ecowas-peace-support-operations" using fixed handler ---')
  const { default: handler } = await import('../api/delete-collection.js')

  const fakeReq = {
    method: 'POST',
    body: { folderName: 'ECOWAS Peace Support Operations', slug: 'ecowas-peace-support-operations' }
  }

  let resultStatus = 200
  let resultJson = {}

  const fakeRes = {
    status(code) {
      resultStatus = code
      return this
    },
    json(data) {
      resultJson = data
      return this
    },
    setHeader() {}
  }

  await handler(fakeReq, fakeRes)
  console.log('Delete handler result:', resultStatus, resultJson)

  console.log('--- Step 3: Verify folder is gone from Cloudinary ---')
  const listResAfter = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/folders/${rootFolder}`,
    { headers: { Authorization: `Basic ${credentials}` } }
  )
  const foldersAfter = (await listResAfter.json()).folders || []
  console.log('Folders after delete:', foldersAfter.map(f => f.name))
  
  const isGone = !foldersAfter.some(f => f.name === 'ecowas-peace-support-operations')
  console.log('SUCCESS! ecowas-peace-support-operations deleted from Cloudinary:', isGone)
}

testFullUploadAndDelete().catch(console.error)
