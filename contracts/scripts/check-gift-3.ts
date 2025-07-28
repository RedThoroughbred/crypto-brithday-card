import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1";
  const LocationEscrow = await ethers.getContractFactory("LocationEscrow");
  const escrow = LocationEscrow.attach(contractAddress);
  
  const gift = await escrow.gifts(3);
  console.log("🎁 Gift #3 Details:");
  console.log("Raw expiry time:", gift.expiryTime.toString());
  console.log("Expiry timestamp (seconds):", Number(gift.expiryTime));
  console.log("Expiry date:", new Date(Number(gift.expiryTime) * 1000));
  console.log("Current time:", new Date());
  console.log("Is expired?", Date.now() > Number(gift.expiryTime) * 1000);
  
  // Also check coordinates
  console.log("\n📍 Location data:");
  console.log("Raw latitude:", gift.latitude.toString());
  console.log("Raw longitude:", gift.longitude.toString());
  console.log("Converted lat:", Number(gift.latitude) / 1e6);
  console.log("Converted lng:", Number(gift.longitude) / 1e6);
}

main().catch(console.error);