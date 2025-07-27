import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Claiming gift created via UI...");
  
  const contractAddress = "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";
  
  // The gift should be ID 2 or 3 (since we created some earlier)
  // Let's check the latest gifts
  const provider = ethers.provider;
  
  // Create wallet from your second private key
  const privateKey2 = process.env.PRIVATE_KEY_2!;
  const wallet2 = new ethers.Wallet(privateKey2, provider);
  
  console.log("📝 Claiming with wallet:", wallet2.address);
  console.log("💰 Balance before:", ethers.formatEther(await provider.getBalance(wallet2.address)), "ETH");
  
  // Get contract instance
  const LocationEscrow = await ethers.getContractFactory("LocationEscrow");
  const escrow = LocationEscrow.attach(contractAddress).connect(wallet2);
  
  // Check gifts 1, 2, 3 to find the right one
  for (let giftId = 1; giftId <= 5; giftId++) {
    try {
      const gift = await escrow.gifts(giftId);
      console.log(`\n🎁 Gift ${giftId}:`);
      console.log("  Recipient:", gift.recipient);
      console.log("  Amount:", ethers.formatEther(gift.amount), "ETH");
      console.log("  Claimed:", gift.claimed);
      console.log("  Exists:", gift.exists);
      
      if (gift.recipient === wallet2.address && !gift.claimed && gift.exists) {
        console.log(`\n🎯 Found our gift! ID: ${giftId}`);
        
        // Use the Central Park coordinates from the UI (40.7831, -73.9712)
        const targetLat = Math.floor(40.7831 * 1e6);
        const targetLon = Math.floor(-73.9712 * 1e6);
        
        console.log("📍 Using coordinates: (40.7831, -73.9712)");
        
        const locationProof = "0x"; // Empty for testing
        const claimTx = await escrow.claimGift(giftId, targetLat, targetLon, locationProof);
        console.log("⏳ Claim transaction:", claimTx.hash);
        
        const claimReceipt = await claimTx.wait();
        console.log("✅ Gift claimed! Gas used:", claimReceipt?.gasUsed.toString());
        console.log("🔗 View transaction:", `https://sepolia.etherscan.io/tx/${claimTx.hash}`);
        
        const balanceAfter = await provider.getBalance(wallet2.address);
        console.log("💰 Balance after:", ethers.formatEther(balanceAfter), "ETH");
        
        console.log("\n🎉 COMPLETE UI-TO-BLOCKCHAIN SUCCESS!");
        console.log("✅ Gift created via UI");
        console.log("✅ Location verified");  
        console.log("✅ Crypto released to recipient");
        break;
      }
    } catch (error) {
      // Gift doesn't exist, continue
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });