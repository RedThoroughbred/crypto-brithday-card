const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying NewUserGiftEscrowGGTWithETH contract...");
  
  // Get the contract factory
  const NewUserGiftEscrowGGTWithETH = await ethers.getContractFactory("NewUserGiftEscrowGGTWithETH");
  
  // Deploy the contract
  console.log("📦 Deploying contract...");
  const contract = await NewUserGiftEscrowGGTWithETH.deploy();
  
  // Wait for deployment to complete
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ NewUserGiftEscrowGGTWithETH deployed to:", contractAddress);
  console.log("📄 Transaction hash:", contract.deploymentTransaction().hash);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
  
  // Wait for a few confirmations
  console.log("⏳ Waiting for confirmations...");
  await contract.deploymentTransaction().wait(5);
  
  console.log("🔗 Contract deployed and confirmed!");
  console.log(`📋 Contract address: ${contractAddress}`);
  
  // Verify on Etherscan if on a live network
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("📝 Please verify the contract on Etherscan:");
    console.log(`npx hardhat verify --network ${network.name} ${contractAddress}`);
  }
  
  console.log("\n🔧 Next steps:");
  console.log("1. Update CONTRACT_ADDRESS in frontend/hooks/useNewUserGiftEscrow.ts");
  console.log(`2. Set CONTRACT_ADDRESS to: ${contractAddress}`);
  console.log("3. Test the new ETH-included gift creation flow");
  
  return contractAddress;
}

main()
  .then((address) => {
    console.log("\n✨ Deployment complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });