import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x923F721fD04611eA9075e3ebc240CeAd10Bd2859";
  
  const contract = await ethers.getContractAt("LocationEscrow", contractAddress);
  
  // Get the next gift ID (which is the total count)
  const nextGiftId = await contract.nextGiftId();
  const latestGiftId = nextGiftId - 1n;
  
  if (latestGiftId >= 0) {
    console.log(`Latest gift ID: ${latestGiftId}`);
    
    // Get details of the latest gift
    const gift = await contract.gifts(latestGiftId);
    console.log("\nGift details:");
    console.log(`- Giver: ${gift.giver}`);
    console.log(`- Receiver: ${gift.receiver}`);
    console.log(`- Amount: ${ethers.formatEther(gift.amount)} ETH`);
    console.log(`- Claimed: ${gift.claimed}`);
    console.log(`- Message: ${gift.message}`);
    
    console.log(`\nClaim URL: http://localhost:3000/claim?id=${latestGiftId}`);
  } else {
    console.log("No gifts created yet");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});