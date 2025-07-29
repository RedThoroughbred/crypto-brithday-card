import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Creating Test GGT Gift to Main Wallet");
  console.log("=======================================");

  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  
  // User's main wallet (sender/creator)
  const MAIN_WALLET = "0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234";
  
  // Kentucky coordinates (close to user's location)
  const KENTUCKY_LAT = 38.879666; // Close to existing Gift ID 5
  const KENTUCKY_LON = -84.616383;
  const RADIUS = 100; // 100 meter radius
  const AMOUNT = "10"; // 10 GGT for testing
  
  const [signer] = await ethers.getSigners();
  console.log("Creating gift from:", signer.address);
  console.log("Recipient (main wallet):", MAIN_WALLET);
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
    MAIN_WALLET, // recipient is main wallet
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
    console.log("🎯 TEST GIFT CREATED:");
    console.log("Gift ID:", giftId?.toString());
    console.log("Recipient:", MAIN_WALLET);
    console.log("Amount:", AMOUNT, "GGT");
    console.log("Location:", KENTUCKY_LAT, KENTUCKY_LON);
    console.log("Radius:", RADIUS, "meters");
    console.log("");
    console.log("🔗 Claim URL:", `http://localhost:3000/claim?id=${giftId}`);
    console.log("");
    console.log("✅ Now you can test claiming with your main wallet!");
    console.log("💡 Use manual coordinates:", KENTUCKY_LAT, KENTUCKY_LON);
  }

  console.log("=======================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});