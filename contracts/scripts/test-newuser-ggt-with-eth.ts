import { ethers } from "hardhat";
import { parseEther, formatEther, keccak256, toUtf8Bytes } from "ethers/lib/utils";

async function main() {
  console.log("🧪 Testing NewUserGiftEscrowGGTWithETH contract...");
  
  // Get signers
  const [owner, recipient] = await ethers.getSigners();
  console.log("👤 Owner:", owner.address);
  console.log("👤 Recipient:", recipient.address);
  
  // Get contracts
  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const CONTRACT_ADDRESS = ""; // Replace with deployed contract address
  
  if (!CONTRACT_ADDRESS) {
    console.log("❌ Please set CONTRACT_ADDRESS in the script");
    return;
  }
  
  // Get contract instances
  const ggtToken = await ethers.getContractAt("IERC20", GGT_TOKEN_ADDRESS);
  const escrow = await ethers.getContractAt("NewUserGiftEscrowGGTWithETH", CONTRACT_ADDRESS);
  
  // Test parameters
  const claimCode = "HAPPY-GIFT-2025-TEST";
  const ggtAmount = parseEther("100"); // 100 GGT
  const ethAmount = parseEther("0.005"); // 0.005 ETH for gas
  const expiryDays = 30;
  const message = "Test gift with ETH for gas!";
  const unlockType = "simple";
  const unlockHash = ethers.constants.HashZero;
  const unlockData = "";
  
  console.log("\n📋 Test Parameters:");
  console.log("Claim Code:", claimCode);
  console.log("GGT Amount:", formatEther(ggtAmount), "GGT");
  console.log("ETH Amount:", formatEther(ethAmount), "ETH");
  console.log("Message:", message);
  
  try {
    // Step 1: Check GGT balance
    const ggtBalance = await ggtToken.balanceOf(owner.address);
    console.log("\n💰 Owner GGT Balance:", formatEther(ggtBalance), "GGT");
    
    if (ggtBalance.lt(ggtAmount)) {
      console.log("❌ Insufficient GGT balance");
      return;
    }
    
    // Step 2: Check ETH balance
    const ethBalance = await owner.getBalance();
    console.log("💰 Owner ETH Balance:", formatEther(ethBalance), "ETH");
    
    if (ethBalance.lt(ethAmount.add(parseEther("0.01")))) { // Extra for gas
      console.log("❌ Insufficient ETH balance");
      return;
    }
    
    // Step 3: Approve GGT tokens
    console.log("\n🔓 Approving GGT tokens...");
    const approveTx = await ggtToken.connect(owner).approve(CONTRACT_ADDRESS, ggtAmount);
    await approveTx.wait();
    console.log("✅ GGT tokens approved");
    
    // Step 4: Create gift with ETH
    console.log("\n🎁 Creating gift with ETH...");
    const claimHash = keccak256(toUtf8Bytes(claimCode));
    
    const createTx = await escrow.connect(owner).createNewUserGift(
      claimHash,
      ggtAmount,
      ethAmount,
      expiryDays,
      message,
      unlockType,
      unlockHash,
      unlockData,
      { value: ethAmount } // Send ETH with transaction
    );
    
    const receipt = await createTx.wait();
    console.log("✅ Gift created! Tx:", receipt.transactionHash);
    
    // Extract gift ID from events
    const event = receipt.events?.find(e => e.event === "NewUserGiftCreated");
    const giftId = event?.args?.giftId;
    console.log("🎁 Gift ID:", giftId);
    
    // Step 5: Check gift details
    console.log("\n📊 Gift Details:");
    const giftDetails = await escrow.getGift(giftId);
    console.log("Sender:", giftDetails.sender);
    console.log("GGT Amount:", formatEther(giftDetails.ggtAmount), "GGT");
    console.log("ETH Amount:", formatEther(giftDetails.ethAmount), "ETH");
    console.log("Message:", giftDetails.message);
    console.log("Unlock Type:", giftDetails.unlockType);
    
    // Step 6: Check contract balances
    console.log("\n🏦 Contract Balances:");
    const contractGGTBalance = await escrow.getContractGGTBalance();
    const contractETHBalance = await escrow.getContractETHBalance();
    console.log("Contract GGT:", formatEther(contractGGTBalance), "GGT");
    console.log("Contract ETH:", formatEther(contractETHBalance), "ETH");
    
    // Step 7: Claim gift (as recipient)
    console.log("\n🎯 Claiming gift as recipient...");
    const recipientETHBefore = await recipient.getBalance();
    const recipientGGTBefore = await ggtToken.balanceOf(recipient.address);
    
    console.log("Recipient ETH before:", formatEther(recipientETHBefore), "ETH");
    console.log("Recipient GGT before:", formatEther(recipientGGTBefore), "GGT");
    
    const claimTx = await escrow.connect(recipient).claimGift(
      giftId,
      claimCode,
      ""
    );
    
    const claimReceipt = await claimTx.wait();
    console.log("✅ Gift claimed! Tx:", claimReceipt.transactionHash);
    
    // Step 8: Check recipient balances after claim
    const recipientETHAfter = await recipient.getBalance();
    const recipientGGTAfter = await ggtToken.balanceOf(recipient.address);
    
    console.log("\n💎 Recipient Balances After Claim:");
    console.log("ETH after:", formatEther(recipientETHAfter), "ETH");
    console.log("GGT after:", formatEther(recipientGGTAfter), "GGT");
    
    const ethReceived = recipientETHAfter.sub(recipientETHBefore).add(claimReceipt.gasUsed.mul(claimReceipt.effectiveGasPrice));
    const ggtReceived = recipientGGTAfter.sub(recipientGGTBefore);
    
    console.log("ETH received (excluding gas):", formatEther(ethReceived), "ETH");
    console.log("GGT received:", formatEther(ggtReceived), "GGT");
    
    // Verify amounts
    const expectedETH = ethAmount;
    const expectedGGT = ggtAmount;
    
    if (ethReceived.eq(expectedETH) && ggtReceived.eq(expectedGGT)) {
      console.log("\n🎉 SUCCESS! Both ETH and GGT transferred correctly!");
    } else {
      console.log("\n❌ MISMATCH!");
      console.log("Expected ETH:", formatEther(expectedETH));
      console.log("Expected GGT:", formatEther(expectedGGT));
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });