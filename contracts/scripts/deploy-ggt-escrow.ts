import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Deploying GGT Location Escrow Contract...\n");
  
  // Your GGT token address
  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  
  console.log("📋 Deployment Configuration:");
  console.log("=" .repeat(50));
  console.log(`GGT Token Address: ${GGT_TOKEN_ADDRESS}`);
  console.log(`Network: Sepolia Testnet`);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`Deployer ETH Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  Low ETH balance for deployment. You may need more ETH for gas.");
  }
  
  console.log("\n🚀 Deploying GGTLocationEscrow...");
  
  // Deploy the contract
  const GGTLocationEscrow = await ethers.getContractFactory("GGTLocationEscrow");
  const ggtEscrow = await GGTLocationEscrow.deploy(GGT_TOKEN_ADDRESS);
  
  await ggtEscrow.waitForDeployment();
  const contractAddress = await ggtEscrow.getAddress();
  
  console.log("✅ GGTLocationEscrow deployed!");
  console.log("=" .repeat(50));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Transaction Hash: ${ggtEscrow.deploymentTransaction()?.hash}`);
  console.log(`Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
  
  // Verify the deployment
  console.log("\n🔍 Verifying Contract Configuration...");
  try {
    const tokenAddress = await ggtEscrow.ggtToken();
    const stats = await ggtEscrow.getStats();
    
    console.log(`✅ GGT Token Address: ${tokenAddress}`);
    console.log(`✅ Initial Stats: ${stats[0]} gifts created, ${stats[2]} value locked`);
    console.log(`✅ Next Gift ID: ${stats[3]}`);
    
  } catch (error) {
    console.log("⚠️  Error verifying contract:", error);
  }
  
  console.log("\n📝 Frontend Integration:");
  console.log("=" .repeat(50));
  console.log("Add this to your frontend configuration:");
  console.log(`export const GGT_ESCROW_ADDRESS = "${contractAddress}";`);
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Update frontend to use GGT escrow contract");
  console.log("2. Test gift creation with GGT tokens");
  console.log("3. Verify location-based claiming works");
  console.log("4. Test emergency withdrawal after expiry");
  
  console.log("\n✨ GGT Location Escrow is ready for use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });