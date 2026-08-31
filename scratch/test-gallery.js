import handler from '../api/gallery.js';

console.log('Env variables loaded:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '***' : 'missing');

const req = {
  method: 'GET',
  query: {}
};

const res = {
  statusCode: 200,
  headers: {},
  setHeader(name, value) {
    this.headers[name] = value;
    return this;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    console.log('\nStatus:', this.statusCode);
    console.log('Headers:', this.headers);
    console.log('JSON Output:', JSON.stringify(data, null, 2));
    return this;
  }
};

try {
  await handler(req, res);
} catch (error) {
  console.error('\nExecution failed with error:', error);
}
