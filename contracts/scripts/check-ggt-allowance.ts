import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking GGT Allowance");
  console.log("=========================");

  const GGT_TOKEN_ADDRESS = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const GGT_CHAIN_ESCROW_ADDRESS = "0x3c7B305fa9b36b9848E4C705c1e4Ec27c9568e1e";
  
  const [signer] = await ethers.getSigners();
  console.log("Checking for wallet:", signer.address);
  console.log("");

  // Get contracts
  const ggtToken = await ethers.getContractAt("src/GGTLocationEscrow.sol:IERC20", GGT_TOKEN_ADDRESS);

  // Check balance and allowance
  const balance = await ggtToken.balanceOf(signer.address);
  const allowance = await ggtToken.allowance(signer.address, GGT_CHAIN_ESCROW_ADDRESS);

  console.log("📊 Current State:");
  console.log("GGT Balance:", ethers.formatUnits(balance, 18), "GGT");
  console.log("Chain Escrow Allowance:", ethers.formatUnits(allowance, 18), "GGT");
  console.log("");
  
  const requiredAmount = ethers.parseUnits("50", 18);
  console.log("Required for chain:", ethers.formatUnits(requiredAmount, 18), "GGT");
  console.log("Allowance sufficient?", allowance >= requiredAmount);
  
  console.log("=========================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});