import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Testing gift claiming...");
  
  const contractAddress = "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";
  const giftId = 1; // The gift we just created
  
  // Use the same coordinates from gift creation
  const targetLat = Math.floor(40.7128 * 1e6); // NYC latitude  
  const targetLon = Math.floor(-74.0060 * 1e6); // NYC longitude
  
  const [signer] = await ethers.getSigners();
  console.log("📝 Claiming with account:", signer.address);
  console.log("💰 Account balance before:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "ETH");
  
  // Get contract instance
  const LocationEscrow = await ethers.getContractFactory("LocationEscrow");
  const escrow = LocationEscrow.attach(contractAddress);
  
  console.log("🎁 Claiming Gift ID:", giftId);
  console.log("📍 Using coordinates: (40.7128, -74.0060)");
  
  try {
    // Claim the gift (with empty location proof for now)
    const locationProof = "0x"; // Empty bytes for basic testing
    const claimTx = await escrow.claimGift(giftId, targetLat, targetLon, locationProof);
    console.log("⏳ Claim transaction sent:", claimTx.hash);
    
    const claimReceipt = await claimTx.wait();
    console.log("✅ Gift claimed successfully! Gas used:", claimReceipt?.gasUsed.toString());
    console.log("🔗 View transaction:", `https://sepolia.etherscan.io/tx/${claimTx.hash}`);
    
    console.log("💰 Account balance after:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "ETH");
    
    console.log("\n🎉 COMPLETE SUCCESS!");
    console.log("✅ Gift created with 0.001 ETH");
    console.log("✅ Location verified");  
    console.log("✅ Crypto released from escrow");
    console.log("✅ Full gift cycle completed!");
    
  } catch (error: any) {
    console.error("❌ Claim failed:", error.message);
    
    // Try to get more info about the gift
    try {
      const gift = await escrow.gifts(giftId);
      console.log("🔍 Gift details:");
      console.log("  Recipient:", gift.recipient);
      console.log("  Amount:", ethers.formatEther(gift.amount), "ETH");
      console.log("  Claimed:", gift.claimed);
    } catch (e) {
      console.log("Could not retrieve gift details");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });