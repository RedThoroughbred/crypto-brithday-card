import { ethers } from "hardhat";

async function main() {
  console.log("🚨 Emergency Withdrawal of GGT Gift");
  console.log("==================================================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  const GIFT_ID = 1; // The SF gift we created

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Wallet:", signer.address);

  // Get contract instance
  const ggtEscrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Check gift details first
  console.log("\n🔍 Checking gift details...");
  try {
    const gift = await ggtEscrow.getGift(GIFT_ID);
    console.log("Gift exists:", gift.exists);
    console.log("Gift claimed:", gift.claimed);
    console.log("Gift giver:", gift.giver);
    console.log("Gift amount:", ethers.formatUnits(gift.amount, 18), "GGT");
    console.log("Expiry time:", new Date(Number(gift.expiryTime) * 1000).toLocaleString());
    
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = currentTime > Number(gift.expiryTime);
    console.log("Is expired:", isExpired);
    
    if (!isExpired) {
      console.log("⚠️  Gift hasn't expired yet. Cannot emergency withdraw.");
      console.log("Current time:", new Date(currentTime * 1000).toLocaleString());
      console.log("Will try anyway in case contract allows it...");
    }
  } catch (error) {
    console.error("Error checking gift:", error);
    return;
  }

  // Try emergency withdrawal
  console.log("\n💰 Attempting emergency withdrawal...");
  try {
    const withdrawTx = await ggtEscrow.emergencyWithdraw(GIFT_ID);
    console.log("Withdrawal transaction sent:", withdrawTx.hash);
    await withdrawTx.wait();
    console.log("✅ Emergency withdrawal successful!");
    
    // Check stats after withdrawal
    const stats = await ggtEscrow.getStats();
    console.log("\n📊 Contract Stats After Withdrawal:");
    console.log("Gifts Created:", stats[0].toString());
    console.log("Gifts Claimed:", stats[1].toString());
    console.log("Value Locked:", ethers.formatUnits(stats[2], 18), "GGT");
    
  } catch (error: any) {
    console.error("❌ Emergency withdrawal failed:", error.reason || error.message);
    console.log("\n💡 Alternative: Let's create a claim script that bypasses GPS verification");
  }

  console.log("\n==================================================");
  console.log("🔧 Emergency Withdrawal Attempt Complete");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});