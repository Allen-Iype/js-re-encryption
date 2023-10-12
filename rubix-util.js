const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function createDID(port, didImagepath) {
    const url = `http://localhost:${port}/api/createdid`;

  // Define the request data as an object
  const requestData = {
    did_config: JSON.stringify({
      type: 0,
      dir: '',
      config: '',
      master_did: '',
      secret: 'My DID Secret',
      priv_pwd: 'mypassword',
      quorum_pwd: 'mypassword',
      img_file: didImagepath,
      did_img_file: '',
      pub_img_file: '',
      priv_img_file: '',
      pub_key_file: '',
      priv_key_file: '',
      quorum_pub_key_file: '',
      quorum_priv_key_file: '',
    }),
  };

  try {
    const response = await axios.post(url, requestData);
    console.log('DID generation response:', response.data);
  } catch (error) {
    console.error('Error generating DID:', error.message);
  }
}
const { exec } = require('child_process');

async function generateSmartContract(did, wasmPath, schemaPath, rawCodePath, port) {
  //find the size of a file
  const stats = fs.statSync(wasmPath);
  const fileSizeInBytes = stats.size;
  const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
  console.log('File Size in MB:', fileSizeInMegabytes);

  wasmPath = wasmPath.replace(/\\/g, '/');
  schemaPath = schemaPath.replace(/\\/g, '/');
  rawCodePath = rawCodePath.replace(/\\/g, '/');
  const curlCommand = `curl --location 'http://localhost:${port}/api/generate-smart-contract' ` +
    `--form 'did="${did}"' ` +
    `--form 'rawCodePath=@"${rawCodePath}"' ` +
    `--form 'port="${port}"' ` +
    `--form 'schemaPath=@"${schemaPath}"' ` +
    `--form 'wasmPath=@"${wasmPath}"'`;

  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Curl Output:', stdout);
  });
}
// async function generateSmartContract(did, wasmPath, schemaPath, rawCodePath, port) {

// const curlCommand = `curl -X POST -H "Content-Type: multipart/form-data" -F "did=${did}" -F "binaryCodePath=${wasmPath}" -F "rawCodePath=${rawCodePath}" -F "schemaFilePath=${schemaPath}" http://localhost:${port}/api/generate-smart-contract`;

// exec(curlCommand, (error, stdout, stderr) => {
//   if (error) {
//     console.error('Error:', error);
//     return;
//   }

//   console.log('Curl Output:', stdout);
// });

// }

// async function generateSmartContract(did, wasmPath, schemaPath, rawCodePath, port) {
//   const form = new FormData();

//   // Add the form fields
//   form.append('did', did);

//   // Add the binaryCodePath field
//   form.append('binaryCodePath', fs.createReadStream(wasmPath));

//   // Add the rawCodePath field
//   form.append('rawCodePath', fs.createReadStream(rawCodePath));

//   // Add the schemaFilePath field
//   form.append('schemaFilePath', fs.createReadStream(schemaPath));

//   // Create the HTTP request
//   const url = `http://localhost:${port}/api/generate-smart-contract`;
//   const headers = {
//     ...form.getHeaders(),
//   };

//   try {
//     const response = await axios.post(url, form, { headers });

//     // Process the data as needed
//     console.log('Response Body in execute Contract:', response.data);

//     // Process the response as needed
//     console.log('Response status code:', response.status);
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

async function getSmartContractData(port, token) {
    try {
      const url = `http://localhost:${port}/api/get-smart-contract-token-chain-data`;
  
      const requestData = {
        token: token,
        latest: false,
      };
  
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
  
      console.log('Response Status:', response.status);
      const responseData = response.data;
      console.log('Response Body in get smart contract data:', responseData);
  
      return responseData;
    } catch (error) {
      console.error('Error:', error.message);
      return null;
    }
  }

  async function deploySmartContract(comment, deployerAddress, quorumType, rbtAmount, smartContractToken, port) {
    try {
      const url = `http://localhost:${port}/api/deploy-smart-contract`;
  
      const requestData = {
        comment: comment,
        deployerAddr: deployerAddress,
        quorumType: quorumType,
        rbtAmount: rbtAmount,
        smartContractToken: smartContractToken,
      };
  
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
  
      console.log('Response Status:', response.status);
      const responseData = response.data;
      console.log('Response Body in deploy smart contract:', responseData);
  
      const id = responseData.result.id;
      return id;
    } catch (error) {
      console.error('Error:', error.message);
      return null;
    }
  }

  async function signatureResponse(requestId, port) {
    try {
      const url = `http://localhost:${port}/api/signature-response`;
  
      const requestData = {
        id: requestId,
        mode: 0,
        password: 'mypassword',
      };
  
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
  
      console.log('Response Status:', response.status);
      const responseData = response.data;
      console.log('Response Body in signature response:', responseData);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }


  async function executeSmartContract(comment, executorAddress, quorumType, smartContractData, smartContractToken, port) {
    try {
      const url = `http://localhost:${port}/api/execute-smart-contract`;
  
      const requestData = {
        comment: comment,
        executorAddr: executorAddress,
        quorumType: quorumType,
        smartContractData: smartContractData,
        smartContractToken: smartContractToken,
      };
  
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
  
      console.log('Response Status:', response.status);
      const responseData = response.data;
      console.log('Response Body in execute smart contract:', responseData);
  
      const result = responseData.result;
      const id = result.id;
      signatureResponse(id, port);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  async function subscribeSmartContract(contractToken, port) {
    try {
      const url = `http://localhost:${port}/api/subscribe-contract`;
  
      const requestData = {
        contract: contractToken,
      };
  
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
  
      console.log('Response Status:', response.status);
      const responseData = response.data;
      console.log('Response Body in subscribe smart contract:', responseData);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  async function fetchSmartContract(smartContractTokenHash, port) {
    try {
      const url = `http://localhost:${port}/api/fetch-smart-contract`;
  
      const requestData = {
        smart_contract_token: smartContractTokenHash,
      };
  
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
  
      console.log('Response Status:', response.status);
      const responseData = response.data;
      console.log('Response Body in fetch smart contract:', responseData);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  async function registerCallBackUrl(smartContractTokenHash, urlPort, endPoint, nodePort) {
    try {
      const callBackUrl = `http://localhost:${urlPort}/${endPoint}`;
      const url = `http://localhost:${nodePort}/api/register-callback-url`;
  
      const requestData = {
        CallBackURL: callBackUrl,
        SmartContractToken: smartContractTokenHash,
      };
  
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
  
      console.log('Response Status:', response.status);
      const responseData = response.data;
      console.log('Response Body in register callback url:', responseData);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  module.exports = {
    createDID,
    generateSmartContract,
    getSmartContractData,
    executeSmartContract,
    signatureResponse,
    subscribeSmartContract,
    fetchSmartContract,
    registerCallBackUrl,
    deploySmartContract,
  };