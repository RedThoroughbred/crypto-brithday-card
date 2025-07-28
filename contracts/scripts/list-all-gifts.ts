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
    console.log(`- Giver: ${gift.giver}`);
    console.log(`- Receiver: ${gift.receiver}`);
    console.log(`- Amount: ${ethers.formatEther(gift.amount)} ETH`);
    console.log(`- Location: ${lat}, ${lon} (radius: ${gift.radius}m)`);
    console.log(`- Claimed: ${gift.claimed ? "✓ YES" : "✗ NO"}`);
    console.log(`- Message: ${gift.message || "(no message)"}`);
    
    if (!gift.claimed) {
      console.log(`\n🎁 CLAIM URL: http://localhost:3000/claim?id=${i}`);
    }
    
    console.log("-".repeat(80));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});