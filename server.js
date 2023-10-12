const express = require('express');
const umbral = require("@nucypher/umbral-pre");
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3003;

// Set up Multer to handle file uploads and form data
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the directory where the files should be stored
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Use the original filename for the stored file
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

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
  let secretKeyBytes = secretKey.toBEBytes();
  let secretKeyHex = bytesToHex(secretKeyBytes);
  let publicKey = secretKey.publicKey().toCompressedBytes();
  let publicKeyHex = bytesToHex(publicKey);

  res.json({ secretKey: secretKeyHex, publicKey: publicKeyHex });
});

app.post('/encrypt', (req, res) => {
  let { public_key, plaintext } = req.body;
  let plaintext_bytes = Buffer.from(plaintext, 'utf8');
  let publicKeyBytes = hexToBytes(public_key);
  let publicKey = umbral.PublicKey.fromCompressedBytes(publicKeyBytes);

  if (!publicKey || !plaintext_bytes) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const [capsule, ciphertext] = umbral.encrypt(publicKey, plaintext_bytes);
  let capsuleBytes = capsule.toBytes();
  let capsuleHex = bytesToHex(capsuleBytes);
  let cipherTextHex = bytesToHex(ciphertext);
  return res.json({ capsule: capsuleHex, ciphertext: cipherTextHex });
});

app.post('/decrypt', (req, res) => {
  let dec = new TextDecoder("utf-8");
  const { secretKey, capsule, ciphertext } = req.body;
  let secretKeyBytes = hexToBytes(secretKey);
  let capsuleBytes = hexToBytes(capsule);
  let ciphertextBytes = hexToBytes(ciphertext);
  let capsuleObtained = umbral.Capsule.fromBytes(capsuleBytes);
  let secretKeyObtained = umbral.SecretKey.fromBEBytes(secretKeyBytes);

  if (!secretKeyObtained || !capsuleObtained || !ciphertext) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  let plaintextBytes = umbral.decryptOriginal(secretKeyObtained, capsuleObtained, ciphertextBytes);
  let plaintext = dec.decode(plaintextBytes);

  return res.json({ plaintext });
});

const rubixUtil = require('./rubix-util');

app.post('/api/generate-smart-contract', upload.fields([
  { name: 'did' },
  { name: 'wasmPath' },
  { name: 'schemaPath' },
  { name: 'rawCodePath' },
  { name: 'port' },
]), async (req, res) => {
  try {
    const { did, port } = req.body;
    const wasmPath = req.files.wasmPath[0].path;
    const schemaPath = req.files.schemaPath[0].path;
    const rawCodePath = req.files.rawCodePath[0].path;
    console.log(`WASM Path ${wasmPath}`);
    console.log(`Schema Path ${schemaPath}`);
    console.log(`Raw Code Path ${rawCodePath}`);

    fs.chmodSync(wasmPath, 0o666); // 0o666 is read and write for everyone
    fs.chmodSync(schemaPath, 0o666);
    fs.chmodSync(rawCodePath, 0o666);


    
    const response = await rubixUtil.generateSmartContract(did, wasmPath, schemaPath, rawCodePath, port);
    res.json({ response });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'An error occurred while generating the smart contract' });
  }
});

app.post('/api/deploy-smart-contract', async (req, res) => {
  try {
    const {
      comment,
      deployerAddress,
      quorumType,
      rbtAmount,
      smartContractToken,
      port: deployPort,
    } = req.body;
    const response = await rubixUtil.deploySmartContract(
      comment,
      deployerAddress,
      quorumType,
      rbtAmount,
      smartContractToken,
      deployPort
    );
    res.json({ response });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'An error occurred while deploying the smart contract' });
  }
});

app.post('/api/execute-smart-contract', async (req, res) => {
  try {
    const {
      comment,
      executorAddress,
      quorumType,
      smartContractData,
      smartContractToken,
      port: executionPort,
    } = req.body;
    const response = await rubixUtil.executeSmartContract(
      comment,
      executorAddress,
      quorumType,
      smartContractData,
      smartContractToken,
      executionPort
    );
    res.json({ response });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'An error occurred while executing the smart contract' });
  }
});

app.post('/api/subscribe-contract', async (req, res) => {
  try {
    const { contractToken, port: subscribePort } = req.body;
    const response = await rubixUtil.subscribeSmartContract(contractToken, subscribePort);
    rubixUtil.registerCallBackUrl(contractToken, 3000, "api/v1/contract-input", subscribePort);
    res.json({ response });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'An error occurred while subscribing to the smart contract' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// app.listen(port, '0.0.0.0', () => {
//   console.log(`Server is running on port ${port}`);
// });
