const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing GSN-enabled GeoGift functionality...");
  
  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("👤 User1 (gift creator):", user1.address);
  console.log("👤 User2 (gift recipient):", user2.address);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
  
  try {
    // Contract addresses
    const ESCROW_ADDRESS = "0xcbC7e4Da24D79CA183FC741d58793C57E4D01666";
    const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
    
    console.log("\n📋 Contract Addresses:");
    console.log("Escrow:", ESCROW_ADDRESS);
    console.log("GGT Token:", GGT_TOKEN_ADDRESS);
    
    // Get contract instances
    const escrow = await ethers.getContractAt("NewUserGiftEscrowSimple", ESCROW_ADDRESS);
    const ggtToken = await ethers.getContractAt("IERC20", GGT_TOKEN_ADDRESS);
    
    console.log("\n📊 Initial Balances:");
    const deployer_ggt = await ggtToken.balanceOf(deployer.address);
    const user1_ggt = await ggtToken.balanceOf(user1.address);
    const user1_eth = await ethers.provider.getBalance(user1.address);
    const user2_eth = await ethers.provider.getBalance(user2.address);
    
    console.log(`Deployer GGT: ${ethers.formatEther(deployer_ggt)}`);
    console.log(`User1 GGT: ${ethers.formatEther(user1_ggt)}`);
    console.log(`User1 ETH: ${ethers.formatEther(user1_eth)}`);
    console.log(`User2 ETH: ${ethers.formatEther(user2_eth)}`);
    
    // Step 1: Transfer some GGT to user1 for testing
    if (deployer_ggt > 0) {
      console.log("\n💰 Transferring GGT to User1 for testing...");
      const transferAmount = ethers.parseEther("100");
      const transferTx = await ggtToken.connect(deployer).transfer(user1.address, transferAmount);
      await transferTx.wait();
      console.log("✅ Transferred 100 GGT to User1");
    }
    
    // Step 2: Create a test gift
    console.log("\n🎁 Creating test gift...");
    
    const giftAmount = ethers.parseEther("50"); // 50 GGT
    const gasAllowance = ethers.parseEther("0.005"); // 0.005 ETH for gas
    const claimCode = "TEST-GIFT-2025-ABC";
    const claimHash = ethers.keccak256(ethers.toUtf8Bytes(claimCode));
    const expiryDays = 30;
    const message = "Test gift for GSN functionality";
    const unlockType = "simple";
    const unlockHash = ethers.ZeroHash;
    const unlockData = "";
    
    // Approve GGT spending
    console.log("🔐 Approving GGT spending...");
    const approveTx = await ggtToken.connect(user1).approve(ESCROW_ADDRESS, giftAmount);
    await approveTx.wait();
    console.log("✅ GGT approval confirmed");
    
    // Create gift
    console.log("📦 Creating gift...");
    const createTx = await escrow.connect(user1).createNewUserGift(
      claimHash,
      giftAmount,
      gasAllowance,
      expiryDays,
      message,
      unlockType,
      unlockHash,
      unlockData,
      { value: gasAllowance }
    );
    
    const receipt = await createTx.wait();
    console.log("✅ Gift created! Transaction:", receipt.hash);
    
    // Extract gift ID from events
    const giftCreatedEvent = receipt.logs.find(log => {
      try {
        const parsedLog = escrow.interface.parseLog(log);
        return parsedLog?.name === 'NewUserGiftCreated';
      } catch {
        return false;
      }
    });
    
    let giftId = '';
    if (giftCreatedEvent) {
      const parsedLog = escrow.interface.parseLog(giftCreatedEvent);
      giftId = parsedLog?.args[0] || '';
      console.log("🆔 Gift ID:", giftId);
    }
    
    // Step 3: Verify gift details
    console.log("\n🔍 Verifying gift details...");
    const giftDetails = await escrow.getGift(giftId);
    console.log("Gift details:", {
      sender: giftDetails[0],
      ggtAmount: ethers.formatEther(giftDetails[1]),
      gasAllowance: ethers.formatEther(giftDetails[2]),
      expiry: new Date(Number(giftDetails[3]) * 1000).toLocaleString(),
      claimed: giftDetails[4],
      refunded: giftDetails[5],
      message: giftDetails[6],
      unlockType: giftDetails[7],
      unlockData: giftDetails[8]
    });
    
    // Step 4: Test claim functionality
    console.log("\n🎉 Testing gift claim...");
    const isClaimable = await escrow.isClaimable(giftId);
    console.log("Is claimable:", isClaimable);
    
    if (isClaimable) {
      console.log("👤 User2 claiming gift...");
      const claimTx = await escrow.connect(user2).claimGift(
        giftId,
        claimCode,
        "" // No unlock answer needed for simple type
      );
      
      const claimReceipt = await claimTx.wait();
      console.log("✅ Gift claimed! Transaction:", claimReceipt.hash);
      
      // Check final balances
      console.log("\n📊 Final Balances:");
      const user2_ggt_final = await ggtToken.balanceOf(user2.address);
      console.log(`User2 GGT: ${ethers.formatEther(user2_ggt_final)}`);
      
      // Verify gift is now claimed
      const finalGiftDetails = await escrow.getGift(giftId);
      console.log("Gift claimed status:", finalGiftDetails[4]);
    }
    
    console.log("\n🎉 GSN Test Complete!");
    return true;
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Export function for use in other scripts
module.exports = {
  main
};

// Run test if this script is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✨ Test successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}