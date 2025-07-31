const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking if gift exists...");
  
  const RELAY_ESCROW_ADDRESS = "0x8284ab51a3221c7b295f949512B43DA1EB0Cd44f";
  const GIFT_ID = "0x0896225e666064ae1186f8b6ececdca2deb86613c35e2ab20eeec026d2bdd31a";
  
  try {
    // Get contract instance
    const relayEscrow = await ethers.getContractAt("SimpleRelayEscrow", RELAY_ESCROW_ADDRESS);
    
    console.log("📋 Checking gift:", GIFT_ID);
    
    // Check if gift exists and get details
    try {
      const giftDetails = await relayEscrow.getGift(GIFT_ID);
      console.log("\n🎁 Gift Details:");
      console.log("Sender:", giftDetails[0]);
      console.log("GGT Amount:", ethers.formatEther(giftDetails[1]));
      console.log("Gas Allowance:", ethers.formatEther(giftDetails[2]));
      console.log("Expiry:", new Date(Number(giftDetails[3]) * 1000).toLocaleString());
      console.log("Claimed:", giftDetails[4]);
      console.log("Refunded:", giftDetails[5]);
      console.log("Message:", giftDetails[6]);
      console.log("Unlock Type:", giftDetails[7]);
      console.log("Unlock Data:", giftDetails[8]);
      
      // Check if claimable
      const isClaimable = await relayEscrow.isClaimable(GIFT_ID);
      console.log("\n✅ Gift Status:");
      console.log("Is Claimable:", isClaimable);
      
      if (giftDetails[0] === "0x0000000000000000000000000000000000000000") {
        console.log("❌ Gift does not exist (sender is zero address)");
      } else {
        console.log("✅ Gift exists!");
      }
      
    } catch (error) {
      console.error("❌ Error getting gift details:", error.message);
      console.log("This usually means the gift doesn't exist.");
    }
    
  } catch (error) {
    console.error("❌ Script failed:", error);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✨ Check completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Check failed:", error);
      process.exit(1);
    });
}

module.exports = { main };