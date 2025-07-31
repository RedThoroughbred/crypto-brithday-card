const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying GSN-enabled GeoGift contracts...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
  
  // GSN Trusted Forwarder addresses - using raw strings to avoid checksum issues
  const TRUSTED_FORWARDER_ADDRESSES = {
    sepolia: "0xB2b5841DBeF766d4b521221732F9B618fCf34166", // GSN v3 Sepolia
    mainnet: "0xAa3E82b4c4093b4bA13Cb5714382C99ADBf750cA", // GSN v3 Mainnet
  };
  
  const trustedForwarder = TRUSTED_FORWARDER_ADDRESSES[network.name] || TRUSTED_FORWARDER_ADDRESSES.sepolia;
  console.log("🔗 Using Trusted Forwarder:", trustedForwarder);
  
  // GSN RelayHub addresses
  const RELAY_HUB_ADDRESSES = {
    sepolia: "0x3232f21A6E08312654270c78A773f00dd61d60f5", // GSN v3 Sepolia
    mainnet: "0x40bE3f9D43DbdadE162F04CC97A29603D88F50E4", // GSN v3 Mainnet
  };
  
  const relayHub = RELAY_HUB_ADDRESSES[network.name] || RELAY_HUB_ADDRESSES.sepolia;
  console.log("🏢 Using RelayHub:", relayHub);
  
  try {
    // Step 1: Deploy NewUserGiftEscrowSimple
    console.log("\n📦 Deploying NewUserGiftEscrowSimple...");
    const NewUserGiftEscrowSimple = await ethers.getContractFactory("NewUserGiftEscrowSimple");
    const escrowContract = await NewUserGiftEscrowSimple.deploy();
    await escrowContract.waitForDeployment();
    
    const escrowAddress = await escrowContract.getAddress();
    console.log("✅ NewUserGiftEscrowSimple deployed to:", escrowAddress);
    
    // Step 2: Deploy SimpleGSNPaymaster
    console.log("\n📦 Deploying SimpleGSNPaymaster...");
    const GeoGiftPaymaster = await ethers.getContractFactory("SimpleGSNPaymaster");
    const paymasterContract = await GeoGiftPaymaster.deploy(
      relayHub,
      trustedForwarder,
      escrowContract.target || escrowContract.address
    );
    await paymasterContract.waitForDeployment();
    
    const paymasterAddress = await paymasterContract.getAddress();
    console.log("✅ SimpleGSNPaymaster deployed to:", paymasterAddress);
    
    // Step 3: Wait for confirmations
    console.log("\n⏳ Waiting for confirmations...");
    await escrowContract.deploymentTransaction().wait(5);
    await paymasterContract.deploymentTransaction().wait(5);
    
    // Step 4: Fund the paymaster with initial ETH (0.1 ETH)
    console.log("\n💰 Funding paymaster with initial ETH...");
    const fundAmount = ethers.parseEther("0.1");
    const fundTx = await paymasterContract.fundPaymaster({ value: fundAmount });
    await fundTx.wait();
    console.log("✅ Paymaster funded with 0.1 ETH");
    
    // Step 5: Display deployment summary
    console.log("\n🎉 GSN Deployment Complete!");
    console.log("================================");
    console.log("NewUserGiftEscrowSimple:", escrowAddress);
    console.log("SimpleGSNPaymaster:", paymasterAddress);
    console.log("Trusted Forwarder:", trustedForwarder);
    console.log("RelayHub:", relayHub);
    console.log("Network:", network.name);
    console.log("================================");
    
    // Step 6: Verification instructions
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\n📝 Verification commands:");
      console.log(`npx hardhat verify --network ${network.name} ${escrowAddress} "${trustedForwarder}"`);
      console.log(`npx hardhat verify --network ${network.name} ${paymasterAddress} "${relayHub}" "${trustedForwarder}" "${escrowAddress}"`);
    }
    
    // Step 7: Frontend configuration
    console.log("\n🔧 Frontend Configuration:");
    console.log("Add to frontend/lib/gsn-config.ts:");
    console.log(`export const GSN_CONFIG = {`);
    console.log(`  escrowAddress: "${escrowAddress}",`);
    console.log(`  paymasterAddress: "${paymasterAddress}",`);
    console.log(`  trustedForwarder: "${trustedForwarder}",`);
    console.log(`  relayHubAddress: "${relayHub}",`);
    console.log(`  network: "${network.name}"`);
    console.log(`};`);
    
    // Step 8: Usage instructions
    console.log("\n📋 Next Steps:");
    console.log("1. Update frontend configuration with deployed addresses");
    console.log("2. Test gasless gift claiming with GSN provider");
    console.log("3. Monitor paymaster balance and refund as needed");
    console.log("4. Consider setting up your own relay server for production");
    
    return {
      escrowAddress,
      paymasterAddress,
      trustedForwarder,
      relayHub,
      network: network.name
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Function to fund paymaster separately
async function fundPaymaster(paymasterAddress, amount = "0.1") {
  console.log(`💰 Funding paymaster ${paymasterAddress} with ${amount} ETH...`);
  
  const [deployer] = await ethers.getSigners();
  const paymaster = await ethers.getContractAt("GeoGiftPaymaster", paymasterAddress);
  
  const fundAmount = ethers.parseEther(amount);
  const fundTx = await paymaster.fundPaymaster({ value: fundAmount });
  await fundTx.wait();
  
  const balance = await paymaster.getPaymasterBalance();
  console.log(`✅ Paymaster funded! New balance: ${ethers.formatEther(balance)} ETH`);
}

// Export functions for use in other scripts
module.exports = {
  main,
  fundPaymaster
};

// Run deployment if this script is executed directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n✨ GSN Deployment successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ GSN Deployment failed:", error);
      process.exit(1);
    });
}