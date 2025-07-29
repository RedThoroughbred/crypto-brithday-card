import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🎯 Claiming All Remaining GGT Gifts");
  console.log("===================================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  
  // Get second private key from environment
  const SECOND_PRIVATE_KEY = process.env.PRIVATE_KEY_2;
  
  if (!SECOND_PRIVATE_KEY) {
    console.log("❌ PRIVATE_KEY_2 not found in .env file!");
    return;
  }

  // Create wallet from private key
  const provider = ethers.provider;
  const secondWallet = new ethers.Wallet(SECOND_PRIVATE_KEY, provider);
  
  console.log("Using second wallet:", secondWallet.address);
  console.log("");

  // Get contract with second wallet
  const escrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS, secondWallet);

  // Gifts to claim with their exact coordinates
  const giftsToTry = [
    { id: 1, lat: 37.7749, lon: -122.4194, name: "San Francisco" },
    { id: 2, lat: 38.879573, lon: -84.616405, name: "Kentucky 1" },
    { id: 3, lat: 38.879712, lon: -84.616608, name: "Kentucky 2" },
    { id: 4, lat: 38.879788, lon: -84.61654, name: "Kentucky 3" },
  ];

  let totalClaimed = 0;
  let totalGGT = 0;

  for (const giftInfo of giftsToTry) {
    console.log(`\n📋 Checking Gift ID ${giftInfo.id} (${giftInfo.name})...`);
    
    try {
      const gift = await escrow.getGift(giftInfo.id);
      
      if (!gift.exists) {
        console.log("❌ Gift doesn't exist");
        continue;
      }
      
      if (gift.claimed) {
        console.log("❌ Gift already claimed");
        continue;
      }
      
      const amount = ethers.formatUnits(gift.amount, 18);
      console.log(`Amount: ${amount} GGT`);
      console.log(`Radius: ${gift.radius.toString()}m`);
      
      // Check recipient
      if (secondWallet.address.toLowerCase() !== gift.recipient.toLowerCase()) {
        console.log("❌ Wrong recipient");
        continue;
      }
      
      // Try to claim with exact coordinates
      console.log("🎁 Attempting to claim...");
      
      try {
        const claimTx = await escrow.claimGift(
          giftInfo.id,
          Math.floor(giftInfo.lat * 1_000_000),
          Math.floor(giftInfo.lon * 1_000_000),
          "0x"
        );
        
        console.log("Transaction sent:", claimTx.hash);
        const receipt = await claimTx.wait();
        console.log("✅ CLAIMED SUCCESSFULLY!");
        totalClaimed++;
        totalGGT += parseFloat(amount);
        
      } catch (claimError: any) {
        console.log("❌ Claim failed:", claimError.reason || claimError.message);
        
        if (claimError.message?.includes("LocationTooFarAway")) {
          // Calculate distance for debugging
          const distance = await escrow.calculateDistance(
            gift.latitude,
            gift.longitude,
            Math.floor(giftInfo.lat * 1_000_000),
            Math.floor(giftInfo.lon * 1_000_000)
          );
          console.log("Distance calculated by contract:", distance.toString(), "meters");
        }
      }
      
    } catch (error: any) {
      console.log("❌ Error:", error.message);
    }
  }

  console.log("\n===================================");
  console.log("🎊 SUMMARY:");
  console.log(`Total gifts claimed: ${totalClaimed}`);
  console.log(`Total GGT received: ${totalGGT} GGT`);
  console.log("===================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});