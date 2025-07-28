import { ethers } from "hardhat";

async function main() {
  console.log("🔗 Getting chain information...");
  
  // Get the deployed contract
  const chainContractAddress = "0x4258C7c0c3CC0b66457d14714cec2785cbdaEa57";
  const LocationChainEscrow = await ethers.getContractFactory("LocationChainEscrow");
  const chainContract = LocationChainEscrow.attach(chainContractAddress);
  
  // Get the next chain ID to see what the latest one is
  const nextChainId = await chainContract.nextChainId();
  console.log("Next chain ID:", nextChainId.toString());
  
  // The latest chain should be nextChainId - 1
  const latestChainId = nextChainId - 1n;
  
  if (latestChainId > 0) {
    console.log("\n📦 Latest Chain ID:", latestChainId.toString());
    
    try {
      const chainData = await chainContract.chains(latestChainId);
      console.log("\nChain Details:");
      console.log("- Chain ID:", chainData.chainId.toString());
      console.log("- Giver:", chainData.giver);
      console.log("- Recipient:", chainData.recipient);
      console.log("- Total Value:", ethers.formatEther(chainData.totalValue), "ETH");
      console.log("- Current Step:", chainData.currentStep.toString());
      console.log("- Total Steps:", chainData.totalSteps.toString());
      console.log("- Chain Title:", chainData.chainTitle);
      console.log("- Completed:", chainData.chainCompleted);
      console.log("- Expired:", chainData.chainExpired);
      
      console.log("\n🔗 Chain Claim URL: http://localhost:3000/claim-chain?id=" + latestChainId.toString());
    } catch (error) {
      console.error("Error reading chain data:", error);
    }
  } else {
    console.log("No chains found yet");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });