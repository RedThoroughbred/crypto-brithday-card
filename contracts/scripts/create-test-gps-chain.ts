import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Creating Test GPS Chain for Distance Verification");
  
  // Contract addresses
  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const GGT_CHAIN_ESCROW_ADDRESS = "0x978ae71146cd4BfBe7FE3B1F72542168984F0fED";
  
  // Get signers
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Test Details:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   GGT Token: ${GGT_TOKEN_ADDRESS}`);
  console.log(`   Chain Escrow: ${GGT_CHAIN_ESCROW_ADDRESS}`);
  
  // Get contract instances
  const ggtToken = await ethers.getContractAt("src/GGTLocationChainEscrow.sol:IERC20", GGT_TOKEN_ADDRESS);
  const chainEscrow = await ethers.getContractAt("GGTLocationChainEscrow", GGT_CHAIN_ESCROW_ADDRESS);
  
  // Check GGT balance
  const balance = await ggtToken.balanceOf(deployer.address);
  console.log(`   GGT Balance: ${ethers.formatEther(balance)} GGT`);
  
  // Test GPS coordinates (NYC area for easy testing)
  const testChain = {
    recipient: deployer.address, // Self-recipient for easy testing
    title: "GPS Distance Test Chain",
    expiryTime: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    steps: [
      {
        title: "Times Square",
        message: "Head to the heart of NYC - the crossroads of the world!",
        latitude: 40.7580, // Times Square
        longitude: -73.9855,
        radius: 100, // 100 meter radius
        value: "1000", // 1000 GGT
        unlockType: 0 // GPS
      },
      {
        title: "Central Park",
        message: "Find the peaceful oasis in the concrete jungle.",
        latitude: 40.7825, // Central Park (Bethesda Fountain)
        longitude: -73.9734,
        radius: 200, // 200 meter radius  
        value: "1500", // 1500 GGT
        unlockType: 0 // GPS
      }
    ]
  };
  
  // Prepare contract parameters
  const stepValues = testChain.steps.map(step => ethers.parseEther(step.value));
  const totalValue = stepValues.reduce((sum, val) => sum + val, 0n);
  
  const stepLocations = testChain.steps.map(step => [
    Math.floor(step.latitude * 1_000_000), // Scale to 1e6 precision
    Math.floor(step.longitude * 1_000_000)
  ]);
  
  const stepRadii = testChain.steps.map(step => step.radius);
  const stepTypes = testChain.steps.map(step => step.unlockType);
  const stepMessages = testChain.steps.map(step => step.message);
  const stepTitles = testChain.steps.map(step => step.title);
  const stepUnlockData = testChain.steps.map(() => ethers.ZeroHash); // No unlock data for GPS
  
  console.log("\n🏗️  Creating GPS Test Chain:");
  console.log(`   Total Value: ${ethers.formatEther(totalValue)} GGT`);
  console.log(`   Steps: ${testChain.steps.length}`);
  
  testChain.steps.forEach((step, i) => {
    console.log(`   Step ${i + 1}: ${step.title}`);
    console.log(`      Location: ${step.latitude}, ${step.longitude}`);
    console.log(`      Radius: ${step.radius}m`);
    console.log(`      Value: ${step.value} GGT`);
    console.log(`      Clue: ${step.message}`);
  });
  
  try {
    // Step 1: Approve GGT tokens
    console.log("\n💰 Step 1: Approving GGT tokens...");
    const approveTx = await ggtToken.approve(GGT_CHAIN_ESCROW_ADDRESS, totalValue);
    await approveTx.wait();
    console.log("   ✅ GGT tokens approved");
    
    // Step 2: Create chain
    console.log("\n🔗 Step 2: Creating GPS test chain...");
    const createTx = await chainEscrow.createGiftChain(
      testChain.recipient,
      stepValues,
      stepLocations,
      stepRadii,
      stepTypes,
      stepUnlockData,
      stepMessages,
      stepTitles,
      testChain.title,
      testChain.expiryTime,
      ethers.ZeroHash // metadata
    );
    
    const receipt = await createTx.wait();
    console.log("   ✅ GPS test chain created!");
    console.log(`   Transaction: ${receipt?.hash}`);
    
    // Extract chain ID from events
    let chainId = null;
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsed = chainEscrow.interface.parseLog(log);
          if (parsed?.name === 'ChainCreated') {
            chainId = parsed.args.chainId.toString();
            break;
          }
        } catch (e) {
          // Skip unparseable logs
        }
      }
    }
    
    console.log(`   🎯 Chain ID: ${chainId || 'Could not extract'}`);
    
    // Get chain details for verification
    if (chainId) {
      console.log("\n🔍 Chain Verification:");
      const chainDetails = await chainEscrow.getChain(chainId);
      console.log(`   Title: ${chainDetails.chainTitle}`);
      console.log(`   Total Steps: ${chainDetails.totalSteps}`);
      console.log(`   Total Value: ${ethers.formatEther(chainDetails.totalValue)} GGT`);
      console.log(`   Current Step: ${chainDetails.currentStep}`);
      console.log(`   Recipient: ${chainDetails.recipient}`);
      
      // Test distance calculation
      console.log("\n📐 Testing Distance Calculation:");
      const step0 = await chainEscrow.chainSteps(chainId, 0);
      console.log(`   Step 0 Location: ${step0.latitude}, ${step0.longitude}`);
      console.log(`   Step 0 Radius: ${step0.radius} meters`);
      
      // Test distance from a known location (slightly off Times Square)
      const testLat = Math.floor(40.7570 * 1_000_000); // 110m south of Times Square
      const testLng = Math.floor(-73.9855 * 1_000_000); // Same longitude
      
      const distance = await chainEscrow.calculateDistance(
        step0.latitude,
        step0.longitude,
        testLat,
        testLng
      );
      
      console.log(`   📍 Distance from test point: ${distance} meters`);
      console.log(`   🎯 Should ${distance <= step0.radius ? 'ALLOW' : 'REJECT'} claim (radius: ${step0.radius}m)`);
      
      console.log("\n🌐 Frontend URLs:");
      console.log(`   Chain URL: http://localhost:3000/chain/${chainId}`);
      console.log(`   Direct Link: /chain/${chainId}`);
    }
    
  } catch (error) {
    console.error("❌ Error creating GPS test chain:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });