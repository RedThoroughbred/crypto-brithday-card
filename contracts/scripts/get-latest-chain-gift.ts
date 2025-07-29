import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x4258C7c0c3CC0b66457d14714cec2785cbdaEa57";
  
  const contract = await ethers.getContractAt("LocationChainEscrow", contractAddress);
  
  // Get the next chain ID (which is the total count)
  const nextChainId = await contract.nextChainId();
  const latestChainId = nextChainId - 1n;
  
  if (latestChainId >= 0) {
    console.log(`Latest chain ID: ${latestChainId}`);
    
    // Get details of the latest chain
    const chain = await contract.chains(latestChainId);
    console.log("\nChain details:");
    console.log(`- Giver: ${chain.giver}`);
    console.log(`- Receiver: ${chain.recipient}`);
    console.log(`- Amount: ${ethers.formatEther(chain.totalValue)} ETH`);
    console.log(`- Claimed: ${chain.chainCompleted}`);
    
    console.log(`\nClaim URL: http://localhost:3000/claim-chain?id=${latestChainId}`);
  } else {
    console.log("No chains created yet");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});