const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');

async function checkTransaction() {
  const txHash = '0x64c952342d275941ecbbe2f0a5aac52e887233098317221cc6607adfc87a0b7a';
  
  try {
    console.log('Checking transaction:', txHash);
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    console.log('Transaction details:');
    console.log('- To address:', tx.to);
    console.log('- From address:', tx.from);
    console.log('- Status:', receipt.status === 1 ? 'Success' : 'Failed');
    console.log('- Gas used:', receipt.gasUsed.toString());
    
    console.log('\nContract interaction:');
    console.log('- Contract address:', tx.to);
    
    console.log('\nLogs/Events:');
    receipt.logs.forEach((log, index) => {
      console.log(`Log ${index}:`, {
        address: log.address,
        topics: log.topics,
        data: log.data
      });
    });
    
  } catch (error) {
    console.error('Error checking transaction:', error.message);
  }
}

checkTransaction();