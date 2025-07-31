const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying simplified GeoGift contract...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
  
  try {
    // Deploy NewUserGiftEscrowSimple
    console.log("\n📦 Deploying NewUserGiftEscrowSimple...");
    const NewUserGiftEscrowSimple = await ethers.getContractFactory("NewUserGiftEscrowSimple");
    const escrowContract = await NewUserGiftEscrowSimple.deploy();
    await escrowContract.waitForDeployment();
    
    const escrowAddress = await escrowContract.getAddress();
    console.log("✅ NewUserGiftEscrowSimple deployed to:", escrowAddress);
    
    // Wait for confirmations
    console.log("\n⏳ Waiting for confirmations...");
    await escrowContract.deploymentTransaction().wait(5);
    
    // Display deployment summary
    console.log("\n🎉 Deployment Complete!");
    console.log("================================");
    console.log("NewUserGiftEscrowSimple:", escrowAddress);
    console.log("Network:", network.name);
    console.log("================================");
    
    // Verification instructions
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\n📝 Verification command:");
      console.log(`npx hardhat verify --network ${network.name} ${escrowAddress}`);
    }
    
    // Frontend configuration
    console.log("\n🔧 Frontend Configuration:");
    console.log("Add to frontend/lib/gsn-config.ts:");
    console.log(`export const GSN_CONFIG = {`);
    console.log(`  escrowAddress: "${escrowAddress}",`);
    console.log(`  network: "${network.name}"`);
    console.log(`};`);
    
    // Usage instructions
    console.log("\n📋 Next Steps:");
    console.log("1. Update frontend configuration with deployed address");
    console.log("2. Test gift creation and claiming");
    console.log("3. Note: This contract doesn't require GSN - uses normal gas from users");
    
    return {
      escrowAddress,
      network: network.name
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Export function for use in other scripts
module.exports = {
  main
};

// Run deployment if this script is executed directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n✨ Deployment successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}