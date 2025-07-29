import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🎯 Claiming GGT Gift with Second Wallet");
  console.log("======================================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  
  // Get second private key from environment
  const SECOND_PRIVATE_KEY = process.env.PRIVATE_KEY_2;
  
  if (!SECOND_PRIVATE_KEY) {
    console.log("❌ PRIVATE_KEY_2 not found in .env file!");
    console.log("Please add: PRIVATE_KEY_2=your-second-wallet-private-key");
    return;
  }

  // Create wallet from private key
  const provider = ethers.provider;
  const secondWallet = new ethers.Wallet(SECOND_PRIVATE_KEY, provider);
  
  console.log("Using second wallet:", secondWallet.address);
  console.log("");

  // Check if this is the right wallet
  if (secondWallet.address.toLowerCase() !== "0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F".toLowerCase()) {
    console.log("⚠️  Warning: Your second wallet address doesn't match expected!");
    console.log("Expected: 0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F");
    console.log("Got:", secondWallet.address);
    console.log("");
  }

  // Get contract with second wallet
  const escrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS, secondWallet);

  // Let's try Gift ID 5 - it's closest to your location with 50m radius
  const GIFT_ID = 5;
  const CLAIM_LAT = 38.879666;
  const CLAIM_LON = -84.616383;

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

  if (secondWallet.address.toLowerCase() !== gift.recipient.toLowerCase()) {
    console.log("❌ Wrong wallet! This gift is for:", gift.recipient);
    console.log("You are using:", secondWallet.address);
    return;
  }

  // Try to claim with exact coordinates
  console.log("🎁 Attempting to claim gift...");
  console.log("Using exact gift coordinates:", CLAIM_LAT, ",", CLAIM_LON);
  
  try {
    const claimTx = await escrow.claimGift(
      GIFT_ID,
      Math.floor(CLAIM_LAT * 1_000_000), // Use exact coordinates
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
      console.log("🐛 GPS VERIFICATION ISSUE CONFIRMED!");
      console.log("Even with exact coordinates, the claim fails.");
      console.log("This suggests an issue with the smart contract distance calculation.");
      
      // Calculate distance to debug
      const distance = await escrow.calculateDistance(
        gift.latitude,
        gift.longitude,
        Math.floor(CLAIM_LAT * 1_000_000),
        Math.floor(CLAIM_LON * 1_000_000)
      );
      console.log("");
      console.log("Contract calculated distance:", distance.toString(), "meters");
      console.log("Required radius:", gift.radius.toString(), "meters");
    }
  }

  console.log("======================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});