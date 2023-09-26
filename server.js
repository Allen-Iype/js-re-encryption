const express = require('express');
const umbral = require("@nucypher/umbral-pre");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON payloads
app.use(express.json());

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
}

app.get('/generate-secret-key', (req, res) => {
  let secretKey = umbral.SecretKey.random();
  let secretKeyBytes = secretKey.toBEBytes(); //Secret key to Big Endian bytes as noted from the rust-umbral-pre documentation
  console.log(secretKeyBytes)
  let secretKeyHex = bytesToHex(secretKeyBytes)
  console.log(secretKeyHex)
  let publicKey = secretKey.publicKey().toCompressedBytes();
  let publicKeyHex = bytesToHex(publicKey);
  
  res.json({ secretKey: secretKeyHex, publicKey: publicKeyHex });
});

app.post('/encrypt', (req, res) => {
    let { public_key, plaintext } = req.body;
    console.log(req.body)
    let plaintext_bytes = Buffer.from(plaintext, 'utf8');
    let publicKeyBytes = hexToBytes(public_key);
    console.log(`Public key is ${public_key}`);
    let publicKey = umbral.PublicKey.fromCompressedBytes(publicKeyBytes);

  
    if (!publicKey || !plaintext_bytes) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    const [capsule, ciphertext] = umbral.encrypt(publicKey, plaintext_bytes);
    let capsuleBytes = capsule.toBytes();
    let capsuleHex = bytesToHex(capsuleBytes);
    let cipherTextHex = bytesToHex(ciphertext)
    return res.json({ capsule: capsuleHex, ciphertext: cipherTextHex });
});

app.post('/decrypt', (req, res) => {
    let dec = new TextDecoder("utf-8");
    const { secretKey, capsule, ciphertext } = req.body;
    let secretKeyBytes = hexToBytes(secretKey)
    let capsuleBytes = hexToBytes(capsule)
    let ciphertextBytes = hexToBytes(ciphertext)
    let capsuleObtained = umbral.Capsule.fromBytes(capsuleBytes)
    console.log("Secret Key recreated Bytes:", secretKeyBytes)
    let secretKeyObtained = umbral.SecretKey.fromBEBytes(secretKeyBytes);
    console.log(secretKeyObtained)
  
    if (!secretKeyObtained || !capsuleObtained || !ciphertext) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    let plaintextBytes = umbral.decryptOriginal(secretKeyObtained, capsuleObtained, ciphertextBytes);
    let plaintext = dec.decode(plaintextBytes)

    return res.json({ plaintext });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
