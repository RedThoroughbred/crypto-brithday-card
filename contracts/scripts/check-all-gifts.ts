import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking ALL Gifts in Both Contracts");
  console.log("==================================================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  const ETH_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";

  console.log("Checking GGT Escrow:", GGT_ESCROW_ADDRESS);
  console.log("Checking ETH Escrow:", ETH_ESCROW_ADDRESS);
  console.log("");

  // Check GGT gifts
  console.log("🎁 GGT GIFTS:");
  console.log("==================================================");
  
  const ggtEscrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);
  const ggtStats = await ggtEscrow.getStats();
  const ggtNextId = Number(ggtStats[3]);
  
  console.log("GGT Gifts found:", ggtNextId - 1);
  
  for (let giftId = 1; giftId < ggtNextId; giftId++) {
    try {
      const gift = await ggtEscrow.getGift(giftId);
      const latitude = Number(gift.latitude) / 1_000_000;
      const longitude = Number(gift.longitude) / 1_000_000;
      
      console.log(`\n🎁 GGT Gift ID: ${giftId}`);
      console.log(`Amount: ${ethers.formatUnits(gift.amount, 18)} GGT`);
      console.log(`Recipient: ${gift.recipient}`);
      console.log(`Coordinates: ${latitude}, ${longitude}`);
      console.log(`Radius: ${gift.radius}m`);
      console.log(`Claimed: ${gift.claimed ? '✅' : '❌'}`);
      console.log(`Claimable: ${gift.exists && !gift.claimed ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`❌ GGT Gift ID ${giftId}: Error - ${error.message}`);
    }
  }

  // Check ETH gifts (regular LocationEscrow)
  console.log("\n\n💎 ETH GIFTS:");
  console.log("==================================================");
  
  try {
    const ethEscrow = await ethers.getContractAt("LocationEscrow", ETH_ESCROW_ADDRESS);
    
    // Try to get gift details for IDs 1-10
    for (let giftId = 1; giftId <= 10; giftId++) {
      try {
        const gift = await ethEscrow.gifts(giftId);
        
        // Check if gift exists (amount > 0 usually indicates existence)
        if (gift[2] > 0 || gift[10]) { // amount > 0 or exists field
          const latitude = Number(gift[3]) / 1_000_000; // latitude field
          const longitude = Number(gift[4]) / 1_000_000; // longitude field
          
          console.log(`\n💎 ETH Gift ID: ${giftId}`);
          console.log(`Amount: ${ethers.formatEther(gift[2])} ETH`);
          console.log(`Giver: ${gift[0]}`);
          console.log(`Recipient: ${gift[1]}`);
          console.log(`Coordinates: ${latitude}, ${longitude}`);
          console.log(`Radius: ${Number(gift[5])}m`);
          console.log(`Claimed: ${gift[9] ? '✅' : '❌'}`); // claimed field
          console.log(`Exists: ${gift[10] ? '✅' : '❌'}`); // exists field
        }
        
      } catch (error) {
        // Silently skip non-existent gifts
        if (!error.message.includes("GiftNotFound")) {
          console.log(`❌ ETH Gift ID ${giftId}: Error - ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log("❌ Could not check ETH gifts:", error.message);
  }

  console.log("\n\n🎯 SUMMARY:");
  console.log("==================================================");
  console.log("Check the coordinates above - some might be near Kentucky!");
  console.log("Use http://localhost:3000/claim?id=X where X is the gift ID");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});