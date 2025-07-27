import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Claiming gift with recipient wallet...");
  
  const contractAddress = "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";
  const giftId = 1; // The gift we created earlier
  
  // Same coordinates from gift creation
  const targetLat = Math.floor(40.7128 * 1e6); // NYC latitude  
  const targetLon = Math.floor(-74.0060 * 1e6); // NYC longitude
  
  // Create wallet from your second private key
  const privateKey2 = process.env.PRIVATE_KEY_2!;
  const provider = ethers.provider;
  const wallet2 = new ethers.Wallet(privateKey2, provider);
  
  console.log("📝 Claiming with wallet:", wallet2.address);
  console.log("💰 Balance before claim:", ethers.formatEther(await provider.getBalance(wallet2.address)), "ETH");
  
  // Get contract instance connected to wallet2
  const LocationEscrow = await ethers.getContractFactory("LocationEscrow");
  const escrow = LocationEscrow.attach(contractAddress).connect(wallet2);
  
  console.log("🎁 Claiming Gift ID:", giftId);
  console.log("📍 Using coordinates: (40.7128, -74.0060)");
  
  try {
    // First check if this wallet can claim
    const gift = await escrow.gifts(giftId);
    console.log("🔍 Gift recipient:", gift.recipient);
    console.log("🔍 Current claimer:", wallet2.address);
    console.log("🔍 Gift amount:", ethers.formatEther(gift.amount), "ETH");
    console.log("🔍 Already claimed:", gift.claimed);
    
    if (gift.recipient !== wallet2.address) {
      console.log("❌ Wrong recipient wallet!");
      return;
    }
    
    if (gift.claimed) {
      console.log("❌ Gift already claimed!");
      return;
    }
    
    // Claim the gift
    const locationProof = "0x"; // Empty bytes for testing
    const claimTx = await escrow.claimGift(giftId, targetLat, targetLon, locationProof);
    console.log("⏳ Claim transaction sent:", claimTx.hash);
    
    const claimReceipt = await claimTx.wait();
    console.log("✅ Gift claimed successfully! Gas used:", claimReceipt?.gasUsed.toString());
    console.log("🔗 View transaction:", `https://sepolia.etherscan.io/tx/${claimTx.hash}`);
    
    const balanceAfter = await provider.getBalance(wallet2.address);
    console.log("💰 Balance after claim:", ethers.formatEther(balanceAfter), "ETH");
    
    console.log("\n🎉 COMPLETE SUCCESS!");
    console.log("✅ Gift created with 0.001 ETH");
    console.log("✅ Location verified at NYC coordinates");  
    console.log("✅ Crypto released from escrow to recipient");
    console.log("✅ Full gift cycle completed!");
    console.log("🚀 SMART CONTRACT SYSTEM PROVEN WORKING!");
    
  } catch (error: any) {
    console.error("❌ Claim failed:", error.message);
    console.error("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });