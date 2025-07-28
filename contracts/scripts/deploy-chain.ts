import { ethers, run, network } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Deploying LocationChainEscrow contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Get fee recipient from environment or use deployer
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  console.log("💸 Fee recipient:", feeRecipient);
  
  // Deploy contract
  console.log("⚙️  Deploying LocationChainEscrow...");
  const LocationChainEscrow = await ethers.getContractFactory("LocationChainEscrow");
  const chainEscrow = await LocationChainEscrow.deploy(feeRecipient);
  
  await chainEscrow.waitForDeployment();
  const contractAddress = await chainEscrow.getAddress();
  
  console.log("✅ LocationChainEscrow deployed to:", contractAddress);
  console.log("🔗 Network:", network.name);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: contractAddress,
    feeRecipient: feeRecipient,
    deployer: deployer.address,
    deploymentBlock: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    chainId: await ethers.provider.getNetwork().then(n => n.chainId),
    transactionHash: chainEscrow.deploymentTransaction()?.hash
  };
  
  // Create deployments directory if it doesn't exist
  try {
    mkdirSync(join(__dirname, "../deployments"), { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  // Save deployment info to file
  const deploymentFile = join(__dirname, `../deployments/${network.name}-chain.json`);
  writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
  console.log("📄 Deployment info saved to:", deploymentFile);
  
  // Wait for a few confirmations before verification
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("⏳ Waiting for block confirmations...");
    await chainEscrow.deploymentTransaction()?.wait(6);
    
    // Verify contract on Etherscan/Polygonscan
    console.log("🔍 Verifying contract...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [feeRecipient],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error: any) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("✅ Contract already verified!");
      } else {
        console.log("❌ Verification failed:", error.message);
      }
    }
  }
  
  // Display summary
  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network.name);
  console.log("Fee Recipient:", feeRecipient);
  console.log("Deployer:", deployer.address);
  console.log("Transaction Hash:", chainEscrow.deploymentTransaction()?.hash);
  
  if (network.name === "polygon" || network.name === "mumbai") {
    const explorerUrl = network.name === "polygon" 
      ? "https://polygonscan.com"
      : "https://mumbai.polygonscan.com";
    console.log("🔗 Block Explorer:", `${explorerUrl}/address/${contractAddress}`);
  } else if (network.name === "sepolia") {
    console.log("🔗 Block Explorer:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  } else if (network.name === "mainnet") {
    console.log("🔗 Block Explorer:", `https://etherscan.io/address/${contractAddress}`);
  }
  
  return {
    contractAddress,
    deploymentInfo
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });