import { ethers } from "hardhat";

async function main() {
  console.log("📋 Listing all gifts on Sepolia...\n");
  
  const contractAddress = "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";
  
  const LocationEscrow = await ethers.getContractFactory("LocationEscrow");
  const escrow = LocationEscrow.attach(contractAddress);
  
  // Check recent gift IDs
  let foundGifts = false;
  for (let giftId = 1; giftId <= 10; giftId++) {
    try {
      const gift = await escrow.gifts(giftId);
      if (gift.exists) {
        foundGifts = true;
        console.log(`🎁 Gift #${giftId}:`);
        console.log(`   From: ${gift.giver}`);
        console.log(`   To: ${gift.recipient}`);
        console.log(`   Amount: ${ethers.formatEther(gift.amount)} ETH`);
        console.log(`   Claimed: ${gift.claimed}`);
        console.log(`   Location: (${Number(gift.latitude)/1e6}, ${Number(gift.longitude)/1e6})`);
        console.log(`   Radius: ${gift.radius}m`);
        console.log(`   Created: ${new Date(Number(gift.createdAt) * 1000).toLocaleString()}`);
        console.log(`   Expires: ${new Date(Number(gift.expiryTime) * 1000).toLocaleString()}`);
        console.log(`   🔗 Claim URL: http://localhost:3000/claim?id=${giftId}\n`);
      }
    } catch (error) {
      // Gift doesn't exist, continue
    }
  }
  
  if (!foundGifts) {
    console.log("❌ No gifts found");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });