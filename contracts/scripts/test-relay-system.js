const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Simple Relay System for Gasless Claims...");
  
  // Contract and wallet addresses
  const RELAY_ESCROW_ADDRESS = "0x8284ab51a3221c7b295f949512B43DA1EB0Cd44f";
  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  
  const WALLET_1_MAIN = "0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234";
  const WALLET_2_RELAY = "0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F";
  const WALLET_3_RECIPIENT = "0x34658EE37146f125C39D12b6f586efD363AA1002";
  
  // Get signers
  const [signer] = await ethers.getSigners();
  console.log("👤 Current signer:", signer.address);
  
  if (signer.address !== WALLET_1_MAIN) {
    console.warn("⚠️  Note: Expected Wallet 1 as signer for complete test");
  }
  
  try {
    // Get contract instances
    const relayEscrow = await ethers.getContractAt("SimpleRelayEscrow", RELAY_ESCROW_ADDRESS);
    const ggtToken = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", GGT_TOKEN_ADDRESS);
    
    console.log("\n📋 Contract Information:");
    console.log("SimpleRelayEscrow:", RELAY_ESCROW_ADDRESS);
    console.log("GGT Token:", GGT_TOKEN_ADDRESS);
    
    // Check initial balances
    console.log("\n📊 Initial Balances:");
    const wallet1_ggt = await ggtToken.balanceOf(WALLET_1_MAIN);
    const wallet3_ggt = await ggtToken.balanceOf(WALLET_3_RECIPIENT);
    const wallet2_eth = await ethers.provider.getBalance(WALLET_2_RELAY);
    const wallet3_eth = await ethers.provider.getBalance(WALLET_3_RECIPIENT);
    
    console.log(`Wallet 1 GGT: ${ethers.formatEther(wallet1_ggt)}`);
    console.log(`Wallet 2 ETH: ${ethers.formatEther(wallet2_eth)}`);
    console.log(`Wallet 3 GGT: ${ethers.formatEther(wallet3_ggt)}`);
    console.log(`Wallet 3 ETH: ${ethers.formatEther(wallet3_eth)} (should be ~0 for gasless test)`);
    
    // Check relay authorizations
    console.log("\n🔍 Checking Relay Authorizations:");
    const isWallet2Authorized = await relayEscrow.authorizedRelays(WALLET_2_RELAY);
    const isWallet3Authorized = await relayEscrow.authorizedRelays(WALLET_3_RECIPIENT);
    
    console.log(`Wallet 2 (Relay) authorized: ${isWallet2Authorized}`);
    console.log(`Wallet 3 (Recipient) authorized: ${isWallet3Authorized}`);
    
    if (!isWallet2Authorized) {
      console.error("❌ Wallet 2 not authorized as relay! Run setup script first.");
      return;
    }
    
    // Test gift creation (if using Wallet 1)
    if (signer.address === WALLET_1_MAIN) {
      console.log("\n🎁 Creating test gift...");
      
      const giftAmount = ethers.parseEther("25"); // 25 GGT
      const gasAllowance = ethers.parseEther("0.003"); // 0.003 ETH for gas
      const claimCode = "RELAY-TEST-2025-XYZ";
      const claimHash = ethers.keccak256(ethers.toUtf8Bytes(claimCode));
      const expiryDays = 7;
      const message = "Test gift for relay system - gasless claiming!";
      const unlockType = "simple";
      const unlockHash = ethers.ZeroHash;
      const unlockData = "";
      
      // Check and approve GGT tokens
      const currentAllowance = await ggtToken.allowance(WALLET_1_MAIN, RELAY_ESCROW_ADDRESS);
      if (currentAllowance < giftAmount) {
        console.log("🔐 Approving GGT tokens...");
        const approveTx = await ggtToken.approve(RELAY_ESCROW_ADDRESS, giftAmount);
        await approveTx.wait();
        console.log("✅ GGT tokens approved");
      }
      
      // Create gift
      console.log("📦 Creating gift...");
      const createTx = await relayEscrow.createNewUserGift(
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
          const parsedLog = relayEscrow.interface.parseLog(log);
          return parsedLog?.name === 'NewUserGiftCreated';
        } catch {
          return false;
        }
      });
      
      let giftId = '';
      if (giftCreatedEvent) {
        const parsedLog = relayEscrow.interface.parseLog(giftCreatedEvent);
        giftId = parsedLog?.args[0] || '';
        console.log("🆔 Gift ID:", giftId);
        
        // Save gift info for manual testing
        console.log("\n📋 Gift Information for Manual Testing:");
        console.log("================================");
        console.log(`Gift ID: ${giftId}`);
        console.log(`Claim Code: ${claimCode}`);
        console.log(`Recipient Address: ${WALLET_3_RECIPIENT}`);
        console.log(`Contract: ${RELAY_ESCROW_ADDRESS}`);
        console.log("================================");
        
        // Show claim URL for frontend testing
        console.log(`\n🔗 Claim URL: http://localhost:3000/claim-newuser/${giftId}`);
      }
      
      // Verify gift details
      const giftDetails = await relayEscrow.getGift(giftId);
      console.log("\n🔍 Gift Details:");
      console.log("Sender:", giftDetails[0]);
      console.log("GGT Amount:", ethers.formatEther(giftDetails[1]));
      console.log("Gas Allowance:", ethers.formatEther(giftDetails[2]));
      console.log("Expiry:", new Date(Number(giftDetails[3]) * 1000).toLocaleString());
      console.log("Claimed:", giftDetails[4]);
      console.log("Message:", giftDetails[6]);
      console.log("Unlock Type:", giftDetails[7]);
      
      // Check if claimable
      const isClaimable = await relayEscrow.isClaimable(giftId);
      console.log("Is Claimable:", isClaimable);
    }
    
    console.log("\n🎉 Relay System Test Complete!");
    console.log("\n📋 Next Steps for Testing:");
    console.log("1. Start the frontend: npm run dev");
    console.log("2. Connect with Wallet 3 (recipient with no ETH)");
    console.log("3. Use the claim URL to test gasless claiming");
    console.log("4. Optionally run relay service with Wallet 2");
    
    console.log("\n💡 How Gasless Claiming Works:");
    console.log("• Wallet 3 signs a claim message (no gas needed)");
    console.log("• Frontend or relay service submits with Wallet 2");
    console.log("• Wallet 2 pays gas, gets refunded from gift's allowance");
    console.log("• Wallet 3 receives GGT tokens without spending ETH!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✨ Test completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}

module.exports = { main };