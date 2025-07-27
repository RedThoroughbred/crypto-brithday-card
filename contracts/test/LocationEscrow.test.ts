import { expect } from "chai";
import { ethers } from "hardhat";
import { LocationEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("LocationEscrow", function () {
  // Test constants
  const TEST_LAT = 40_748817; // NYC coordinates * 1e6
  const TEST_LON = -73_985428;
  const TEST_RADIUS = 50; // 50 meters
  const TEST_CLUE_HASH = ethers.keccak256(ethers.toUtf8Bytes("Find the statue in Central Park"));
  const GIFT_AMOUNT = ethers.parseEther("1.0");
  const PLATFORM_FEE_RATE = 250; // 2.5%

  async function deployLocationEscrowFixture() {
    const [owner, alice, bob, feeRecipient] = await ethers.getSigners();

    const LocationEscrow = await ethers.getContractFactory("LocationEscrow");
    const escrow = await LocationEscrow.deploy(feeRecipient.address);

    return { escrow, owner, alice, bob, feeRecipient };
  }

  describe("Deployment", function () {
    it("Should set the right fee recipient", async function () {
      const { escrow, feeRecipient } = await loadFixture(deployLocationEscrowFixture);
      
      expect(await escrow.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set the right platform fee rate", async function () {
      const { escrow } = await loadFixture(deployLocationEscrowFixture);
      
      expect(await escrow.platformFeeRate()).to.equal(PLATFORM_FEE_RATE);
    });

    it("Should grant admin roles to deployer", async function () {
      const { escrow, owner } = await loadFixture(deployLocationEscrowFixture);
      
      const DEFAULT_ADMIN_ROLE = await escrow.DEFAULT_ADMIN_ROLE();
      const OPERATOR_ROLE = await escrow.OPERATOR_ROLE();
      const EMERGENCY_ROLE = await escrow.EMERGENCY_ROLE();
      
      expect(await escrow.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await escrow.hasRole(OPERATOR_ROLE, owner.address)).to.be.true;
      expect(await escrow.hasRole(EMERGENCY_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Gift Creation", function () {
    it("Should create a gift successfully", async function () {
      const { escrow, alice, bob } = await loadFixture(deployLocationEscrowFixture);
      
      const expiryTime = await time.latest() + 86400; // 1 day from now
      
      await expect(
        escrow.connect(alice).createGift(
          bob.address,
          TEST_LAT,
          TEST_LON,
          TEST_RADIUS,
          TEST_CLUE_HASH,
          expiryTime,
          ethers.ZeroHash,
          { value: GIFT_AMOUNT }
        )
      ).to.emit(escrow, "GiftCreated")
        .withArgs(1, alice.address, bob.address, GIFT_AMOUNT, expiryTime);
      
      expect(await escrow.totalGiftsCreated()).to.equal(1);
      expect(await escrow.totalValueLocked()).to.equal(GIFT_AMOUNT);
      
      const gift = await escrow.getGift(1);
      expect(gift.giver).to.equal(alice.address);
      expect(gift.recipient).to.equal(bob.address);
      expect(gift.amount).to.equal(GIFT_AMOUNT);
      expect(gift.targetLatitude).to.equal(TEST_LAT);
      expect(gift.targetLongitude).to.equal(TEST_LON);
      expect(gift.verificationRadius).to.equal(TEST_RADIUS);
      expect(gift.claimed).to.be.false;
      expect(gift.exists).to.be.true;
    });

    it("Should fail with zero amount", async function () {
      const { escrow, alice, bob } = await loadFixture(deployLocationEscrowFixture);
      
      const expiryTime = await time.latest() + 86400;
      
      await expect(
        escrow.connect(alice).createGift(
          bob.address,
          TEST_LAT,
          TEST_LON,
          TEST_RADIUS,
          TEST_CLUE_HASH,
          expiryTime,
          ethers.ZeroHash,
          { value: 0 }
        )
      ).to.be.revertedWithCustomError(escrow, "InsufficientAmount");
    });

    it("Should fail with invalid recipient", async function () {
      const { escrow, alice } = await loadFixture(deployLocationEscrowFixture);
      
      const expiryTime = await time.latest() + 86400;
      
      await expect(
        escrow.connect(alice).createGift(
          ethers.ZeroAddress,
          TEST_LAT,
          TEST_LON,
          TEST_RADIUS,
          TEST_CLUE_HASH,
          expiryTime,
          ethers.ZeroHash,
          { value: GIFT_AMOUNT }
        )
      ).to.be.revertedWithCustomError(escrow, "InvalidParameters");
    });

    it("Should fail with invalid coordinates", async function () {
      const { escrow, alice, bob } = await loadFixture(deployLocationEscrowFixture);
      
      const expiryTime = await time.latest() + 86400;
      
      // Invalid latitude (> 90 degrees)
      await expect(
        escrow.connect(alice).createGift(
          bob.address,
          91_000000, // > 90 degrees
          TEST_LON,
          TEST_RADIUS,
          TEST_CLUE_HASH,
          expiryTime,
          ethers.ZeroHash,
          { value: GIFT_AMOUNT }
        )
      ).to.be.revertedWithCustomError(escrow, "InvalidParameters");
    });

    it("Should fail with invalid radius", async function () {
      const { escrow, alice, bob } = await loadFixture(deployLocationEscrowFixture);
      
      const expiryTime = await time.latest() + 86400;
      
      // Radius too small
      await expect(
        escrow.connect(alice).createGift(
          bob.address,
          TEST_LAT,
          TEST_LON,
          4, // < 5 meters minimum
          TEST_CLUE_HASH,
          expiryTime,
          ethers.ZeroHash,
          { value: GIFT_AMOUNT }
        )
      ).to.be.revertedWithCustomError(escrow, "InvalidParameters");
    });
  });

  describe("Gift Claiming", function () {
    async function createGiftFixture() {
      const fixture = await loadFixture(deployLocationEscrowFixture);
      const { escrow, alice, bob } = fixture;
      
      const expiryTime = await time.latest() + 86400;
      
      await escrow.connect(alice).createGift(
        bob.address,
        TEST_LAT,
        TEST_LON,
        TEST_RADIUS,
        TEST_CLUE_HASH,
        expiryTime,
        ethers.ZeroHash,
        { value: GIFT_AMOUNT }
      );
      
      return { ...fixture, giftId: 1 };
    }

    it("Should claim gift successfully at exact location", async function () {
      const { escrow, bob, feeRecipient, giftId } = await loadFixture(createGiftFixture);
      
      const bobBalanceBefore = await ethers.provider.getBalance(bob.address);
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
      
      const tx = await escrow.connect(bob).claimGift(giftId, TEST_LAT, TEST_LON, "0x");
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const expectedFee = (GIFT_AMOUNT * BigInt(PLATFORM_FEE_RATE)) / 10000n;
      const expectedAmount = GIFT_AMOUNT - expectedFee;
      
      const bobBalanceAfter = await ethers.provider.getBalance(bob.address);
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
      
      expect(bobBalanceAfter).to.equal(bobBalanceBefore + expectedAmount - gasUsed);
      expect(feeRecipientBalanceAfter).to.equal(feeRecipientBalanceBefore + expectedFee);
      
      const gift = await escrow.getGift(giftId);
      expect(gift.claimed).to.be.true;
      expect(gift.claimAttempts).to.equal(1);
      
      expect(await escrow.totalValueLocked()).to.equal(0);
    });

    it("Should fail claim from wrong location", async function () {
      const { escrow, bob, giftId } = await loadFixture(createGiftFixture);
      
      // Try to claim from 1km away (roughly)
      const wrongLat = TEST_LAT + 9000; // ~1km north
      const wrongLon = TEST_LON + 9000; // ~1km east
      
      await expect(
        escrow.connect(bob).claimGift(giftId, wrongLat, wrongLon, "0x")
      ).to.be.revertedWithCustomError(escrow, "LocationVerificationFailed");
      
      const gift = await escrow.getGift(giftId);
      expect(gift.claimed).to.be.false;
      expect(gift.claimAttempts).to.equal(0); // Reverted transaction means no state change
    });

    it("Should fail if wrong recipient tries to claim", async function () {
      const { escrow, alice, giftId } = await loadFixture(createGiftFixture);
      
      await expect(
        escrow.connect(alice).claimGift(giftId, TEST_LAT, TEST_LON, "0x")
      ).to.be.revertedWithCustomError(escrow, "UnauthorizedClaimer");
    });

    it("Should fail if gift is already claimed", async function () {
      const { escrow, bob, giftId } = await loadFixture(createGiftFixture);
      
      // Claim the gift first
      await escrow.connect(bob).claimGift(giftId, TEST_LAT, TEST_LON, "0x");
      
      // Try to claim again
      await expect(
        escrow.connect(bob).claimGift(giftId, TEST_LAT, TEST_LON, "0x")
      ).to.be.revertedWithCustomError(escrow, "GiftAlreadyClaimed");
    });

    it("Should fail if gift has expired", async function () {
      const { escrow, bob, giftId } = await loadFixture(createGiftFixture);
      
      // Fast forward past expiry
      await time.increase(86401); // 1 day + 1 second
      
      await expect(
        escrow.connect(bob).claimGift(giftId, TEST_LAT, TEST_LON, "0x")
      ).to.be.revertedWithCustomError(escrow, "GiftExpiredError");
    });
  });

  describe("Emergency Withdrawal", function () {
    async function createExpiredGiftFixture() {
      const fixture = await loadFixture(deployLocationEscrowFixture);
      const { escrow, alice, bob } = fixture;
      
      const expiryTime = await time.latest() + 3600; // 1 hour
      
      await escrow.connect(alice).createGift(
        bob.address,
        TEST_LAT,
        TEST_LON,
        TEST_RADIUS,
        TEST_CLUE_HASH,
        expiryTime,
        ethers.ZeroHash,
        { value: GIFT_AMOUNT }
      );
      
      // Fast forward past expiry
      await time.increase(3601);
      
      return { ...fixture, giftId: 1 };
    }

    it("Should allow emergency withdrawal after expiry", async function () {
      const { escrow, alice, giftId } = await loadFixture(createExpiredGiftFixture);
      
      const aliceBalanceBefore = await ethers.provider.getBalance(alice.address);
      
      const tx = await escrow.connect(alice).emergencyWithdraw(giftId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const aliceBalanceAfter = await ethers.provider.getBalance(alice.address);
      
      expect(aliceBalanceAfter).to.equal(aliceBalanceBefore + GIFT_AMOUNT - gasUsed);
      
      const gift = await escrow.getGift(giftId);
      expect(gift.claimed).to.be.true;
      
      expect(await escrow.totalValueLocked()).to.equal(0);
    });

    it("Should fail emergency withdrawal before expiry", async function () {
      const { escrow, alice, bob } = await loadFixture(deployLocationEscrowFixture);
      
      const expiryTime = await time.latest() + 86400; // 1 day
      
      await escrow.connect(alice).createGift(
        bob.address, // Send to bob for testing
        TEST_LAT,
        TEST_LON,
        TEST_RADIUS,
        TEST_CLUE_HASH,
        expiryTime,
        ethers.ZeroHash,
        { value: GIFT_AMOUNT }
      );
      
      await expect(
        escrow.connect(alice).emergencyWithdraw(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidParameters");
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const { escrow, owner } = await loadFixture(deployLocationEscrowFixture);
      
      const newFeeRate = 300; // 3%
      
      await expect(
        escrow.connect(owner).updatePlatformFee(newFeeRate)
      ).to.emit(escrow, "PlatformFeeUpdated")
        .withArgs(PLATFORM_FEE_RATE, newFeeRate);
      
      expect(await escrow.platformFeeRate()).to.equal(newFeeRate);
    });

    it("Should update fee recipient", async function () {
      const { escrow, owner, alice, feeRecipient } = await loadFixture(deployLocationEscrowFixture);
      
      await expect(
        escrow.connect(owner).updateFeeRecipient(alice.address)
      ).to.emit(escrow, "FeeRecipientUpdated")
        .withArgs(feeRecipient.address, alice.address);
      
      expect(await escrow.feeRecipient()).to.equal(alice.address);
    });

    it("Should pause and unpause contract", async function () {
      const { escrow, owner } = await loadFixture(deployLocationEscrowFixture);
      
      await escrow.connect(owner).pause();
      expect(await escrow.paused()).to.be.true;
      
      await escrow.connect(owner).unpause();
      expect(await escrow.paused()).to.be.false;
    });
  });
});