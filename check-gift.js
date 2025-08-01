
const { ethers } = require('ethers');

async function checkGiftStatus() {
  const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
  const contractAddress = '0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858';
  const giftId = '0xb39ab605712ffacc7957eb95a0c60df1e9024d5d6031dd713aaf4d0634e97266';

  const abi = [
    'function getDirectGiftNonce(bytes32) view returns (uint256)',
    'function getDirectGift(bytes32) view returns (address,address,uint256,uint256,uint256,bool,bool,string,string,string)'
  ];

  const contract = new ethers.Contract(contractAddress, abi, provider);

  console.log('🔍 Checking gift status and nonce...');
  
  const currentNonce = await contract.getDirectGiftNonce(giftId);
  console.log('Current gift nonce:', currentNonce.toString());
  
  const gift = await contract.getDirectGift(giftId);
  console.log('Gift claimed:', gift[5]);
  console.log('Gift refunded:', gift[6]);
  
  if (gift[5]) {
    console.log('❌ ISSUE: Gift is already claimed');
  } else if (currentNonce.toString() \!== '0') {
    console.log('❌ ISSUE: Nonce mismatch\! Expected:', currentNonce.toString(), 'Got: 0');
  } else {
    console.log('✅ Gift is available and nonce is correct');
  }
}

checkGiftStatus().catch(console.error);

