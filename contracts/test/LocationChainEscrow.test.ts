import { expect } from "chai";
import { ethers } from "hardhat";
import { LocationChainEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("LocationChainEscrow", function () {
  let contract: LocationChainEscrow;
  let giver: SignerWithAddress;
  let recipient: SignerWithAddress;
  let feeRecipient: SignerWithAddress;
  let other: SignerWithAddress;

  // Test data
  const proposalChain = {
    title: "Marriage Proposal Journey",
    stepLocations: [
      [40774000, -73968000], // Central Park (lat: 40.774, lng: -73.968)
      [40758000, -73986000], // Times Square (lat: 40.758, lng: -73.986)
      [40689000, -74045000], // Statue of Liberty (lat: 40.689, lng: -74.045)
      [40706000, -74009000], // Brooklyn Bridge (lat: 40.706, lng: -74.009)
    ] as [number, number][],
    stepRadii: [50, 100, 75, 50],
    stepTitles: [
      "Where We First Met",
      "Our First Date",
      "Where You Said You Loved Me",
      "Where I Ask You to Marry Me"
    ],
    stepMessages: [
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Remember this place?")),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("You were so nervous!")),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("That beautiful sunset...")),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Will you marry me? 💍"))
    ],
    metadata: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal story IPFS hash")),
    value: ethers.utils.parseEther("0.1")
  };

  beforeEach(async function () {
    [giver, recipient, feeRecipient, other] = await ethers.getSigners();

    const LocationChainEscrowFactory = await ethers.getContractFactory("LocationChainEscrow");
    contract = await LocationChainEscrowFactory.deploy();
    await contract.deployed();

    // Initialize contract
    await contract.initialize(feeRecipient.address);
    
    // Grant roles
    const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
    await contract.grantRole(DEFAULT_ADMIN_ROLE, giver.address);
  });

  describe("Chain Creation", function () {
    it("Should create a gift chain successfully", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const tx = await contract.connect(giver).createGiftChain(
        recipient.address,
        proposalChain.stepLocations,
        proposalChain.stepRadii,
        proposalChain.stepMessages,
        proposalChain.stepTitles,
        proposalChain.title,
        expiryTime,
        proposalChain.metadata,
        { value: proposalChain.value }
      );

      const receipt = await tx.wait();
      const chainCreatedEvent = receipt.events?.find(e => e.event === 'ChainCreated');
      
      expect(chainCreatedEvent).to.not.be.undefined;
      expect(chainCreatedEvent?.args?.chainId).to.equal(1);
      expect(chainCreatedEvent?.args?.giver).to.equal(giver.address);
      expect(chainCreatedEvent?.args?.recipient).to.equal(recipient.address);
      expect(chainCreatedEvent?.args?.totalSteps).to.equal(4);
      expect(chainCreatedEvent?.args?.totalValue).to.equal(proposalChain.value);
      expect(chainCreatedEvent?.args?.chainTitle).to.equal(proposalChain.title);

      // Check chain details
      const chain = await contract.getChain(1);
      expect(chain.giver).to.equal(giver.address);
      expect(chain.recipient).to.equal(recipient.address);
      expect(chain.totalSteps).to.equal(4);
      expect(chain.totalValue).to.equal(proposalChain.value);
      expect(chain.chainTitle).to.equal(proposalChain.title);
      expect(chain.chainCompleted).to.be.false;
      expect(chain.currentStep).to.equal(0);
    });

    it("Should create individual gifts for each step", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      await contract.connect(giver).createGiftChain(
        recipient.address,
        proposalChain.stepLocations,
        proposalChain.stepRadii,
        proposalChain.stepMessages,
        proposalChain.stepTitles,
        proposalChain.title,
        expiryTime,
        proposalChain.metadata,
        { value: proposalChain.value }
      );

      const steps = await contract.getChainSteps(1);
      expect(steps.length).to.equal(4);

      // Check each step
      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].chainId).to.equal(1);
        expect(steps[i].stepIndex).to.equal(i);
        expect(steps[i].stepTitle).to.equal(proposalChain.stepTitles[i]);
        expect(steps[i].isUnlocked).to.equal(i === 0); // Only first step should be unlocked
        expect(steps[i].isCompleted).to.be.false;
      }
    });

    it("Should unlock only the first step initially", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      await contract.connect(giver).createGiftChain(
        recipient.address,
        proposalChain.stepLocations,
        proposalChain.stepRadii,
        proposalChain.stepMessages,
        proposalChain.stepTitles,
        proposalChain.title,
        expiryTime,
        proposalChain.metadata,
        { value: proposalChain.value }
      );

      const currentStep = await contract.getCurrentStep(1);
      expect(currentStep.stepIndex).to.equal(0);
      expect(currentStep.isUnlocked).to.be.true;
      expect(currentStep.stepTitle).to.equal(proposalChain.stepTitles[0]);
    });

    it("Should revert with invalid chain length", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      // Too few steps
      await expect(
        contract.connect(giver).createGiftChain(
          recipient.address,
          [[40774000, -73968000]], // Only 1 step
          [50],
          [proposalChain.stepMessages[0]],
          ["Single Step"],
          "Invalid Chain",
          expiryTime,
          proposalChain.metadata,
          { value: proposalChain.value }
        )
      ).to.be.revertedWithCustomError(contract, "InvalidChainLength");

      // Too many steps
      const tooManySteps = Array(12).fill([40774000, -73968000]);
      const tooManyRadii = Array(12).fill(50);
      const tooManyMessages = Array(12).fill(proposalChain.stepMessages[0]);
      const tooManyTitles = Array(12).fill("Step");

      await expect(
        contract.connect(giver).createGiftChain(
          recipient.address,
          tooManySteps,
          tooManyRadii,
          tooManyMessages,
          tooManyTitles,
          "Too Long Chain",
          expiryTime,
          proposalChain.metadata,
          { value: proposalChain.value }
        )
      ).to.be.revertedWithCustomError(contract, "InvalidChainLength");
    });
  });

  describe("Chain Step Claiming", function () {
    let chainId: number;

    beforeEach(async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      const tx = await contract.connect(giver).createGiftChain(
        recipient.address,
        proposalChain.stepLocations,
        proposalChain.stepRadii,
        proposalChain.stepMessages,
        proposalChain.stepTitles,
        proposalChain.title,
        expiryTime,
        proposalChain.metadata,
        { value: proposalChain.value }
      );

      const receipt = await tx.wait();
      const chainCreatedEvent = receipt.events?.find(e => e.event === 'ChainCreated');
      chainId = chainCreatedEvent?.args?.chainId.toNumber();
    });

    it("Should allow claiming the first step", async function () {
      const userLat = proposalChain.stepLocations[0][0]; // Exact location
      const userLng = proposalChain.stepLocations[0][1];

      const tx = await contract.connect(recipient).claimChainStep(
        chainId,
        0, // First step
        userLat,
        userLng,
        "0x" // No signature
      );

      const receipt = await tx.wait();
      const stepCompletedEvent = receipt.events?.find(e => e.event === 'ChainStepCompleted');
      const stepUnlockedEvent = receipt.events?.find(e => e.event === 'ChainStepUnlocked');

      expect(stepCompletedEvent).to.not.be.undefined;
      expect(stepCompletedEvent?.args?.chainId).to.equal(chainId);
      expect(stepCompletedEvent?.args?.stepIndex).to.equal(0);

      // Should unlock next step
      expect(stepUnlockedEvent).to.not.be.undefined;
      expect(stepUnlockedEvent?.args?.stepIndex).to.equal(1);

      // Check chain state
      const chain = await contract.getChain(chainId);
      expect(chain.currentStep).to.equal(1);
      expect(chain.chainCompleted).to.be.false;

      // Check step state
      const steps = await contract.getChainSteps(chainId);
      expect(steps[0].isCompleted).to.be.true;
      expect(steps[1].isUnlocked).to.be.true;
    });

    it("Should complete the entire chain when all steps are claimed", async function () {
      const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);

      // Claim all steps in sequence
      for (let i = 0; i < proposalChain.stepLocations.length; i++) {
        const userLat = proposalChain.stepLocations[i][0];
        const userLng = proposalChain.stepLocations[i][1];

        await contract.connect(recipient).claimChainStep(
          chainId,
          i,
          userLat,
          userLng,
          "0x"
        );
      }

      // Check final chain state
      const chain = await contract.getChain(chainId);
      expect(chain.chainCompleted).to.be.true;
      expect(chain.currentStep).to.equal(4);

      // Check all steps are completed
      const steps = await contract.getChainSteps(chainId);
      for (const step of steps) {
        expect(step.isCompleted).to.be.true;
      }

      // Check recipient received funds (minus gas)
      const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
      expect(recipientBalanceAfter).to.be.gt(recipientBalanceBefore);
    });

    it("Should not allow claiming steps out of order", async function () {
      // Try to claim step 2 before step 1
      await expect(
        contract.connect(recipient).claimChainStep(
          chainId,
          2,
          proposalChain.stepLocations[2][0],
          proposalChain.stepLocations[2][1],
          "0x"
        )
      ).to.be.revertedWithCustomError(contract, "StepNotUnlocked");
    });

    it("Should not allow non-recipients to claim steps", async function () {
      await expect(
        contract.connect(other).claimChainStep(
          chainId,
          0,
          proposalChain.stepLocations[0][0],
          proposalChain.stepLocations[0][1],
          "0x"
        )
      ).to.be.revertedWithCustomError(contract, "OnlyChainParticipant");
    });

    it("Should not allow claiming the same step twice", async function () {
      // Claim first step
      await contract.connect(recipient).claimChainStep(
        chainId,
        0,
        proposalChain.stepLocations[0][0],
        proposalChain.stepLocations[0][1],
        "0x"
      );

      // Try to claim it again
      await expect(
        contract.connect(recipient).claimChainStep(
          chainId,
          0,
          proposalChain.stepLocations[0][0],
          proposalChain.stepLocations[0][1],
          "0x"
        )
      ).to.be.revertedWithCustomError(contract, "StepAlreadyCompleted");
    });
  });

  describe("Chain Queries", function () {
    it("Should return correct chain details", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      await contract.connect(giver).createGiftChain(
        recipient.address,
        proposalChain.stepLocations,
        proposalChain.stepRadii,
        proposalChain.stepMessages,
        proposalChain.stepTitles,
        proposalChain.title,
        expiryTime,
        proposalChain.metadata,
        { value: proposalChain.value }
      );

      const chain = await contract.getChain(1);
      expect(chain.chainTitle).to.equal(proposalChain.title);
      expect(chain.totalSteps).to.equal(4);
      expect(chain.giver).to.equal(giver.address);
      expect(chain.recipient).to.equal(recipient.address);

      const steps = await contract.getChainSteps(1);
      expect(steps.length).to.equal(4);
      expect(steps[0].stepTitle).to.equal(proposalChain.stepTitles[0]);
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for chain creation", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      const tx = await contract.connect(giver).createGiftChain(
        recipient.address,
        proposalChain.stepLocations,
        proposalChain.stepRadii,
        proposalChain.stepMessages,
        proposalChain.stepTitles,
        proposalChain.title,
        expiryTime,
        proposalChain.metadata,
        { value: proposalChain.value }
      );

      const receipt = await tx.wait();
      console.log(`Chain creation gas used: ${receipt.gasUsed.toString()}`);
      
      // Should be under 500k gas for a 4-step chain
      expect(receipt.gasUsed.toNumber()).to.be.lt(500000);
    });
  });
});