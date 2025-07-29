import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";
  
  const contract = await ethers.getContractAt("LocationEscrow", contractAddress);
  
  const nextGiftId = await contract.nextGiftId();
  console.log(`Total gifts created: ${nextGiftId}`);
  console.log("=".repeat(80));
  
  for (let i = 0n; i < nextGiftId; i++) {
    const gift = await contract.gifts(i);
    const lat = Number(gift.targetLat) / 1_000_000;
    const lon = Number(gift.targetLon) / 1_000_000;
    
    console.log(`\nGift ID: ${i}`);
    console.log(`- Giver: ${gift[0]}`);  // gift.giver
    console.log(`- Receiver: ${gift[1]}`);  // gift.receiver
    console.log(`- Amount: ${ethers.formatEther(gift[2])} ETH`);  // gift.amount
    console.log(`- Location: ${lat}, ${lon} (radius: ${Number(gift[5])}m)`);  // gift.radius
    console.log(`- Claimed: ${gift[6] ? "✓ YES" : "✗ NO"}`);  // gift.claimed
    console.log(`- Message: ${gift[10] || "(no message)"}`);  // gift.message
    
    if (!gift[6]) {  // not claimed
      console.log(`\n🎁 CLAIM URL: http://localhost:3000/claim?id=${i}`);
    }
    
    console.log("-".repeat(80));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});