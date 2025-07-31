const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying NewUserGiftEscrow contract...");
    
    // Get the contract factory
    const NewUserGiftEscrow = await ethers.getContractFactory("NewUserGiftEscrow");
    
    // Deploy the contract
    const newUserGiftEscrow = await NewUserGiftEscrow.deploy();
    
    // Wait for deployment to complete
    await newUserGiftEscrow.waitForDeployment();
    
    const contractAddress = await newUserGiftEscrow.getAddress();
    console.log("NewUserGiftEscrow deployed to:", contractAddress);
    
    // Verify contract on Etherscan (optional, for testnets)
    if (process.env.ETHERSCAN_API_KEY && network.name !== "hardhat") {
        console.log("Waiting for block confirmations...");
        await newUserGiftEscrow.deploymentTransaction().wait(5);
        
        console.log("Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [],
            });
            console.log("Contract verified successfully");
        } catch (error) {
            console.log("Verification failed:", error.message);
        }
    }
    
    // Test basic functionality
    console.log("\nTesting basic functionality...");
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    // Create a test claim hash
    const testClaimCode = "TEST-CLAIM-2025-ABC";
    const claimHash = ethers.keccak256(ethers.toUtf8Bytes(testClaimCode));
    console.log("Test claim code:", testClaimCode);
    console.log("Claim hash:", claimHash);
    
    // Test gift creation
    console.log("\nCreating test gift...");
    const giftAmount = ethers.parseEther("0.001"); // 0.001 ETH
    const expiryDays = 30;
    const message = "Welcome to crypto!";
    const unlockType = "simple";
    const unlockHash = ethers.ZeroHash;
    const unlockData = "";
    
    const tx = await newUserGiftEscrow.createNewUserGift(
        claimHash,
        expiryDays,
        message,
        unlockType,
        unlockHash,
        unlockData,
        { value: giftAmount }
    );
    
    const receipt = await tx.wait();
    console.log("Test gift created! Transaction hash:", receipt.hash);
    
    // Get the gift ID from the event
    const giftCreatedEvent = receipt.logs.find(log => {
        try {
            const decoded = newUserGiftEscrow.interface.parseLog(log);
            return decoded.name === "NewUserGiftCreated";
        } catch {
            return false;
        }
    });
    
    if (giftCreatedEvent) {
        const decodedEvent = newUserGiftEscrow.interface.parseLog(giftCreatedEvent);
        const giftId = decodedEvent.args.giftId;
        console.log("Gift ID:", giftId);
        
        // Test gift details retrieval
        const giftDetails = await newUserGiftEscrow.getGift(giftId);
        console.log("\nGift details:");
        console.log("- Sender:", giftDetails[0]);
        console.log("- Amount:", ethers.formatEther(giftDetails[1]), "ETH");
        console.log("- Expiry:", new Date(Number(giftDetails[2]) * 1000).toLocaleString());
        console.log("- Claimed:", giftDetails[3]);
        console.log("- Refunded:", giftDetails[4]);
        console.log("- Message:", giftDetails[5]);
        console.log("- Unlock Type:", giftDetails[6]);
        
        // Test claimability
        const isClaimable = await newUserGiftEscrow.isClaimable(giftId);
        console.log("- Is Claimable:", isClaimable);
    }
    
    console.log("\n✅ NewUserGiftEscrow deployment and testing completed!");
    console.log("📝 Contract Address:", contractAddress);
    console.log("🔗 Add this to your environment variables:");
    console.log(`NEXT_PUBLIC_NEW_USER_ESCROW_ADDRESS=${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });