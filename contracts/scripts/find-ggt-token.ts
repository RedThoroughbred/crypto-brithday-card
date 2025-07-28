import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Searching for GGT token deployed by your wallet...\n");
  
  const [signer] = await ethers.getSigners();
  const provider = signer.provider;
  
  const yourWallet = "0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234";
  
  console.log(`Searching for contracts deployed by: ${yourWallet}`);
  console.log(`Current network: ${(await provider.getNetwork()).name}\n`);
  
  // Get the latest block number
  const latestBlock = await provider.getBlockNumber();
  console.log(`Latest block: ${latestBlock}`);
  
  // Search recent blocks for contract deployments from your address
  console.log("🔄 Scanning recent transactions...\n");
  
  let foundContracts = [];
  
  // Search the last 1000 blocks (adjust if needed)
  const blocksToSearch = Math.min(1000, latestBlock);
  const startBlock = latestBlock - blocksToSearch;
  
  for (let i = startBlock; i <= latestBlock; i++) {
    try {
      const block = await provider.getBlock(i, true);
      
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.from?.toLowerCase() === yourWallet.toLowerCase() && tx.to === null) {
            // This is a contract deployment
            const receipt = await provider.getTransactionReceipt(tx.hash);
            
            if (receipt && receipt.contractAddress) {
              console.log(`📦 Found contract deployment:`);
              console.log(`   Address: ${receipt.contractAddress}`);
              console.log(`   Block: ${receipt.blockNumber}`);
              console.log(`   TX Hash: ${receipt.transactionHash}`);
              
              // Try to determine if it's an ERC20 token
              try {
                const contract = new ethers.Contract(
                  receipt.contractAddress,
                  [
                    "function name() view returns (string)",
                    "function symbol() view returns (string)",
                    "function decimals() view returns (uint8)",
                    "function totalSupply() view returns (uint256)"
                  ],
                  provider
                );
                
                const name = await contract.name();
                const symbol = await contract.symbol();
                const decimals = await contract.decimals();
                const totalSupply = await contract.totalSupply();
                
                console.log(`   📊 Token Info:`);
                console.log(`      Name: ${name}`);
                console.log(`      Symbol: ${symbol}`);
                console.log(`      Decimals: ${decimals}`);
                console.log(`      Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
                
                foundContracts.push({
                  address: receipt.contractAddress,
                  name,
                  symbol,
                  decimals,
                  totalSupply: ethers.formatUnits(totalSupply, decimals),
                  blockNumber: receipt.blockNumber,
                  txHash: receipt.transactionHash
                });
                
                // Check if this looks like your GGT token
                if (symbol === 'GGT' || name.toLowerCase().includes('geogift') || name.toLowerCase().includes('ggt')) {
                  console.log(`   🎯 THIS LOOKS LIKE YOUR GGT TOKEN! 🎯`);
                }
                
              } catch (tokenError) {
                console.log(`   ⚠️  Not an ERC20 token (or error reading): ${tokenError.message}`);
              }
              
              console.log("");
            }
          }
        }
      }
      
      // Progress indicator
      if (i % 100 === 0) {
        const progress = ((i - startBlock) / blocksToSearch * 100).toFixed(1);
        console.log(`   📈 Progress: ${progress}% (block ${i})`);
      }
      
    } catch (blockError) {
      // Skip blocks that can't be read
      continue;
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("🎯 SUMMARY");
  console.log("=".repeat(60));
  
  if (foundContracts.length === 0) {
    console.log("❌ No ERC20 tokens found in recent blocks.");
    console.log("\nThis could mean:");
    console.log("1. The token was deployed more than 1000 blocks ago");
    console.log("2. The token was deployed from a different address");
    console.log("3. There was an error reading the contracts");
    console.log("\n💡 Try checking Etherscan for your address:");
    console.log(`   https://sepolia.etherscan.io/address/${yourWallet}`);
  } else {
    console.log(`✅ Found ${foundContracts.length} token contract(s):`);
    
    foundContracts.forEach((contract, index) => {
      console.log(`\n${index + 1}. ${contract.name} (${contract.symbol})`);
      console.log(`   Address: ${contract.address}`);
      console.log(`   Supply: ${contract.totalSupply}`);
      console.log(`   Etherscan: https://sepolia.etherscan.io/address/${contract.address}`);
      
      if (contract.symbol === 'GGT' || contract.name.toLowerCase().includes('ggt')) {
        console.log(`   🎯 RECOMMENDED: Use this as your GGT token address!`);
      }
    });
    
    if (foundContracts.some(c => c.symbol === 'GGT')) {
      const ggtToken = foundContracts.find(c => c.symbol === 'GGT');
      console.log(`\n🚀 UPDATE YOUR CONFIG:`);
      console.log(`Replace the GGT_TOKEN address in /frontend/lib/tokens.ts with:`);
      console.log(`"${ggtToken.address}"`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });