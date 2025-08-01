const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Setting up relay wallet authorizations...");
  
  // Contract address (newly deployed SimpleRelayEscrow with DirectGift support)
  const RELAY_ESCROW_ADDRESS = "0xE96dAF23f7C89593a454cf75dBe3460df9642f6d";
  
  // Your wallet addresses
  const WALLET_1_MAIN = "0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234";      // Main wallet (you)
  const WALLET_2_RELAY = "0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F";      // Relay wallet
  const WALLET_3_RECIPIENT = "0x34658EE37146f125C39D12b6f586efD363AA1002";  // Test recipient
  
  // Get signer (should be Wallet 1)
  const [signer] = await ethers.getSigners();
  console.log("📝 Using account:", signer.address);
  
  if (signer.address !== WALLET_1_MAIN) {
    console.warn("⚠️  Warning: Expected to sign with Wallet 1 (Main), but got:", signer.address);
  }
  
  try {
    // Get contract instance
    const relayEscrow = await ethers.getContractAt("SimpleRelayEscrow", RELAY_ESCROW_ADDRESS);
    console.log("📄 Connected to SimpleRelayEscrow at:", RELAY_ESCROW_ADDRESS);
    
    // Authorize Wallet 2 as relay
    console.log("\n🔐 Authorizing Wallet 2 as relay...");
    const auth2Tx = await relayEscrow.setRelayAuthorization(WALLET_2_RELAY, true);
    await auth2Tx.wait();
    console.log("✅ Wallet 2 authorized as relay:", WALLET_2_RELAY);
    
    // Authorize Wallet 3 as relay (optional, for testing flexibility)
    console.log("\n🔐 Authorizing Wallet 3 as relay...");
    const auth3Tx = await relayEscrow.setRelayAuthorization(WALLET_3_RECIPIENT, true);
    await auth3Tx.wait();
    console.log("✅ Wallet 3 authorized as relay:", WALLET_3_RECIPIENT);
    
    // Verify authorizations
    console.log("\n🔍 Verifying authorizations...");
    const isWallet2Authorized = await relayEscrow.authorizedRelays(WALLET_2_RELAY);
    const isWallet3Authorized = await relayEscrow.authorizedRelays(WALLET_3_RECIPIENT);
    
    console.log("Wallet 2 authorized:", isWallet2Authorized);
    console.log("Wallet 3 authorized:", isWallet3Authorized);
    
    console.log("\n🎉 Relay Wallet Setup Complete!");
    console.log("================================");
    console.log("Contract:", RELAY_ESCROW_ADDRESS);
    console.log("Main Wallet (Creator):", WALLET_1_MAIN);
    console.log("Relay Wallet (Gas Sponsor):", WALLET_2_RELAY, "✅ Authorized");
    console.log("Test Recipient (No ETH):", WALLET_3_RECIPIENT, "✅ Authorized");
    console.log("================================");
    
    console.log("\n📋 Next Steps:");
    console.log("1. Update frontend configuration");
    console.log("2. Test gift creation with Wallet 1");
    console.log("3. Test gasless claiming with Wallet 3");
    console.log("4. Wallet 2 will automatically sponsor gas");
    
    return {
      contractAddress: RELAY_ESCROW_ADDRESS,
      wallet1: WALLET_1_MAIN,
      wallet2: WALLET_2_RELAY,
      wallet3: WALLET_3_RECIPIENT,
      wallet2Authorized: isWallet2Authorized,
      wallet3Authorized: isWallet3Authorized
    };
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n✨ Setup successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}

module.exports = { main };