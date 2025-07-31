// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/NewUserGiftEscrowGGT.sol";

contract DeployNewUserGiftEscrowGGT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the NewUserGiftEscrowGGT contract
        NewUserGiftEscrowGGT newUserGiftEscrow = new NewUserGiftEscrowGGT();
        
        console.log("NewUserGiftEscrowGGT deployed to:", address(newUserGiftEscrow));
        console.log("GGT Token address:", address(newUserGiftEscrow.GGT_TOKEN()));
        
        vm.stopBroadcast();
    }
}