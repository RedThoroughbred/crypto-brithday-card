const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('🔧 Setting up relay authorization...');
  console.log('Deployer address:', deployer.address);
  
  const contractAddress = '0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858';
  const relayWallet = '0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F';  // Wallet 2
  
  const SimpleRelayEscrow = await ethers.getContractFactory('SimpleRelayEscrow');
  const contract = SimpleRelayEscrow.attach(contractAddress);
  
  console.log('🔐 Authorizing relay wallet:', relayWallet);
  const tx = await contract.setRelayAuthorization(relayWallet, true);
  console.log('📡 Transaction submitted:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('✅ Relay authorized! Block:', receipt.blockNumber);
  
  // Verify authorization
  const isAuthorized = await contract.authorizedRelays(relayWallet);
  console.log('🔍 Verification - Wallet 2 authorized:', isAuthorized);
}

main().catch(console.error);