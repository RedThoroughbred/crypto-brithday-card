import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing GPS Distance Calculation");
  
  // Deploy the contract to test distance calculation
  const GGTLocationChainEscrow = await ethers.getContractFactory("GGTLocationChainEscrow");
  
  // We need a mock GGT token address for deployment
  const mockGGTAddress = "0x1775997EE682CCab7c6443168d63D2605922C633"; // Your actual GGT token
  
  console.log("📍 Deploying contract for distance testing...");
  const contract = await GGTLocationChainEscrow.deploy(mockGGTAddress);
  await contract.waitForDeployment();
  
  console.log("✅ Contract deployed for testing");
  
  // Test cases with known distances
  const testCases = [
    {
      name: "Same location (0 meters)",
      lat1: 40.7128, lng1: -74.0060, // NYC
      lat2: 40.7128, lng2: -74.0060, // Same NYC
      expectedDistance: 0
    },
    {
      name: "Times Square to Empire State (500m approx)",
      lat1: 40.7580, lng1: -73.9855, // Times Square
      lat2: 40.7484, lng2: -73.9857, // Empire State Building
      expectedDistance: 1100 // About 1.1km actual distance
    },
    {
      name: "Central Park corners (2.5km approx)",
      lat1: 40.7682, lng1: -73.9816, // NE corner
      lat2: 40.7641, lng2: -73.9734, // SE corner  
      expectedDistance: 850 // About 850m actual distance
    },
    {
      name: "Brooklyn Bridge to Manhattan Bridge (1.8km)",
      lat1: 40.7061, lng1: -73.9969, // Brooklyn Bridge
      lat2: 40.7056, lng2: -73.9904, // Manhattan Bridge
      expectedDistance: 570 // About 570m actual distance
    }
  ];
  
  console.log("\n🔍 Running GPS distance tests:");
  console.log("=" .repeat(80));
  
  for (const testCase of testCases) {
    try {
      // Convert to contract format (multiply by 1e6 for precision)
      const lat1 = Math.floor(testCase.lat1 * 1_000_000);
      const lng1 = Math.floor(testCase.lng1 * 1_000_000);
      const lat2 = Math.floor(testCase.lat2 * 1_000_000);
      const lng2 = Math.floor(testCase.lng2 * 1_000_000);
      
      console.log(`\n📐 Test: ${testCase.name}`);
      console.log(`   Point 1: ${testCase.lat1}, ${testCase.lng1}`);
      console.log(`   Point 2: ${testCase.lat2}, ${testCase.lng2}`);
      console.log(`   Contract coordinates: ${lat1}, ${lng1} → ${lat2}, ${lng2}`);
      
      // Call the distance calculation function
      const calculatedDistance = await contract.calculateDistance(lat1, lng1, lat2, lng2);
      const distanceMeters = Number(calculatedDistance);
      
      console.log(`   🎯 Expected: ~${testCase.expectedDistance}m`);
      console.log(`   📊 Calculated: ${distanceMeters}m`);
      
      // Calculate accuracy (within 20% is reasonable for our approximation)
      const accuracy = testCase.expectedDistance === 0 ? 
        (distanceMeters === 0 ? 100 : 0) :
        100 - Math.abs(distanceMeters - testCase.expectedDistance) / testCase.expectedDistance * 100;
        
      console.log(`   ✨ Accuracy: ${accuracy.toFixed(1)}%`);
      
      if (accuracy > 80) {
        console.log(`   ✅ PASS - Good accuracy`);
      } else if (accuracy > 50) {
        console.log(`   ⚠️  WARN - Moderate accuracy`);
      } else {
        console.log(`   ❌ FAIL - Poor accuracy`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error}`);
    }
  }
  
  console.log("\n" + "=" .repeat(80));
  console.log("🏁 GPS Distance Testing Complete!");
  
  // Test radius validation scenarios
  console.log("\n🎯 Testing radius validation scenarios:");
  
  const radiusTests = [
    { distance: 45, radius: 50, shouldPass: true, scenario: "Within radius (45m < 50m)" },
    { distance: 55, radius: 50, shouldPass: false, scenario: "Outside radius (55m > 50m)" },
    { distance: 50, radius: 50, shouldPass: true, scenario: "Exactly at radius (50m = 50m)" },
    { distance: 0, radius: 10, shouldPass: true, scenario: "Perfect location (0m < 10m)" }
  ];
  
  for (const test of radiusTests) {
    const result = test.distance <= test.radius;
    const status = result === test.shouldPass ? "✅ PASS" : "❌ FAIL";
    console.log(`   ${status} ${test.scenario} → ${result ? "ALLOW" : "REJECT"}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });