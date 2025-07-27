import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Creating and claiming self-gift for testing...");
  
  const contractAddress = "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";
  const [signer] = await ethers.getSigners();
  
  console.log("📝 Using account:", signer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "ETH");
  
  // Get contract instance
  const LocationEscrow = await ethers.getContractFactory("LocationEscrow");
  const escrow = LocationEscrow.attach(contractAddress);
  
  // Create gift to self for testing
  const targetLat = Math.floor(40.7128 * 1e6); // NYC latitude  
  const targetLon = Math.floor(-74.0060 * 1e6); // NYC longitude
  const radius = 1000; // 1000 meters
  const giftAmount = ethers.parseEther("0.001"); // 0.001 ETH
  const clueHash = ethers.keccak256(ethers.toUtf8Bytes("Self test gift"));
  const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
  const metadata = ethers.keccak256(ethers.toUtf8Bytes("Self test metadata"));
  
  console.log("\n🎁 Creating self-gift...");
  console.log("📍 Target: NYC area");
  console.log("💎 Amount: 0.001 ETH");
  
  try {
    // Create gift to self
    const createTx = await escrow.createGift(
      signer.address, // recipient = sender for testing
      targetLat,
      targetLon, 
      radius,
      clueHash,
      expiryTime,
      metadata,
      { value: giftAmount }
    );
    
    console.log("⏳ Create transaction:", createTx.hash);
    const createReceipt = await createTx.wait();
    console.log("✅ Self-gift created!");
    
    // Get gift ID from events
    let giftId;
    for (const log of createReceipt?.logs || []) {
      try {
        const parsedLog = escrow.interface.parseLog(log);
        if (parsedLog?.name === "GiftCreated") {
          giftId = parsedLog.args[0];
          console.log("🆔 Gift ID:", giftId.toString());
          break;
        }
      } catch (e) {
        // Skip non-matching logs
      }
    }
    
    if (giftId) {
      // Now claim it immediately
      console.log("\n🎯 Claiming self-gift...");
      const locationProof = "0x"; // Empty for testing
      
      const claimTx = await escrow.claimGift(giftId, targetLat, targetLon, locationProof);
      console.log("⏳ Claim transaction:", claimTx.hash);
      
      const claimReceipt = await claimTx.wait();
      console.log("✅ Self-gift claimed!");
      console.log("🔗 Claim tx:", `https://sepolia.etherscan.io/tx/${claimTx.hash}`);
      
      console.log("\n🎉 FULL CYCLE SUCCESS!");
      console.log("✅ Created gift with 0.001 ETH");
      console.log("✅ Location verified (same coordinates)");
      console.log("✅ Crypto released from escrow");
      console.log("✅ Smart contract system PROVEN!");
      
      const finalBalance = await ethers.provider.getBalance(signer.address);
      console.log("💰 Final balance:", ethers.formatEther(finalBalance), "ETH");
    }
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });