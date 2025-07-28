import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking GGT Escrow Contract for Gifts...\n");
  
  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  
  // GGT Escrow ABI
  const ggtEscrowABI = [
    "function getStats() external view returns (uint256 giftsCreated, uint256 giftsClaimed, uint256 valueLocked, uint256 nextId)",
    "function gifts(uint256) external view returns (address giver, address recipient, uint256 amount, int256 latitude, int256 longitude, uint256 radius, bytes32 clueHash, uint256 expiryTime, bytes32 metadata, bool claimed, bool exists, uint256 claimAttempts, uint256 createdAt)",
    "function isGiftClaimable(uint256 giftId) external view returns (bool claimable)"
  ];
  
  try {
    const [signer] = await ethers.getSigners();
    const provider = signer.provider;
    
    // Connect to GGT escrow contract
    const ggtEscrow = new ethers.Contract(GGT_ESCROW_ADDRESS, ggtEscrowABI, provider);
    
    console.log("📊 GGT Escrow Contract Stats:");
    console.log("=" .repeat(50));
    
    // Get contract stats
    const stats = await ggtEscrow.getStats();
    const [giftsCreated, giftsClaimed, valueLocked, nextId] = stats;
    
    console.log(`Gifts Created: ${giftsCreated}`);
    console.log(`Gifts Claimed: ${giftsClaimed}`);
    console.log(`Value Locked: ${ethers.formatUnits(valueLocked, 18)} GGT`);
    console.log(`Next Gift ID: ${nextId}`);
    console.log(`Contract Address: ${GGT_ESCROW_ADDRESS}`);
    console.log(`Etherscan: https://sepolia.etherscan.io/address/${GGT_ESCROW_ADDRESS}`);
    
    // Check if any gifts exist
    if (giftsCreated > 0) {
      console.log("\n🎁 Gift Details:");
      console.log("=" .repeat(50));
      
      for (let i = 1; i < nextId; i++) {
        try {
          const gift = await ggtEscrow.gifts(i);
          const [giver, recipient, amount, latitude, longitude, radius, clueHash, expiryTime, metadata, claimed, exists, claimAttempts, createdAt] = gift;
          
          if (exists) {
            console.log(`\nGift ID: ${i}`);
            console.log(`Giver: ${giver}`);
            console.log(`Recipient: ${recipient}`);
            console.log(`Amount: ${ethers.formatUnits(amount, 18)} GGT`);
            console.log(`Location: ${Number(latitude) / 1000000}, ${Number(longitude) / 1000000}`);
            console.log(`Radius: ${radius}m`);
            console.log(`Claimed: ${claimed ? '✅' : '❌'}`);
            console.log(`Created: ${new Date(Number(createdAt) * 1000).toLocaleString()}`);
            console.log(`Expires: ${new Date(Number(expiryTime) * 1000).toLocaleString()}`);
            
            // Check if claimable
            const claimable = await ggtEscrow.isGiftClaimable(i);
            console.log(`Claimable: ${claimable ? '✅' : '❌'}`);
          }
        } catch (error) {
          console.log(`Gift ${i}: Not found or error`);
        }
      }
    } else {
      console.log("\n❌ No gifts found in GGT escrow contract");
    }
    
    console.log("\n" + "=" .repeat(50));
    console.log("✅ GGT Escrow Check Complete!");
    
  } catch (error) {
    console.error("❌ Error checking GGT escrow:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });