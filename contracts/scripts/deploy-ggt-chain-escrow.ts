import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying GGTLocationChainEscrow Contract");
  console.log("=============================================");

  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  console.log("GGT Token:", GGT_TOKEN_ADDRESS);
  console.log("");

  // Deploy the contract
  console.log("📄 Deploying GGTLocationChainEscrow...");
  const GGTLocationChainEscrow = await ethers.getContractFactory("GGTLocationChainEscrow");
  const contract = await GGTLocationChainEscrow.deploy(GGT_TOKEN_ADDRESS);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ GGTLocationChainEscrow deployed!");
  console.log("Contract address:", contractAddress);
  console.log("Transaction hash:", contract.deploymentTransaction()?.hash);
  console.log("");

  // Verify the contract is working
  console.log("🔍 Verifying contract...");
  const ggtToken = await contract.ggtToken();
  const owner = await contract.owner();
  const paused = await contract.paused();

  console.log("GGT Token:", ggtToken);
  console.log("Owner:", owner);
  console.log("Paused:", paused);
  console.log("");

  console.log("🌐 Contract URLs:");
  console.log("Sepolia Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log("");

  console.log("📋 Next Steps:");
  console.log("1. Update frontend contracts.ts with new address");
  console.log("2. Create test chain script");
  console.log("3. Add chain creation UI");
  console.log("");

  console.log("🎯 Contract Address for frontend:");
  console.log(`export const GGT_CHAIN_ESCROW_ADDRESS = "${contractAddress}" as Address;`);

  console.log("=============================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});