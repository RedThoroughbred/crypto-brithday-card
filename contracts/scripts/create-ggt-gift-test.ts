import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Creating 100 GGT Gift Test");
  console.log("==================================================");

  // Contract addresses
  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  
  // Test recipient address - provided by user
  const RECIPIENT_ADDRESS = "0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F"; // User's specified recipient
  
  // Gift parameters
  const GIFT_AMOUNT = ethers.parseUnits("100", 18); // 100 GGT tokens
  const TEST_LAT = BigInt(Math.floor(37.7749 * 1_000_000)); // San Francisco latitude scaled
  const TEST_LON = BigInt(Math.floor(-122.4194 * 1_000_000)); // San Francisco longitude scaled
  const RADIUS = BigInt(100); // 100 meter radius
  const CLUE_HASH = ethers.keccak256(ethers.toUtf8Bytes("Find the golden gate bridge"));
  const EXPIRY_TIME = BigInt(Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)); // 30 days from now
  const METADATA_HASH = ethers.keccak256(ethers.toUtf8Bytes("Test gift from Claude debugging"));

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Sender wallet:", signer.address);
  console.log("Recipient wallet:", RECIPIENT_ADDRESS);
  console.log("Gift amount:", ethers.formatUnits(GIFT_AMOUNT, 18), "GGT");

  // Get contract instances
  const ggtToken = await ethers.getContractAt("IERC20", GGT_TOKEN_ADDRESS);
  const ggtEscrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Check current balances
  const senderBalance = await ggtToken.balanceOf(signer.address);
  console.log("Sender GGT balance:", ethers.formatUnits(senderBalance, 18), "GGT");

  // Check current allowance
  const currentAllowance = await ggtToken.allowance(signer.address, GGT_ESCROW_ADDRESS);
  console.log("Current escrow allowance:", ethers.formatUnits(currentAllowance, 18), "GGT");

  console.log("\n📝 Step 1: Approving GGT tokens...");
  const approveTx = await ggtToken.approve(GGT_ESCROW_ADDRESS, GIFT_AMOUNT);
  console.log("Approval transaction sent:", approveTx.hash);
  await approveTx.wait();
  console.log("✅ Approval confirmed!");

  // Verify allowance
  const newAllowance = await ggtToken.allowance(signer.address, GGT_ESCROW_ADDRESS);
  console.log("New escrow allowance:", ethers.formatUnits(newAllowance, 18), "GGT");

  console.log("\n🎁 Step 2: Creating GGT gift...");
  const createTx = await ggtEscrow.createGift(
    RECIPIENT_ADDRESS,
    TEST_LAT,
    TEST_LON,
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
    console.log("🎉 Gift ID:", giftId?.toString());
  }

  // Check contract stats
  const stats = await ggtEscrow.getStats();
  console.log("\n📊 Contract Stats After Gift Creation:");
  console.log("Gifts Created:", stats[0].toString());
  console.log("Gifts Claimed:", stats[1].toString());
  console.log("Value Locked:", ethers.formatUnits(stats[2], 18), "GGT");
  console.log("Next Gift ID:", stats[3].toString());

  // Get gift details
  if (giftId) {
    console.log("\n🔍 Gift Details:");
    const gift = await ggtEscrow.getGift(giftId);
    console.log("Giver:", gift.giver);
    console.log("Recipient:", gift.recipient);
    console.log("Amount:", ethers.formatUnits(gift.amount, 18), "GGT");
    console.log("Location:", `${Number(gift.latitude) / 1_000_000}, ${Number(gift.longitude) / 1_000_000}`);
    console.log("Radius:", gift.radius.toString(), "meters");
    console.log("Claimed:", gift.claimed);
    console.log("Exists:", gift.exists);
  }

  console.log("\n==================================================");
  console.log("🚀 GGT Gift Creation Test Complete!");
  console.log("Etherscan Link:", `https://sepolia.etherscan.io/tx/${createTx.hash}`);
  
  if (giftId) {
    console.log(`\n📱 Test claiming with:`);
    console.log(`Gift ID: ${giftId}`);
    console.log(`Location: 37.7749, -122.4194 (within 100m)`);
    console.log(`Recipient: ${RECIPIENT_ADDRESS}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});