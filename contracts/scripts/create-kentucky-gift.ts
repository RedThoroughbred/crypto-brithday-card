import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Creating 50 GGT Gift for Kentucky Testing");
  console.log("==================================================");

  // Contract addresses
  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  
  // Use your own wallet as recipient for testing
  const [signer] = await ethers.getSigners();
  const RECIPIENT_ADDRESS = signer.address; // You can claim your own gift for testing
  
  // Kentucky coordinates (Louisville area as example)
  const GIFT_AMOUNT = ethers.parseUnits("50", 18); // 50 GGT tokens (smaller for testing)
  const KENTUCKY_LAT = BigInt(Math.floor(38.2527 * 1_000_000)); // Louisville, KY latitude
  const KENTUCKY_LON = BigInt(Math.floor(-85.7585 * 1_000_000)); // Louisville, KY longitude
  const RADIUS = BigInt(50000); // 50km radius - very large for easy testing
  
  const CLUE_HASH = ethers.keccak256(ethers.toUtf8Bytes("You're in the Bluegrass State!"));
  const EXPIRY_TIME = BigInt(Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)); // 7 days from now
  const METADATA_HASH = ethers.keccak256(ethers.toUtf8Bytes("Kentucky test gift - large radius for easy claiming"));

  console.log("Sender/Recipient wallet:", signer.address);
  console.log("Gift amount:", ethers.formatUnits(GIFT_AMOUNT, 18), "GGT");
  console.log("Target location: Louisville, KY (38.2527, -85.7585)");
  console.log("Radius:", "50,000 meters (50km) - very large for testing");

  // Get contract instances
  const ggtToken = await ethers.getContractAt("IERC20", GGT_TOKEN_ADDRESS);
  const ggtEscrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Check current balance
  const senderBalance = await ggtToken.balanceOf(signer.address);
  console.log("Current GGT balance:", ethers.formatUnits(senderBalance, 18), "GGT");

  console.log("\n📝 Step 1: Approving GGT tokens...");
  const approveTx = await ggtToken.approve(GGT_ESCROW_ADDRESS, GIFT_AMOUNT);
  console.log("Approval transaction sent:", approveTx.hash);
  await approveTx.wait();
  console.log("✅ Approval confirmed!");

  console.log("\n🎁 Step 2: Creating Kentucky GGT gift...");
  const createTx = await ggtEscrow.createGift(
    RECIPIENT_ADDRESS,
    KENTUCKY_LAT,
    KENTUCKY_LON,
    RADIUS,
    CLUE_HASH,
    EXPIRY_TIME,
    METADATA_HASH,
    GIFT_AMOUNT
  );
  console.log("Gift creation transaction sent:", createTx.hash);
  const receipt = await createTx.wait();
  console.log("✅ Gift created successfully!");

  // Parse events to get gift ID
  const giftCreatedEvent = receipt?.logs.find(log => {
    try {
      const parsed = ggtEscrow.interface.parseLog(log);
      return parsed?.name === 'GiftCreated';
    } catch {
      return false;
    }
  });

  let giftId = null;
  if (giftCreatedEvent) {
    const parsed = ggtEscrow.interface.parseLog(giftCreatedEvent);
    giftId = parsed?.args.giftId;
    console.log("🎉 New Gift ID:", giftId?.toString());
  }

  // Check contract stats
  const stats = await ggtEscrow.getStats();
  console.log("\n📊 Contract Stats:");
  console.log("Total Gifts Created:", stats[0].toString());
  console.log("Total Value Locked:", ethers.formatUnits(stats[2], 18), "GGT");

  console.log("\n==================================================");
  console.log("🚀 Kentucky GGT Gift Created Successfully!");
  console.log("Etherscan Link:", `https://sepolia.etherscan.io/tx/${createTx.hash}`);
  
  if (giftId) {
    console.log(`\n📱 Gift Details for Testing:`);
    console.log(`Gift ID: ${giftId}`);
    console.log(`Target: Louisville, KY (38.2527, -85.7585)`);
    console.log(`Radius: 50km (anywhere in Kentucky should work)`);
    console.log(`Recipient: ${RECIPIENT_ADDRESS}`);
    console.log(`Amount: 50 GGT`);
    
    console.log(`\n🧪 For manual testing, you can use these coordinates:`);
    console.log(`- Latitude: 38.2527`);
    console.log(`- Longitude: -85.7585`);
    console.log(`- Or any coordinates within 50km of Louisville`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});