const express = require('express');
const umbral = require("@nucypher/umbral-pre");
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON payloads
app.use(express.json());

app.get('/generate-secret-key', (req, res) => {
  let secret_key = umbral.SecretKey.random();
  const filePath = 'secret_key.txt';
  fs.writeFileSync(filePath, secret_key.toBEBytes().toString('hex'));
  
  console.log("Secret Key Bytes:", secret_key.toBEBytes());
  console.log("Secret Key Object:", secret_key);
  const publicKey = secret_key.publicKey();
  console.log("Public Key:", publicKey);  // Adjust based on available methods
  
  res.json({ secretKey: secret_key.toBEBytes().toString('hex') });
});

app.post('/encrypt', (req, res) => {
    let { public_key, plaintext } = req.body;
    let plaintext_bytes = Buffer.from(plaintext, 'utf8');
  
    if (!public_key || !plaintext_bytes) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    const [capsule, ciphertext] = umbral.encrypt(public_key, plaintext_bytes);
    return res.json({ capsule, ciphertext });
});

app.post('/decrypt', (req, res) => {
    const { capsule, ciphertext } = req.body;
  
    // Read and parse the secret key from the file
    const fileContent = fs.readFileSync('secret_key.txt', 'utf8');
    const secretKeyBytes = Buffer.from(fileContent, 'hex');
    const secret_key = umbral.SecretKey.fromBEBytes(secretKeyBytes);
  
    if (!secret_key || !capsule || !ciphertext) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    const plaintext = umbral.decryptOriginal(secret_key, capsule, ciphertext);
    return res.json({ plaintext });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
