import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Debugging GGT Chain Data");
  console.log("============================");

  const GGT_CHAIN_ESCROW_ADDRESS = "0x3c7B305fa9b36b9848E4C705c1e4Ec27c9568e1e";
  const CHAIN_ID = 1;
  
  const [signer] = await ethers.getSigners();
  console.log("Debugging from wallet:", signer.address);
  console.log("");

  // Get contract
  const chainEscrow = await ethers.getContractAt("GGTLocationChainEscrow", GGT_CHAIN_ESCROW_ADDRESS);

  // Get chain data using getChain function
  console.log("📊 Chain Data (using getChain):");
  try {
    const chainData = await chainEscrow.getChain(CHAIN_ID);
    console.log("Raw chain data:", chainData);
    console.log("");
    
    console.log("Parsed fields:");
    console.log("- chainId:", chainData[0].toString());
    console.log("- giver:", chainData[1]);
    console.log("- recipient:", chainData[2]);
    console.log("- totalValue:", ethers.formatUnits(chainData[3], 18), "GGT");
    console.log("- currentStep:", chainData[4].toString());
    console.log("- totalSteps:", chainData[5].toString());
    console.log("- createdAt:", new Date(Number(chainData[6]) * 1000).toISOString());
    console.log("- chainExpiryTime:", new Date(Number(chainData[7]) * 1000).toISOString());
    console.log("- chainCompleted:", chainData[8]);
    console.log("- chainExpired:", chainData[9]);
    console.log("- chainTitle:", chainData[10]);
    console.log("- chainMetadata:", chainData[11]);
  } catch (error) {
    console.error("Error getting chain data:", error);
  }

  console.log("");
  
  // Get chain steps data
  console.log("📊 Chain Steps Data:");
  try {
    const stepsData = await chainEscrow.getChainSteps(CHAIN_ID);
    console.log("Raw steps data:", stepsData);
    console.log("");
    
    console.log("Steps breakdown:");
    for (let i = 0; i < stepsData.length; i++) {
      const step = stepsData[i];
      console.log(`Step ${i + 1}:`);
      console.log("  - chainId:", step[0].toString());
      console.log("  - stepIndex:", step[1].toString());
      console.log("  - stepValue:", ethers.formatUnits(step[2], 18), "GGT");
      console.log("  - latitude:", (Number(step[3]) / 1_000_000).toFixed(6));
      console.log("  - longitude:", (Number(step[4]) / 1_000_000).toFixed(6));
      console.log("  - radius:", step[5].toString(), "meters");
      console.log("  - unlockType:", step[6].toString());
      console.log("  - unlockData:", step[7]);
      console.log("  - stepMessage:", step[8]);
      console.log("  - stepMetadata:", step[9]);
      console.log("  - unlockTime:", new Date(Number(step[10]) * 1000).toISOString());
      console.log("  - isUnlocked:", step[11]);
      console.log("  - isCompleted:", step[12]);
      console.log("  - stepTitle:", step[13]);
      console.log("  - claimAttempts:", step[14].toString());
      console.log("");
    }
  } catch (error) {
    console.error("Error getting steps data:", error);
  }

  console.log("============================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});