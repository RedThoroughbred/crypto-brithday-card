const { ethers } = require('ethers');

async function testDirectSignature() {
  console.log('🧪 Testing DirectGift Signature Creation and Verification...\n');

  const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
  const contractAddress = '0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858';
  
  // Use a test wallet to create the signature (simulating Wallet 3)
  const wallet3PrivateKey = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'; // This is Wallet 3
  const wallet3 = new ethers.Wallet(wallet3PrivateKey, provider);
  
  console.log('👤 Wallet 3 Address:', wallet3.address);
  
  // Test parameters (from recent attempt)
  const giftId = '0xb39ab605712ffacc7957eb95a0c60df1e9024d5d6031dd713aaf4d0634e97266';
  const recipient = '0x34658EE37146f125C39D12b6f586efD363AA1002';
  const unlockAnswer = 'Nicholaus86';
  const nonce = 0;
  
  console.log('📝 Parameters:');
  console.log('Gift ID:', giftId);
  console.log('Recipient:', recipient);
  console.log('Unlock Answer:', unlockAnswer);
  console.log('Nonce:', nonce);
  
  // Step 1: Create the message hash using the contract function
  const abi = [
    'function createDirectClaimSignature(bytes32,address,string,uint256) view returns (bytes32)'
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  try {
    const messageHash = await contract.createDirectClaimSignature(giftId, recipient, unlockAnswer, nonce);
    console.log('\n📋 Contract Message Hash:', messageHash);
    
    // Step 2: Create signature using Wallet 3 (same as wagmi would do)
    const signature = await wallet3.signMessage(ethers.getBytes(messageHash));
    console.log('✍️ Signature:', signature);
    console.log('Signature Length:', signature.length);
    
    // Step 3: Test what this signature recovers to
    const ethSignedMessageHash = ethers.hashMessage(ethers.getBytes(messageHash));
    const recoveredAddress = ethers.recoverAddress(ethSignedMessageHash, signature);
    console.log('\n🔍 Signature Verification:');
    console.log('Expected Address:', recipient);
    console.log('Recovered Address:', recoveredAddress);
    console.log('Addresses Match:', recoveredAddress.toLowerCase() === recipient.toLowerCase());
    
    if (recoveredAddress.toLowerCase() !== recipient.toLowerCase()) {
      console.log('❌ SIGNATURE VERIFICATION FAILED!');
      console.log('This explains why the transaction reverts.');
    } else {
      console.log('✅ Signature verification would succeed');
      console.log('The issue must be elsewhere in the contract logic');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectSignature().catch(console.error);