import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Getting Exact Coordinates for All GGT Gifts");
  console.log("==================================================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";

  // Get contract instance
  const ggtEscrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Get contract stats to see how many gifts exist
  const stats = await ggtEscrow.getStats();
  const totalGifts = Number(stats[0]);
  const nextGiftId = Number(stats[3]);
  
  console.log("Total Gifts Created:", totalGifts);
  console.log("Next Gift ID:", nextGiftId);
  console.log("Checking Gift IDs: 1 to", nextGiftId - 1);
  console.log("");

  // Check each gift ID
  for (let giftId = 1; giftId < nextGiftId; giftId++) {
    try {
      console.log(`🎁 Gift ID: ${giftId}`);
      console.log("==================================================");
      
      const gift = await ggtEscrow.getGift(giftId);
      
      // Convert contract coordinates back to decimal
      const latitude = Number(gift.latitude) / 1_000_000;
      const longitude = Number(gift.longitude) / 1_000_000;
      
      console.log("Giver:", gift.giver);
      console.log("Recipient:", gift.recipient);
      console.log("Amount:", ethers.formatUnits(gift.amount, 18), "GGT");
      console.log("Claimed:", gift.claimed);
      console.log("");
      
      console.log("📍 EXACT COORDINATES TO USE:");
      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
      console.log("Radius:", gift.radius.toString(), "meters");
      console.log("");
      
      console.log("🎯 COPY THESE EXACT VALUES:");
      console.log(`Latitude: ${latitude}`);
      console.log(`Longitude: ${longitude}`);
      console.log("");
      
      // Also show the raw contract values for debugging
      console.log("🔧 Contract Values (for debugging):");
      console.log("Raw Latitude:", gift.latitude.toString());
      console.log("Raw Longitude:", gift.longitude.toString());
      console.log("");
      
      console.log("⏰ Expiry:", new Date(Number(gift.expiryTime) * 1000).toLocaleString());
      console.log("✅ Claimable:", gift.exists && !gift.claimed && Date.now() < Number(gift.expiryTime) * 1000);
      
      console.log("==================================================");
      console.log("");
      
    } catch (error) {
      console.log(`❌ Gift ID ${giftId} does not exist or error:`, error.message);
      console.log("");
    }
  }

  console.log("🎯 TESTING INSTRUCTIONS:");
  console.log("1. Go to: http://localhost:3000/claim?id=1");
  console.log("2. Connect your wallet");
  console.log("3. Click 'Enter Coordinates Manually'");
  console.log("4. Use the EXACT coordinates shown above");
  console.log("5. Click 'Set Location'");
  console.log("6. Should show 'You're at the treasure location!'");
  console.log("7. Click 'Claim Gift'");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});