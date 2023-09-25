const express = require('express');
const umbral = require("@nucypher/umbral-pre");
const fs = require('fs');


const app = express();
const port = process.env.PORT || 3000;

// Define an API endpoint to generate a random Umbral secret key
app.get('/generate-secret-key', (req, res) => {
  let secret_key = umbral.SecretKey.random();
  const filePath = 'secret_key.txt';
fs.writeFileSync(filePath, secret_key.toString());
  console.log(secret_key.toBEBytes())
  console.log(umbral.SecretKey.fromBEBytes(secret_key.toBEBytes()))
  console.log(secret_key.publicKey.toString())
  res.json({ secretKey: secret_key.toString() });
});

app.post('/encrypt', (req, res) => {
    let { public_key, plaintext } = req.body;
    let plaintext_bytes = enc.encode(plaintext);
  
    if (!public_key || !plaintext_bytes) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    const [capsule, ciphertext] = umbral.encrypt(public_key, plaintext_bytes);
    return res.json({ capsule, ciphertext });
  });

  app.post('/decrypt', (req, res) => {
    const { secret_key, capsule, ciphertext } = req.body;
  
    if (!secret_key || !capsule || !ciphertext) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    const plaintext = umbral.decryptOriginal(secret_key, capsule, ciphertext);
    return res.json({ plaintext });
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
