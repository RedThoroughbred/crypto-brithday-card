import { ethers } from "hardhat";
import { LocationChainEscrow } from "../typechain-types";

async function main() {
  // Connect to the deployed chain contract
  const chainAddress = "0x4258C7c0c3CC0b66457d14714cec2785cbdaEa57";
  const chainContract = await ethers.getContractAt("LocationChainEscrow", chainAddress) as LocationChainEscrow;
  
  console.log("🔍 Debugging Chain GPS Coordinates...\n");
  
  // Get the chain data for your test chain (ID 1)
  const chainId = 1;
  
  try {
    const chainData = await chainContract.chains(chainId);
    console.log(`📊 Chain ${chainId} Info:`);
    console.log(`- Title: ${chainData.chainTitle}`);
    console.log(`- Total Steps: ${chainData.totalSteps}`);
    console.log(`- Current Step: ${chainData.currentStep}`);
    console.log(`- Completed: ${chainData.chainCompleted}`);
    console.log(`- Recipient: ${chainData.recipient}\n`);
    
    // Check each step's coordinates
    for (let i = 0; i < chainData.totalSteps; i++) {
      console.log(`🎯 Step ${i}:`);
      
      // Get the step data
      const step = await chainContract.chainSteps(chainId, i);
      console.log(`- Title: ${step.stepTitle}`);
      console.log(`- Gift ID: ${step.giftId}`);
      console.log(`- Unlocked: ${step.isUnlocked}`);
      console.log(`- Completed: ${step.isCompleted}`);
      
      // Get the underlying gift coordinates
      const gift = await chainContract.gifts(step.giftId);
      const lat = Number(gift.targetLatitude) / 1_000_000; // Convert from contract format
      const lng = Number(gift.targetLongitude) / 1_000_000;
      const radius = Number(gift.verificationRadius);
      
      console.log(`- 📍 Coordinates: ${lat}, ${lng}`);
      console.log(`- 🎯 Radius: ${radius}m`);
      console.log(`- 💰 Amount: ${ethers.formatEther(gift.amount)} ETH`);
      console.log(`- ✅ Claimed: ${gift.claimed}\n`);
    }
    
  } catch (error) {
    console.error("❌ Error querying chain:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });