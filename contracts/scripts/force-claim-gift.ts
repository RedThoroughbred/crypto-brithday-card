import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Force Claiming Gift (Bypassing Frontend Issues)");
  console.log("==================================================");

  // Contract addresses
  const ETH_ESCROW_ADDRESS = "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";
  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";

  // Test both Gift ID 3 and 5 (both ETH gifts in Kentucky)
  const testGifts = [
    { id: 3, contract: ETH_ESCROW_ADDRESS, type: "ETH" },
    { id: 5, contract: ETH_ESCROW_ADDRESS, type: "ETH" },
    { id: 1, contract: GGT_ESCROW_ADDRESS, type: "GGT" },
  ];

  const [signer] = await ethers.getSigners();
  console.log("Attempting to claim with wallet:", signer.address);
  console.log("");

  for (const testGift of testGifts) {
    console.log(`🎁 Testing Gift ID ${testGift.id} (${testGift.type})`);
    console.log("==================================================");

    try {
      let escrow, gift;
      
      if (testGift.type === "ETH") {
        escrow = await ethers.getContractAt("LocationEscrow", testGift.contract);
        gift = await escrow.gifts(testGift.id);
      } else {
        escrow = await ethers.getContractAt("GGTLocationEscrow", testGift.contract);
        gift = await escrow.getGift(testGift.id);
      }

      // Extract gift details based on type
      let targetLat, targetLon, recipient, amount, claimed, exists, radius;
      
      if (testGift.type === "ETH") {
        recipient = gift[1];
        amount = ethers.formatEther(gift[2]);
        targetLat = Number(gift[3]);
        targetLon = Number(gift[4]);
        radius = Number(gift[5]);
        claimed = gift[9];
        exists = gift[10];
      } else {
        recipient = gift.recipient;
        amount = ethers.formatUnits(gift.amount, 18);
        targetLat = Number(gift.latitude);
        targetLon = Number(gift.longitude);
        radius = Number(gift.radius);
        claimed = gift.claimed;
        exists = gift.exists;
      }

      console.log(`Recipient: ${recipient}`);
      console.log(`Amount: ${amount} ${testGift.type}`);
      console.log(`Target coordinates: ${targetLat / 1_000_000}, ${targetLon / 1_000_000}`);
      console.log(`Radius: ${radius}m`);
      console.log(`Claimed: ${claimed}`);
      console.log(`Exists: ${exists}`);

      // Check if we can claim this gift
      if (!exists) {
        console.log("❌ Gift doesn't exist");
        console.log("");
        continue;
      }

      if (claimed) {
        console.log("❌ Gift already claimed");
        console.log("");
        continue;
      }

      if (signer.address.toLowerCase() !== recipient.toLowerCase()) {
        console.log("❌ Wrong recipient - this gift is not for this wallet");
        console.log("");
        continue;
      }

      // Try to claim using the exact target coordinates
      console.log("🎯 Attempting to claim using exact target coordinates...");
      
      try {
        const claimTx = await escrow.claimGift(
          testGift.id,
          BigInt(targetLat), // Use exact target coordinates
          BigInt(targetLon), // Use exact target coordinates
          "0x" // Empty location proof
        );
        
        console.log("Claim transaction sent:", claimTx.hash);
        const receipt = await claimTx.wait();
        console.log("✅ GIFT CLAIMED SUCCESSFULLY!");
        console.log(`🎉 You received ${amount} ${testGift.type}!`);
        console.log("");
        
      } catch (claimError: any) {
        console.log("❌ Claim failed:", claimError.reason || claimError.message);
        
        // If location is too far, try some nearby coordinates
        if (claimError.reason?.includes("LocationTooFarAway") || claimError.message?.includes("LocationTooFarAway")) {
          console.log("🔍 Trying nearby coordinates...");
          
          // Try coordinates within the radius
          const variations = [
            { lat: targetLat, lon: targetLon }, // Exact
            { lat: targetLat + 1, lon: targetLon }, // Slightly off
            { lat: targetLat - 1, lon: targetLon },
            { lat: targetLat, lon: targetLon + 1 },
            { lat: targetLat, lon: targetLon - 1 },
          ];
          
          for (const variation of variations) {
            try {
              console.log(`  Trying: ${variation.lat / 1_000_000}, ${variation.lon / 1_000_000}`);
              const claimTx2 = await escrow.claimGift(
                testGift.id,
                BigInt(variation.lat),
                BigInt(variation.lon),
                "0x"
              );
              
              console.log("  Claim transaction sent:", claimTx2.hash);
              await claimTx2.wait();
              console.log("✅ GIFT CLAIMED SUCCESSFULLY with variation!");
              console.log(`🎉 You received ${amount} ${testGift.type}!`);
              break;
              
            } catch (variationError) {
              console.log(`  ❌ Failed: ${variationError.reason || variationError.message}`);
            }
          }
        }
        console.log("");
      }

    } catch (error: any) {
      console.log(`❌ Error checking gift ${testGift.id}: ${error.message}`);
      console.log("");
    }
  }

  console.log("==================================================");
  console.log("🔧 Force Claim Attempt Complete");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});