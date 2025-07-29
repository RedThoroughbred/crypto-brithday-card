import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking Latest GGT Gift");
  console.log("===========================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  
  const [signer] = await ethers.getSigners();
  console.log("Checking with wallet:", signer.address);

  // Get contract
  const escrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Get next gift ID (this tells us the latest ID)
  const nextGiftId = await escrow.nextGiftId();
  const latestGiftId = Number(nextGiftId) - 1;
  
  console.log("Next Gift ID:", nextGiftId.toString());
  console.log("Latest Gift ID:", latestGiftId);
  console.log("");

  if (latestGiftId >= 1) {
    try {
      const gift = await escrow.getGift(latestGiftId);
      
      console.log("📋 Latest Gift Details:");
      console.log("Gift ID:", latestGiftId);
      console.log("Giver:", gift.giver);
      console.log("Recipient:", gift.recipient);
      console.log("Amount:", ethers.formatUnits(gift.amount, 18), "GGT");
      console.log("Location:", Number(gift.latitude) / 1_000_000, ",", Number(gift.longitude) / 1_000_000);
      console.log("Radius:", gift.radius.toString(), "meters");
      console.log("Claimed:", gift.claimed);
      console.log("Exists:", gift.exists);
      console.log("");
      console.log("🔗 Correct URLs:");
      console.log("Gift URL:  http://localhost:3000/gift/" + latestGiftId);
      console.log("Claim URL: http://localhost:3000/claim?id=" + latestGiftId + "&type=ggt");
      
    } catch (error) {
      console.log("❌ Error reading gift:", error);
    }
  } else {
    console.log("No gifts found");
  }

  console.log("===========================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});