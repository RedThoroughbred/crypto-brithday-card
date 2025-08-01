const { ethers } = require('ethers');

async function testDirectGift() {
  // Setup
  const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
  const privateKey = '0x03ca6aa845428cc80f8f617db689aa179652bfa0c29d8982994f93b7efbe9ffc'; // Wallet 1
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('🧪 Testing DirectGift Creation and Claiming...');
  console.log('Wallet 1 address:', wallet.address);
  
  // Contract setup
  const contractAddress = '0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858';
  const ggtTokenAddress = '0x1775997EE682CCab7c6443168d63D2605922C633';
  
  // SimpleRelayEscrow ABI
  const escrowAbi = [
    'function createDirectGift(address,uint256,uint256,uint256,string,string,bytes32,string) payable',
    'function getDirectGift(bytes32) view returns (address,address,uint256,uint256,uint256,bool,bool,string,string,string)',
    'event DirectGiftCreated(bytes32 indexed giftId, address sender, address recipient, uint256 ggtAmount, uint256 gasAllowance, uint256 expiry, string unlockType)'
  ];
  
  // GGT Token ABI  
  const tokenAbi = [
    'function approve(address,uint256) returns (bool)',
    'function balanceOf(address) view returns (uint256)'
  ];
  
  const escrowContract = new ethers.Contract(contractAddress, escrowAbi, wallet);
  const ggtToken = new ethers.Contract(ggtTokenAddress, tokenAbi, wallet);
  
  try {
    // Check GGT balance
    const balance = await ggtToken.balanceOf(wallet.address);
    console.log('GGT Balance:', ethers.formatEther(balance));
    
    // Gift parameters
    const recipient = '0x34658EE37146f125C39D12b6f586efD363AA1002'; // Wallet 3
    const ggtAmount = ethers.parseEther('2'); // 2 GGT
    const gasAllowance = ethers.parseEther('0.01'); // 0.01 ETH for gas
    const expiryDays = 30;
    const message = 'Test direct gift';
    const unlockType = 'password';
    const password = 'test123';
    const unlockHash = ethers.keccak256(ethers.toUtf8Bytes(password));
    const unlockData = password;
    
    console.log('\\n📝 Gift Parameters:');
    console.log('Recipient:', recipient);
    console.log('Amount:', ethers.formatEther(ggtAmount), 'GGT');
    console.log('Gas Allowance:', ethers.formatEther(gasAllowance), 'ETH');
    console.log('Password:', password);
    console.log('Unlock Hash:', unlockHash);
    
    // Step 1: Approve tokens
    console.log('\\n🔐 Step 1: Approving GGT tokens...');
    const approveTx = await ggtToken.approve(contractAddress, ggtAmount);
    await approveTx.wait();
    console.log('✅ Tokens approved');
    
    // Step 2: Create direct gift
    console.log('\\n🎁 Step 2: Creating direct gift...');
    const createTx = await escrowContract.createDirectGift(
      recipient,
      ggtAmount,
      gasAllowance,
      expiryDays,
      message,
      unlockType,
      unlockHash,
      unlockData,
      { value: gasAllowance }
    );
    
    console.log('Transaction hash:', createTx.hash);
    const receipt = await createTx.wait();
    console.log('✅ Gift created in block:', receipt.blockNumber);
    
    // Get gift ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = escrowContract.interface.parseLog(log);
        return parsed && parsed.name === 'DirectGiftCreated';
      } catch (e) {
        return false;
      }
    });
    
    if (event) {
      const parsed = escrowContract.interface.parseLog(event);
      const giftId = parsed.args[0];
      console.log('\\n🎉 Direct Gift Created!');
      console.log('Gift ID:', giftId);
      console.log('\\n🔗 Claim URL:');
      console.log(`http://192.168.86.245:3000/gift/${giftId}`);
      
      // Verify gift data
      console.log('\\n🔍 Verifying gift data...');
      const gift = await escrowContract.getDirectGift(giftId);
      console.log('Stored unlock type:', gift[8]);
      console.log('Stored unlock data:', gift[9]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
  }
}

testDirectGift().catch(console.error);