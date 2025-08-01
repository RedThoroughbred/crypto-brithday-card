const { ethers } = require('ethers');

// Test the signature process that happens in gasless direct gift claiming
async function testSignatureProcess() {
  console.log('🧪 Testing Direct Gift Signature Process...\n');

  // Test data (from the recent attempt)
  const giftId = '0xb39ab605712ffacc7957eb95a0c60df1e9024d5d6031dd713aaf4d0634e97266';
  const recipient = '0x34658EE37146f125C39D12b6f586efD363AA1002';
  const unlockAnswer = 'Nicholaus86';
  const nonce = 0;

  // Step 1: Create the message hash like the contract does
  console.log('📝 Step 1: Creating message hash...');
  const messageHash = ethers.keccak256(
    ethers.solidityPacked(
      ['bytes32', 'address', 'string', 'uint256'],
      [giftId, recipient, unlockAnswer, nonce]
    )
  );
  console.log('Raw message hash:', messageHash);

  // Step 2: Create the Ethereum signed message hash (what the contract verifies against)
  const ethSignedMessageHash = ethers.hashMessage(ethers.getBytes(messageHash));
  console.log('Ethereum signed message hash:', ethSignedMessageHash);

  // Test what the relay service creates
  console.log('\n🔧 Testing Relay Service Process...');
  
  // Simulate what relay service does (calling the contract's createDirectClaimSignature)
  const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
  const contractAddress = '0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858';
  
  const abi = [
    'function createDirectClaimSignature(bytes32,address,string,uint256) view returns (bytes32)'
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  try {
    const contractHash = await contract.createDirectClaimSignature(giftId, recipient, unlockAnswer, nonce);
    console.log('Contract createDirectClaimSignature result:', contractHash);
    console.log('Matches our calculation?', contractHash === messageHash);
    
    // What happens when frontend signs this
    console.log('\n✍️ Frontend Signing Process...');
    console.log('If frontend uses signMessage on:', contractHash);
    console.log('It will create signature for:', ethers.hashMessage(ethers.getBytes(contractHash)));
    
    // What the contract verification expects
    console.log('\n🔍 Contract Verification Process...');
    console.log('1. Contract calls createDirectClaimSignature() =>', contractHash);
    console.log('2. Contract calls toEthSignedMessageHash() =>', ethers.hashMessage(ethers.getBytes(contractHash)));
    console.log('3. Contract expects signature to match step 2');
    
  } catch (error) {
    console.error('❌ Error calling contract:', error.message);
  }
}

// Run the test
testSignatureProcess().catch(console.error);