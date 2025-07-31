const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing frontend gift lookup compatibility...");
  
  const RELAY_ESCROW_ADDRESS = "0x8284ab51a3221c7b295f949512B43DA1EB0Cd44f";
  const GIFT_ID = "0x0896225e666064ae1186f8b6ececdca2deb86613c35e2ab20eeec026d2bdd31a";
  
  try {
    // Get contract instance
    const relayEscrow = await ethers.getContractAt("SimpleRelayEscrow", RELAY_ESCROW_ADDRESS);
    
    console.log("📋 Testing gift lookup for frontend compatibility...");
    console.log("Gift ID:", GIFT_ID);
    console.log("Contract:", RELAY_ESCROW_ADDRESS);
    
    // Test getGift function (what frontend hook calls)
    const giftDetails = await relayEscrow.getGift(GIFT_ID);
    console.log("\n🎁 Raw getGift() response:");
    console.log("giftDetails:", giftDetails);
    
    // Parse as frontend expects: [sender, ggtAmount, ethAmount, expiry, claimed, refunded, message, unlockType, unlockData]
    const [sender, ggtAmount, gasAllowance, expiry, claimed, refunded, message, unlockType, unlockData] = giftDetails;
    
    console.log("\n📊 Parsed Gift Data (as frontend will see):");
    console.log("Sender:", sender);
    console.log("GGT Amount:", ethers.formatEther(ggtAmount));
    console.log("Gas Allowance (shown as ETH amount):", ethers.formatEther(gasAllowance));
    console.log("Expiry:", new Date(Number(expiry) * 1000).toLocaleString());
    console.log("Claimed:", claimed);
    console.log("Refunded:", refunded);
    console.log("Message:", message);
    console.log("Unlock Type:", unlockType);
    console.log("Unlock Data:", unlockData);
    
    // Test isClaimable function
    const isClaimable = await relayEscrow.isClaimable(GIFT_ID);
    console.log("\n✅ Claimability Check:");
    console.log("Is Claimable:", isClaimable);
    
    // Verify gift exists (sender should not be zero address)
    if (sender === "0x0000000000000000000000000000000000000000") {
      console.log("❌ ERROR: Gift doesn't exist (sender is zero address)");
      console.log("🔧 This means the frontend will show 'Gift Not Found'");
    } else {
      console.log("✅ SUCCESS: Gift exists and should be visible to frontend!");
      console.log("🎯 Frontend should be able to display this gift");
    }
    
    // Show how it will appear in the frontend
    console.log("\n🖥️  How this will appear in frontend:");
    console.log(`- Gift Amount: ${ethers.formatEther(ggtAmount)} GGT`);
    if (gasAllowance > 0) {
      console.log(`- Gas Allowance: ${ethers.formatEther(gasAllowance)} ETH (for gas)`);
    }
    console.log(`- Message: "${message}"`);
    console.log(`- Unlock Type: ${unlockType}`);
    console.log(`- Expires: ${new Date(Number(expiry) * 1000).toLocaleString()}`);
    console.log(`- Status: ${claimed ? 'CLAIMED' : isClaimable ? 'CLAIMABLE' : 'NOT CLAIMABLE'}`);
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✨ Frontend compatibility test completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}

module.exports = { main };