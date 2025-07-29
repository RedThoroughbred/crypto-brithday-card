import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Claiming GGT Gift (Manual Script)");
  console.log("===================================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  
  // Gift to claim - let's try GGT Gift ID 2 (100 GGT in Kentucky)
  const GIFT_ID = 2;
  
  // Kentucky coordinates from the gift
  const CLAIM_LAT = 38.879573;
  const CLAIM_LON = -84.616405;
  
  const [signer] = await ethers.getSigners();
  console.log("Claiming with wallet:", signer.address);
  console.log("");

  // Get contract
  const escrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Check gift details
  console.log("📋 Checking Gift ID", GIFT_ID, "...");
  const gift = await escrow.getGift(GIFT_ID);
  
  console.log("Recipient:", gift.recipient);
  console.log("Amount:", ethers.formatUnits(gift.amount, 18), "GGT");
  console.log("Target Location:", Number(gift.latitude) / 1_000_000, ",", Number(gift.longitude) / 1_000_000);
  console.log("Radius:", gift.radius.toString(), "meters");
  console.log("Claimed:", gift.claimed);
  console.log("");

  if (gift.claimed) {
    console.log("❌ Gift already claimed!");
    return;
  }

  if (signer.address.toLowerCase() !== gift.recipient.toLowerCase()) {
    console.log("❌ Wrong wallet! This gift is for:", gift.recipient);
    console.log("You are using:", signer.address);
    console.log("");
    console.log("⚠️  To claim this gift:");
    console.log("1. Make sure you have the private key for", gift.recipient);
    console.log("2. Import it into MetaMask");
    console.log("3. Switch to that account and try again");
    return;
  }

  // Try to claim
  console.log("🎁 Attempting to claim gift...");
  console.log("Using coordinates:", CLAIM_LAT, ",", CLAIM_LON);
  
  try {
    const claimTx = await escrow.claimGift(
      GIFT_ID,
      Math.floor(CLAIM_LAT * 1_000_000),
      Math.floor(CLAIM_LON * 1_000_000),
      "0x" // empty location proof
    );
    
    console.log("Claim transaction sent:", claimTx.hash);
    const receipt = await claimTx.wait();
    console.log("✅ GIFT CLAIMED SUCCESSFULLY!");
    console.log("🎉 You received", ethers.formatUnits(gift.amount, 18), "GGT!");
    
  } catch (error: any) {
    console.log("❌ Claim failed:", error.reason || error.message);
    
    if (error.message?.includes("LocationTooFarAway")) {
      console.log("");
      console.log("📍 The coordinates you're using are too far from the gift location.");
      console.log("Gift location:", Number(gift.latitude) / 1_000_000, ",", Number(gift.longitude) / 1_000_000);
      console.log("Your location:", CLAIM_LAT, ",", CLAIM_LON);
      console.log("Max radius:", gift.radius.toString(), "meters");
    }
  }

  console.log("===================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});