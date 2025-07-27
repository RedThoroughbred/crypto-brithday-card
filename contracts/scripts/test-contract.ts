import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing deployed LocationEscrow contract...");
  
  const contractAddress = "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";
  const [signer] = await ethers.getSigners();
  
  console.log("📝 Testing with account:", signer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "ETH");
  
  // Get contract instance
  const LocationEscrow = await ethers.getContractFactory("LocationEscrow");
  const escrow = LocationEscrow.attach(contractAddress);
  
  console.log("✅ Connected to contract at:", contractAddress);
  console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  
  // Test 1: Create a simple gift
  console.log("\n🎁 Creating test gift...");
  
  // Simple test coordinates (somewhere in NYC - loose requirements)
  const targetLat = Math.floor(40.7128 * 1e6); // NYC latitude * 1e6 for precision  
  const targetLon = Math.floor(-74.0060 * 1e6); // NYC longitude * 1e6 for precision
  const radius = 1000; // 1000 meters = 1km radius (very loose for testing)
  const giftAmount = ethers.parseEther("0.001"); // 0.001 ETH test gift
  const clueHash = ethers.keccak256(ethers.toUtf8Bytes("Find the big apple!")); // Simple clue
  const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
  const metadata = ethers.keccak256(ethers.toUtf8Bytes("Test gift metadata")); // Simple metadata
  
  console.log("📍 Target location: NYC area (40.7128, -74.0060)");
  console.log("📏 Radius: 1000 meters");
  console.log("💎 Gift amount: 0.001 ETH");
  console.log("🔍 Clue: Find the big apple!");
  console.log("⏰ Expires: 24 hours from now");
  
  try {
    const tx = await escrow.createGift(
      "0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F", // recipient (your other wallet)
      targetLat,
      targetLon, 
      radius,
      clueHash,
      expiryTime,
      metadata,
      { value: giftAmount }
    );
    
    console.log("⏳ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Gift created! Gas used:", receipt?.gasUsed.toString());
    
    // Get the gift ID from events
    const events = receipt?.logs || [];
    for (const log of events) {
      try {
        const parsedLog = escrow.interface.parseLog(log);
        if (parsedLog?.name === "GiftCreated") {
          const giftId = parsedLog.args[0];
          console.log("🆔 Gift ID:", giftId.toString());
          
          // Test 2: Try to claim the gift
          console.log("\n🎯 Testing gift claiming...");
          console.log("📍 Using same coordinates to claim gift...");
          
          const claimTx = await escrow.claimGift(giftId, targetLat, targetLon);
          console.log("⏳ Claim transaction sent:", claimTx.hash);
          const claimReceipt = await claimTx.wait();
          console.log("✅ Gift claimed! Gas used:", claimReceipt?.gasUsed.toString());
          
          console.log("\n🎉 SUCCESS! Full gift creation + claiming cycle completed!");
          console.log("💰 0.001 ETH was successfully escrowed and released!");
          break;
        }
      } catch (e) {
        // Skip non-matching logs
      }
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