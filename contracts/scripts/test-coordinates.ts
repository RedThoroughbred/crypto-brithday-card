import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing Different Coordinate Variations");
  console.log("==================================================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  const GIFT_ID = 1;

  // Get contract instance
  const ggtEscrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Get the exact gift coordinates
  const gift = await ggtEscrow.getGift(GIFT_ID);
  const targetLat = Number(gift.latitude) / 1_000_000;
  const targetLon = Number(gift.longitude) / 1_000_000;
  
  console.log("🎯 Target coordinates from contract:");
  console.log(`Latitude: ${targetLat}`);
  console.log(`Longitude: ${targetLon}`);
  console.log(`Radius: ${gift.radius} meters`);
  console.log("");

  // Test various coordinate combinations
  const testCoordinates = [
    { lat: 37.7749, lon: -122.4194, desc: "Original values" },
    { lat: 37.774900, lon: -122.419400, desc: "6 decimal places" },
    { lat: 37.77490, lon: -122.41940, desc: "5 decimal places" },
    { lat: 37.7749, lon: -122.4194, desc: "4 decimal places" },
    { lat: targetLat, lon: targetLon, desc: "Exact contract values" },
    { lat: 37.774901, lon: -122.419401, desc: "Slightly higher" },
    { lat: 37.774899, lon: -122.419399, desc: "Slightly lower" },
  ];

  console.log("🧮 Testing distance calculations:");
  console.log("==================================================");

  for (const coord of testCoordinates) {
    // Convert to contract format for testing
    const contractLat = BigInt(Math.floor(coord.lat * 1_000_000));
    const contractLon = BigInt(Math.floor(coord.lon * 1_000_000));
    
    try {
      // Calculate distance using contract's method
      const distance = await ggtEscrow.calculateDistance(
        gift.latitude,
        gift.longitude,
        contractLat,
        contractLon
      );
      
      const distanceMeters = Number(distance);
      const withinRadius = distanceMeters <= Number(gift.radius);
      
      console.log(`📍 ${coord.desc}:`);
      console.log(`   Input: ${coord.lat}, ${coord.lon}`);
      console.log(`   Contract format: ${contractLat}, ${contractLon}`);
      console.log(`   Distance: ${distanceMeters}m`);
      console.log(`   Within radius: ${withinRadius ? '✅ YES' : '❌ NO'}`);
      console.log("");
      
    } catch (error) {
      console.log(`❌ Error testing ${coord.desc}:`, error.message);
      console.log("");
    }
  }

  console.log("🎯 RECOMMENDATIONS:");
  console.log("Try these coordinates in order of likelihood to work:");
  console.log(`1. ${targetLat}, ${targetLon} (exact contract values)`);
  console.log("2. 37.774900, -122.419400 (6 decimal places)");
  console.log("3. 37.77490, -122.41940 (5 decimal places)");
  console.log("4. 37.7749, -122.4194 (4 decimal places)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});