const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Simple Relay System...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
  
  try {
    // Deploy SimpleRelayEscrow
    console.log("\n📦 Deploying SimpleRelayEscrow...");
    const SimpleRelayEscrow = await ethers.getContractFactory("SimpleRelayEscrow");
    const escrowContract = await SimpleRelayEscrow.deploy();
    await escrowContract.waitForDeployment();
    
    const escrowAddress = await escrowContract.getAddress();
    console.log("✅ SimpleRelayEscrow deployed to:", escrowAddress);
    
    // Wait for confirmations
    console.log("\n⏳ Waiting for confirmations...");
    await escrowContract.deploymentTransaction().wait(5);
    
    console.log("\n🎉 Relay System Deployment Complete!");
    console.log("================================");
    console.log("SimpleRelayEscrow:", escrowAddress);
    console.log("Network:", network.name);
    console.log("================================");
    
    console.log("\n🔧 Setup Instructions:");
    console.log("1. Authorize your relay wallets:");
    console.log(`   contract.setRelayAuthorization("WALLET_2_ADDRESS", true)`);
    console.log(`   contract.setRelayAuthorization("WALLET_3_ADDRESS", true)`);
    console.log("\n2. Update frontend configuration");
    console.log("\n3. Test the relay system");
    
    // Frontend configuration
    console.log("\n🔧 Frontend Configuration:");
    console.log("Add to frontend/lib/gsn-config.ts:");
    console.log(`export const RELAY_CONFIG = {`);
    console.log(`  escrowAddress: "${escrowAddress}",`);
    console.log(`  network: "${network.name}"`);
    console.log(`};`);
    
    return {
      escrowAddress,
      network: network.name
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n✨ Deployment successful!");
      console.log("\n📋 Next Steps:");
      console.log("1. Get your wallet addresses:");
      console.log("   - Wallet 1 (Main): Already connected");
      console.log("   - Wallet 2 (Relay): Get address");  
      console.log("   - Wallet 3 (Test): Get address");
      console.log("\n2. Run setup script to authorize relays");
      console.log("\n3. Test gasless claiming!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { main };