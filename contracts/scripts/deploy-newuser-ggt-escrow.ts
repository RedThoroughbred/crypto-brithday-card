import { ethers } from "hardhat";

async function main() {
  console.log("Deploying NewUserGiftEscrowGGT...");

  // Get the contract factory
  const NewUserGiftEscrowGGT = await ethers.getContractFactory("NewUserGiftEscrowGGT");

  // Deploy the contract
  const newUserGiftEscrow = await NewUserGiftEscrowGGT.deploy();
  await newUserGiftEscrow.waitForDeployment();

  const contractAddress = await newUserGiftEscrow.getAddress();
  console.log("NewUserGiftEscrowGGT deployed to:", contractAddress);
  
  // Verify the GGT token address is correct
  const ggtTokenAddress = await newUserGiftEscrow.GGT_TOKEN();
  console.log("GGT Token address:", ggtTokenAddress);
  console.log("Expected GGT address: 0x1775997EE682CCab7c6443168d63D2605922C633");
  
  if (ggtTokenAddress.toLowerCase() === "0x1775997EE682CCab7c6443168d63D2605922C633".toLowerCase()) {
    console.log("✅ GGT token address is correct!");
  } else {
    console.log("❌ GGT token address mismatch!");
  }

  console.log("\n📋 Contract deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Sepolia");
  console.log("Supports: GGT token gifts with claim codes");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });