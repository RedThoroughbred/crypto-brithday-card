import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing mixed unlock types with signer:", signer.address);

  // Contract addresses
  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const GGT_CHAIN_ESCROW_ADDRESS = "0x3c7B305fa9b36b9848E4C705c1e4Ec27c9568e1e";

  // Get contract instances
  const ggtToken = await ethers.getContractAt("src/GGTLocationEscrow.sol:IERC20", GGT_TOKEN_ADDRESS);
  const chainEscrow = await ethers.getContractAt("GGTLocationChainEscrow", GGT_CHAIN_ESCROW_ADDRESS);

  // Test recipient (you can change this)
  const recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Example address

  // Create a chain with mixed unlock types
  const stepValues = [
    parseUnits("10", 18), // 10 GGT
    parseUnits("15", 18), // 15 GGT
    parseUnits("20", 18), // 20 GGT
    parseUnits("25", 18), // 25 GGT
  ];
  
  const totalAmount = stepValues.reduce((a, b) => a + b, 0n);
  
  // Mixed unlock types
  const stepTypes = [
    0, // GPS
    5, // Password
    4, // Quiz
    3, // Markdown
  ];
  
  // Step locations (only GPS step needs real coordinates)
  const stepLocations = [
    [BigInt(38.0336 * 1e6), BigInt(-84.5 * 1e6)], // Kentucky location for GPS
    [0n, 0n], // Password - no location needed
    [0n, 0n], // Quiz - no location needed
    [0n, 0n], // Markdown - no location needed
  ];
  
  const stepRadii = [50n, 0n, 0n, 0n]; // Only GPS needs radius
  
  // Step clues (hashed based on unlock type)
  const stepClues = [
    keccak256(toUtf8Bytes("GPS_LOCATION")), // GPS placeholder
    keccak256(toUtf8Bytes("secret123")), // Password hash
    keccak256(toUtf8Bytes("paris")), // Quiz answer hash (lowercase)
    keccak256(toUtf8Bytes("# Congratulations!\n\nYou've completed the adventure!")), // Markdown content hash
  ];
  
  const stepTitles = [
    "Find the Secret Location",
    "Enter the Magic Password",
    "Answer the Question",
    "Read the Final Message"
  ];
  
  const chainTitle = "Mixed Unlock Types Adventure";
  const expiryTime = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  const chainMetadata = keccak256(toUtf8Bytes("Test chain with mixed unlock types"));

  console.log("\n📝 Creating chain with mixed unlock types:");
  console.log("- Step 1: GPS Location (Kentucky)");
  console.log("- Step 2: Password (secret123)");
  console.log("- Step 3: Quiz (Q: Capital of France? A: paris)");
  console.log("- Step 4: Markdown Message");
  console.log(`- Total GGT: ${ethers.formatUnits(totalAmount, 18)}`);

  // Check current balance
  const balance = await ggtToken.balanceOf(signer.address);
  console.log(`\n💰 Current GGT balance: ${ethers.formatUnits(balance, 18)}`);

  if (balance < totalAmount) {
    console.error("❌ Insufficient GGT balance!");
    return;
  }

  // Approve tokens
  console.log("\n🔓 Approving GGT tokens...");
  const approveTx = await ggtToken.approve(GGT_CHAIN_ESCROW_ADDRESS, totalAmount);
  await approveTx.wait();
  console.log("✅ Tokens approved!");

  // Create the chain
  console.log("\n🔗 Creating multi-step chain...");
  const createTx = await chainEscrow.createGiftChain(
    recipient,
    stepValues,
    stepLocations,
    stepRadii,
    stepTypes,
    stepClues,
    stepTitles,
    chainTitle,
    expiryTime,
    chainMetadata
  );

  const receipt = await createTx.wait();
  console.log("✅ Chain created! Transaction:", receipt.hash);

  // Parse the ChainCreated event to get the chain ID
  const chainCreatedEvent = receipt.logs.find((log: any) => {
    try {
      const parsed = chainEscrow.interface.parseLog(log);
      return parsed?.name === "ChainCreated";
    } catch {
      return false;
    }
  });

  if (chainCreatedEvent) {
    const parsed = chainEscrow.interface.parseLog(chainCreatedEvent);
    const chainId = parsed?.args?.chainId;
    console.log(`\n🎉 Chain ID: ${chainId}`);
    console.log(`📍 Share this URL: http://localhost:3000/chain/${chainId}`);
    
    // Get chain details
    const chainData = await chainEscrow.getChain(chainId);
    console.log("\n📊 Chain Details:");
    console.log(`- Recipient: ${chainData.recipient}`);
    console.log(`- Total Steps: ${chainData.totalSteps}`);
    console.log(`- Total Value: ${ethers.formatUnits(chainData.totalValue, 18)} GGT`);
    console.log(`- Current Step: ${chainData.currentStep}`);
    
    // Get step details
    const steps = await chainEscrow.getChainSteps(chainId);
    console.log("\n📋 Step Details:");
    steps.forEach((step: any, index: number) => {
      const typeNames = ["GPS", "Video", "Image", "Markdown", "Quiz", "Password", "URL"];
      console.log(`\nStep ${index + 1}: ${stepTitles[index]}`);
      console.log(`- Type: ${typeNames[step.stepType]}`);
      console.log(`- Reward: ${ethers.formatUnits(step.rewardAmount, 18)} GGT`);
      console.log(`- Completed: ${step.completed}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });