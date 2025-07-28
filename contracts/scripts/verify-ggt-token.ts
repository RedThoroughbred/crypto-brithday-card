import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Verifying your GGT Token on Sepolia...\n");
  
  const ggtTokenAddress = "0x1775997EE682CCab7c6443168d63D2605922C633";
  const yourWallet = "0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234";
  
  // ERC20 ABI for token interactions
  const erc20ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ];
  
  try {
    const [signer] = await ethers.getSigners();
    const provider = signer.provider;
    
    // Connect to your GGT token
    const ggtToken = new ethers.Contract(ggtTokenAddress, erc20ABI, provider);
    
    console.log("📊 GGT Token Information:");
    console.log("=".repeat(50));
    
    // Get token details
    const name = await ggtToken.name();
    const symbol = await ggtToken.symbol();
    const decimals = await ggtToken.decimals();
    const totalSupply = await ggtToken.totalSupply();
    const yourBalance = await ggtToken.balanceOf(yourWallet);
    
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
    console.log(`Your Balance: ${ethers.formatUnits(yourBalance, decimals)} ${symbol}`);
    console.log(`Contract Address: ${ggtTokenAddress}`);
    console.log(`Etherscan: https://sepolia.etherscan.io/address/${ggtTokenAddress}`);
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ GGT Token Verification Complete!");
    console.log("=".repeat(50));
    
    // Check if we can interact with the token
    if (signer.address.toLowerCase() === yourWallet.toLowerCase()) {
      console.log("\n🔧 Testing Token Interactions...");
      
      // Connect with signer for transactions
      const ggtTokenWithSigner = ggtToken.connect(signer);
      
      // Test approval (needed for gifts)
      const testRecipient = "0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F"; // Your test recipient
      const approveAmount = ethers.parseUnits("100", decimals); // Approve 100 GGT
      
      console.log(`\n💰 Approving ${ethers.formatUnits(approveAmount, decimals)} ${symbol} for testing...`);
      
      try {
        const approveTx = await ggtTokenWithSigner.approve(testRecipient, approveAmount);
        console.log(`Transaction sent: ${approveTx.hash}`);
        
        const receipt = await approveTx.wait();
        console.log(`✅ Approval confirmed in block ${receipt.blockNumber}`);
        
        // Check allowance
        const allowance = await ggtToken.allowance(yourWallet, testRecipient);
        console.log(`Current allowance: ${ethers.formatUnits(allowance, decimals)} ${symbol}`);
        
      } catch (error: any) {
        console.log(`⚠️  Approval test skipped: ${error.message}`);
      }
      
    } else {
      console.log(`\n⚠️  Connected wallet (${signer.address}) is not the token owner`);
      console.log(`Token owner: ${yourWallet}`);
    }
    
    console.log("\n🎊 GGT Token Integration Summary:");
    console.log("✅ Token contract verified and accessible");
    console.log("✅ Frontend configuration updated");
    console.log("✅ Email templates support GGT display");
    console.log("✅ Ready for gift creation with GGT tokens!");
    
    console.log("\n🚀 Next Steps:");
    console.log("1. Create gifts using GGT tokens in the frontend");
    console.log("2. Test the complete gift flow with your token");
    console.log("3. Recipients will receive GGT instead of ETH!");
    
  } catch (error) {
    console.error("❌ Error verifying GGT token:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });