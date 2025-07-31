import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing NewUserGiftEscrowGGT Contract...\n");

  // Contract addresses
  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const NEWUSER_ESCROW_ADDRESS = "0x9fAE6c354C7514d19Ad2029f7Adc534A31eac712";

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Testing with wallet:", signer.address);

  // Get contract instances
  const ggtToken = await ethers.getContractAt("IERC20", GGT_TOKEN_ADDRESS);
  const newUserEscrow = await ethers.getContractAt("NewUserGiftEscrowGGT", NEWUSER_ESCROW_ADDRESS);

  // Check GGT balance
  const balance = await ggtToken.balanceOf(signer.address);
  console.log("GGT Balance:", ethers.formatEther(balance), "GGT");

  if (balance === 0n) {
    console.log("❌ No GGT tokens found. Please get some GGT tokens first.");
    return;
  }

  // Test parameters
  const testAmount = ethers.parseEther("100"); // 100 GGT
  const claimCode = "TEST-CLAIM-2025-XYZ";
  const claimHash = ethers.keccak256(ethers.toUtf8Bytes(claimCode));
  const expiryDays = 7;
  const message = "Test gift for new user";
  const unlockType = "simple";
  const unlockHash = ethers.ZeroHash; // No unlock challenge for simple type
  const unlockData = "";

  console.log("\n📋 Test Parameters:");
  console.log("Amount:", ethers.formatEther(testAmount), "GGT");
  console.log("Claim Code:", claimCode);
  console.log("Message:", message);
  console.log("Unlock Type:", unlockType);
  console.log("Expiry Days:", expiryDays);

  try {
    // Step 1: Check current allowance
    const currentAllowance = await ggtToken.allowance(signer.address, NEWUSER_ESCROW_ADDRESS);
    console.log("\n💰 Current GGT allowance:", ethers.formatEther(currentAllowance), "GGT");

    // Step 2: Approve GGT tokens if needed
    if (currentAllowance < testAmount) {
      console.log("📝 Approving GGT tokens...");
      const approveTx = await ggtToken.approve(NEWUSER_ESCROW_ADDRESS, testAmount);
      await approveTx.wait();
      console.log("✅ GGT tokens approved!");
    } else {
      console.log("✅ Sufficient GGT allowance already exists");
    }

    // Step 3: Create the gift
    console.log("\n🎁 Creating new user gift...");
    const createTx = await newUserEscrow.createNewUserGift(
      claimHash,
      testAmount,
      expiryDays,
      message,
      unlockType,
      unlockHash,
      unlockData
    );

    const receipt = await createTx.wait();
    console.log("✅ Gift created successfully!");
    console.log("Transaction hash:", receipt.hash);

    // Step 4: Parse events to get gift ID
    const giftCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = newUserEscrow.interface.parseLog(log);
        return parsed?.name === 'NewUserGiftCreated';
      } catch {
        return false;
      }
    });

    if (giftCreatedEvent) {
      const parsed = newUserEscrow.interface.parseLog(giftCreatedEvent);
      const giftId = parsed.args[0];
      console.log("🎫 Gift ID:", giftId);

      // Step 5: Verify gift details
      console.log("\n🔍 Verifying gift details...");
      const giftDetails = await newUserEscrow.getGift(giftId);
      console.log("Sender:", giftDetails[0]);
      console.log("Amount:", ethers.formatEther(giftDetails[1]), "GGT");
      console.log("Expiry:", new Date(Number(giftDetails[2]) * 1000).toLocaleString());
      console.log("Claimed:", giftDetails[3]);
      console.log("Refunded:", giftDetails[4]);
      console.log("Message:", giftDetails[5]);
      console.log("Unlock Type:", giftDetails[6]);

      // Step 6: Check if claimable
      const isClaimable = await newUserEscrow.isClaimable(giftId);
      console.log("Is Claimable:", isClaimable);

      if (isClaimable) {
        console.log("\n🎉 SUCCESS! Gift is ready to be claimed!");
        console.log("Share this claim code with the recipient:", claimCode);
        console.log("Claim URL: http://localhost:3000/claim-newuser/" + giftId);
      }
    } else {
      console.log("⚠️ Could not find gift creation event in transaction logs");
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
    
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error("💡 You may need more ETH for gas fees");
    } else if (error.reason?.includes('ERC20: insufficient allowance')) {
      console.error("💡 GGT token allowance issue - try approving more tokens");
    } else if (error.reason?.includes('ERC20: transfer amount exceeds balance')) {
      console.error("💡 Insufficient GGT balance");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });