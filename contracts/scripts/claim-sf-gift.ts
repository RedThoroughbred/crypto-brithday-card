import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Claiming San Francisco GGT Gift (ID: 1)");
  console.log("==================================================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  const GIFT_ID = 1;

  // San Francisco coordinates (same as when we created the gift)
  const SF_LAT = BigInt(Math.floor(37.7749 * 1_000_000)); // SF latitude scaled
  const SF_LON = BigInt(Math.floor(-122.4194 * 1_000_000)); // SF longitude scaled

  // Get signer (should be the recipient address we set earlier)
  const [signer] = await ethers.getSigners();
  console.log("Claiming with wallet:", signer.address);

  // Get contract instance
  const ggtEscrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Check gift details first
  console.log("\n🔍 Checking gift details...");
  try {
    const gift = await ggtEscrow.getGift(GIFT_ID);
    console.log("Gift exists:", gift.exists);
    console.log("Gift claimed:", gift.claimed);
    console.log("Gift giver:", gift.giver);
    console.log("Gift recipient:", gift.recipient);
    console.log("Gift amount:", ethers.formatUnits(gift.amount, 18), "GGT");
    console.log("Target location:", `${Number(gift.latitude) / 1_000_000}, ${Number(gift.longitude) / 1_000_000}`);
    console.log("Required radius:", gift.radius.toString(), "meters");
    
    if (gift.claimed) {
      console.log("❌ Gift has already been claimed!");
      return;
    }

    if (signer.address !== gift.recipient) {
      console.log("❌ This wallet is not the intended recipient!");
      console.log("Expected recipient:", gift.recipient);
      console.log("Current wallet:", signer.address);
      return;
    }

  } catch (error) {
    console.error("Error checking gift:", error);
    return;
  }

  // Try to claim the gift
  console.log("\n🎯 Attempting to claim gift...");
  console.log("Using coordinates: 37.7749, -122.4194 (San Francisco)");
  
  try {
    const claimTx = await ggtEscrow.claimGift(
      GIFT_ID,
      SF_LAT,
      SF_LON,
      "0x" // Empty location proof
    );
    console.log("Claim transaction sent:", claimTx.hash);
    const receipt = await claimTx.wait();
    console.log("✅ Gift claimed successfully!");
    
    // Check stats after claim
    const stats = await ggtEscrow.getStats();
    console.log("\n📊 Contract Stats After Claim:");
    console.log("Gifts Created:", stats[0].toString());
    console.log("Gifts Claimed:", stats[1].toString());
    console.log("Value Locked:", ethers.formatUnits(stats[2], 18), "GGT");
    
    console.log("\n🎉 100 GGT tokens have been transferred to your wallet!");
    
  } catch (error: any) {
    console.error("❌ Claim failed:", error.reason || error.message);
    
    if (error.reason?.includes("LocationTooFarAway")) {
      console.log("\n💡 This confirms GPS verification is working!");
      console.log("Try using the exact coordinates: 37.7749, -122.4194");
    }
  }

  console.log("\n==================================================");
  console.log("🔧 Claim Attempt Complete");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});