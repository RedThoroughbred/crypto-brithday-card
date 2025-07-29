import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Finding Coordinates That Work With Contract's Distance Formula");
  console.log("==================================================");

  const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171";
  const GIFT_ID = 1;

  // Get contract instance
  const ggtEscrow = await ethers.getContractAt("GGTLocationEscrow", GGT_ESCROW_ADDRESS);

  // Get the target coordinates
  const gift = await ggtEscrow.getGift(GIFT_ID);
  const targetLat = Number(gift.latitude); // Keep as contract format (scaled by 1e6)
  const targetLon = Number(gift.longitude); // Keep as contract format (scaled by 1e6)
  
  console.log("🎯 Target (contract format):");
  console.log(`Latitude: ${targetLat} (${targetLat / 1_000_000})`);
  console.log(`Longitude: ${targetLon} (${targetLon / 1_000_000})`);
  console.log(`Radius: ${gift.radius} meters`);
  console.log("");

  // Test a range of coordinates around the target
  console.log("🧪 Testing coordinates near the target:");
  console.log("==================================================");

  const variations = [
    { lat: 37.7749, lon: -122.4194 },      // Original
    { lat: 37.774900, lon: -122.419400 },  // 6 decimals
    { lat: 37.77490, lon: -122.41940 },    // 5 decimals  
    { lat: 37.7749, lon: -122.4194 },      // 4 decimals
    { lat: 37.775, lon: -122.419 },        // 3 decimals
    { lat: 37.77, lon: -122.42 },          // 2 decimals
    { lat: 38, lon: -122 },                // 1 decimals
  ];

  let workingCoordinates = [];

  for (const coord of variations) {
    // Convert to contract format (multiply by 1e6 and floor)
    const contractLat = Math.floor(coord.lat * 1_000_000);
    const contractLon = Math.floor(coord.lon * 1_000_000);
    
    try {
      // Calculate distance using contract's method
      const distance = await ggtEscrow.calculateDistance(
        BigInt(targetLat),
        BigInt(targetLon), 
        BigInt(contractLat),
        BigInt(contractLon)
      );
      
      const distanceMeters = Number(distance);
      const withinRadius = distanceMeters <= Number(gift.radius);
      
      console.log(`📍 Trying: ${coord.lat}, ${coord.lon}`);
      console.log(`   Contract format: ${contractLat}, ${contractLon}`);
      console.log(`   Distance: ${distanceMeters}m`);
      console.log(`   Within radius: ${withinRadius ? '✅ YES' : '❌ NO'}`);
      
      if (withinRadius) {
        workingCoordinates.push({
          decimal: coord,
          contract: { lat: contractLat, lon: contractLon },
          distance: distanceMeters
        });
      }
      console.log("");
      
    } catch (error) {
      console.log(`❌ Error testing ${coord.lat}, ${coord.lon}:`, error.message);
      console.log("");
    }
  }

  console.log("🎉 WORKING COORDINATES:");
  console.log("==================================================");
  
  if (workingCoordinates.length > 0) {
    for (const coord of workingCoordinates) {
      console.log(`✅ ${coord.decimal.lat}, ${coord.decimal.lon} (distance: ${coord.distance}m)`);
    }
    
    const best = workingCoordinates[0];
    console.log("");
    console.log("🎯 USE THESE COORDINATES:");
    console.log(`Latitude: ${best.decimal.lat}`);
    console.log(`Longitude: ${best.decimal.lon}`);
  } else {
    console.log("❌ No working coordinates found! This shouldn't happen...");
    
    // Let's try the exact contract values
    console.log("");
    console.log("🔍 Testing exact contract coordinates:");
    const exactDistance = await ggtEscrow.calculateDistance(
      BigInt(targetLat),
      BigInt(targetLon), 
      BigInt(targetLat),  // Same as target
      BigInt(targetLon)   // Same as target
    );
    console.log(`Distance to self: ${Number(exactDistance)}m`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});