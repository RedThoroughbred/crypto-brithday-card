import { ethers } from "hardhat";

async function main() {
  console.log("🔗 Creating Test GGT Chain");
  console.log("==========================");

  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const GGT_CHAIN_ESCROW_ADDRESS = "0x3c7B305fa9b36b9848E4C705c1e4Ec27c9568e1e";
  
  // Your second wallet (recipient)
  const RECIPIENT = "0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F";
  
  const [signer] = await ethers.getSigners();
  console.log("Creating chain from:", signer.address);
  console.log("Recipient:", RECIPIENT);
  console.log("");

  // Get contracts
  const ggtToken = await ethers.getContractAt("src/GGTLocationEscrow.sol:IERC20", GGT_TOKEN_ADDRESS);
  const chainEscrow = await ethers.getContractAt("GGTLocationChainEscrow", GGT_CHAIN_ESCROW_ADDRESS);

  // Check GGT balance
  const balance = await ggtToken.balanceOf(signer.address);
  console.log("Current GGT balance:", ethers.formatUnits(balance, 18), "GGT");

  // Chain details - 3-step Kentucky adventure
  const stepValues = [
    ethers.parseUnits("10", 18),  // Step 1: 10 GGT
    ethers.parseUnits("15", 18),  // Step 2: 15 GGT  
    ethers.parseUnits("25", 18)   // Step 3: 25 GGT (total: 50 GGT)
  ];

  const stepLocations = [
    [Math.floor(38.879666 * 1_000_000), Math.floor(-84.616383 * 1_000_000)], // Kentucky location 1
    [Math.floor(38.879712 * 1_000_000), Math.floor(-84.616608 * 1_000_000)], // Kentucky location 2  
    [Math.floor(38.879788 * 1_000_000), Math.floor(-84.616540 * 1_000_000)]  // Kentucky location 3
  ];

  const stepRadii = [100, 150, 200]; // Increasing radius for each step

  const stepUnlockTypes = [0, 0, 0]; // All GPS for now (0 = GPS)

  const stepMessages = [
    ethers.keccak256(ethers.toUtf8Bytes("Welcome to your GGT adventure! Find the first location.")),
    ethers.keccak256(ethers.toUtf8Bytes("Great job! Now find the second spot nearby.")),
    ethers.keccak256(ethers.toUtf8Bytes("Final step! Claim your biggest reward here."))
  ];

  const stepTitles = [
    "Adventure Begins",
    "Getting Closer", 
    "Grand Finale"
  ];

  const chainTitle = "Kentucky GGT Adventure";
  const chainExpiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
  const chainMetadata = ethers.keccak256(ethers.toUtf8Bytes("First GGT chain test"));

  const totalValue = ethers.parseUnits("50", 18);
  console.log("Total chain value:", ethers.formatUnits(totalValue, 18), "GGT");
  console.log("Chain steps:", stepValues.length);
  console.log("");

  // Step 1: Approve GGT tokens
  console.log("📝 Step 1: Approving GGT tokens...");
  const approveTx = await ggtToken.approve(GGT_CHAIN_ESCROW_ADDRESS, totalValue);
  console.log("Approval transaction:", approveTx.hash);
  await approveTx.wait();
  console.log("✅ GGT tokens approved");
  console.log("");

  // Step 2: Create chain
  console.log("🔗 Step 2: Creating gift chain...");
  
  // Double-check allowance before creating chain
  const finalAllowance = await ggtToken.allowance(signer.address, GGT_CHAIN_ESCROW_ADDRESS);
  console.log("Final allowance check:", ethers.formatUnits(finalAllowance, 18), "GGT");
  
  const createTx = await chainEscrow.createGiftChain(
    RECIPIENT,
    stepValues,
    stepLocations,
    stepRadii,
    stepUnlockTypes,
    stepMessages,
    stepTitles,
    chainTitle,
    chainExpiryTime,
    chainMetadata
  );

  console.log("Create chain transaction:", createTx.hash);
  const receipt = await createTx.wait();
  console.log("✅ Chain created successfully!");

  // Get the chain ID from events
  const createEvent = receipt.logs.find(log => {
    try {
      const parsed = chainEscrow.interface.parseLog(log);
      return parsed?.name === 'ChainCreated';
    } catch {
      return false;
    }
  });

  if (createEvent) {
    const parsed = chainEscrow.interface.parseLog(createEvent);
    const chainId = parsed?.args?.chainId;
    
    console.log("");
    console.log("==========================");
    console.log("🎯 GGT CHAIN CREATED!");
    console.log("==========================");
    console.log("Chain ID:", chainId?.toString());
    console.log("Total Value:", ethers.formatUnits(totalValue, 18), "GGT");
    console.log("Steps:", stepValues.length);
    console.log("Recipient:", RECIPIENT);
    console.log("");
    console.log("🔗 Chain URL (frontend):");
    console.log("http://localhost:3000/chain/" + chainId);
    console.log("");
    console.log("📍 Step Locations:");
    for (let i = 0; i < stepLocations.length; i++) {
      const lat = Number(stepLocations[i][0]) / 1_000_000;
      const lon = Number(stepLocations[i][1]) / 1_000_000;
      console.log(`Step ${i + 1}: ${lat}, ${lon} (${stepRadii[i]}m radius, ${ethers.formatUnits(stepValues[i], 18)} GGT)`);
    }
    console.log("");
    console.log("✅ Ready to test multi-step claiming!");
  }

  console.log("==========================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});