import { ethers } from "hardhat";

async function main() {
  console.log("🔑 Creating Test Wallet and GGT Gift");
  console.log("=====================================");

  // Generate a new test wallet
  const testWallet = ethers.Wallet.createRandom();
  console.log("📝 NEW TEST WALLET CREATED:");
  console.log("Address:", testWallet.address);
  console.log("Private Key:", testWallet.privateKey);
  console.log("");
  console.log("⚠️  SAVE THIS PRIVATE KEY to import into MetaMask!");
  console.log("=====================================");
  console.log("");

  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  
  // Kentucky coordinates (close to user's location)
  const KENTUCKY_LAT = 38.879666;
  const KENTUCKY_LON = -84.616383;
  const RADIUS = 100; // 100 meter radius
  const AMOUNT = "25"; // 25 GGT for testing
  
  const [signer] = await ethers.getSigners();
  console.log("Creating gift from:", signer.address);
  console.log("Recipient (TEST wallet):", testWallet.address);
  console.log("Amount:", AMOUNT, "GGT");
  console.log("Location: Kentucky", KENTUCKY_LAT, KENTUCKY_LON);
  console.log("Radius:", RADIUS, "meters");
  console.log("");

  // Get contracts
  const ggtToken = await ethers.getContractAt("IERC20", GGT_TOKEN_ADDRESS);
  const escrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Check balance
  const balance = await ggtToken.balanceOf(signer.address);
  console.log("Current GGT balance:", ethers.formatUnits(balance, 18), "GGT");

  if (balance < ethers.parseUnits(AMOUNT, 18)) {
    console.log("❌ Insufficient GGT balance");
    return;
  }

  // Step 1: Approve GGT tokens
  console.log("📝 Step 1: Approving GGT tokens...");
  const approveTx = await ggtToken.approve(
    GGT_ESCROW_ADDRESS,
    ethers.parseUnits(AMOUNT, 18)
  );
  console.log("Approval transaction:", approveTx.hash);
  await approveTx.wait();
  console.log("✅ GGT tokens approved");
  console.log("");

  // Step 2: Create gift
  console.log("🎁 Step 2: Creating gift...");
  const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
  const createTx = await escrow.createGift(
    testWallet.address, // recipient is the new test wallet
    Math.floor(KENTUCKY_LAT * 1_000_000), // latitude scaled
    Math.floor(KENTUCKY_LON * 1_000_000), // longitude scaled
    RADIUS,
    "0x0000000000000000000000000000000000000000000000000000000000000000", // empty clue hash
    expiryTime, // expiry time
    "0x0000000000000000000000000000000000000000000000000000000000000000", // empty metadata
    ethers.parseUnits(AMOUNT, 18) // amount last
  );
  
  console.log("Create gift transaction:", createTx.hash);
  const receipt = await createTx.wait();
  console.log("✅ Gift created successfully!");
  
  // Get the gift ID from events
  const createEvent = receipt.logs.find(log => {
    try {
      const parsed = escrow.interface.parseLog(log);
      return parsed?.name === 'GiftCreated';
    } catch {
      return false;
    }
  });
  
  if (createEvent) {
    const parsed = escrow.interface.parseLog(createEvent);
    const giftId = parsed?.args?.giftId;
    console.log("");
    console.log("=====================================");
    console.log("🎯 TEST GIFT CREATED SUCCESSFULLY!");
    console.log("=====================================");
    console.log("Gift ID:", giftId?.toString());
    console.log("Recipient:", testWallet.address);
    console.log("Amount:", AMOUNT, "GGT");
    console.log("Location:", KENTUCKY_LAT, KENTUCKY_LON);
    console.log("Radius:", RADIUS, "meters");
    console.log("");
    console.log("📋 NEXT STEPS:");
    console.log("1. Import this private key into MetaMask (different browser profile):");
    console.log("   ", testWallet.privateKey);
    console.log("");
    console.log("2. Visit the claim URL with the test wallet connected:");
    console.log("   🔗 http://localhost:3000/claim?id=" + giftId);
    console.log("");
    console.log("3. Use manual coordinates:", KENTUCKY_LAT, KENTUCKY_LON);
    console.log("");
    console.log("✅ Now you can test claiming with a different wallet!");
  }

  console.log("=====================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});