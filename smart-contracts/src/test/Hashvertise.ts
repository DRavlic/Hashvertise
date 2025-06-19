import { expect } from "chai";
import { ethers } from "hardhat";
import { Hashvertise } from "../../hardhat-files/typechain-types";
import {
  ABSOLUTE_MINIMUM_DEPOSIT,
  HASHVERTISE_FEE_BASIS_POINTS,
  HASHVERTISE_MINIMUM_DEPOSIT,
} from "../environment";

// Note: test will be run on testnet by default
describe("Hashvertise", function () {
  let hashvertise: Hashvertise;

  beforeEach(async function () {
    const HashvertiseFactory = await ethers.getContractFactory("Hashvertise");
    hashvertise = (await HashvertiseFactory.deploy(
      HASHVERTISE_FEE_BASIS_POINTS,
      HASHVERTISE_MINIMUM_DEPOSIT
    )) as any;
    await hashvertise.waitForDeployment();
  });

  it("Should deploy successfully", async function () {
    const address = await hashvertise.getAddress();
    expect(address).to.not.equal(ethers.ZeroAddress);
  });

  it("Should get owner", async function () {
    const owner = await hashvertise.owner();
    expect(owner).to.not.equal(ethers.ZeroAddress);
  });

  it("Should set the correct fee rate", async function () {
    const feeRate = await hashvertise.getFeeBasisPoints();
    expect(feeRate).to.equal(HASHVERTISE_FEE_BASIS_POINTS);
  });

  it("Should set the correct minimum deposit", async function () {
    const minimumDepositInTinybars = await hashvertise.getMinimumDeposit();
    expect(minimumDepositInTinybars).to.equal(HASHVERTISE_MINIMUM_DEPOSIT);
  });

  it("Should return the correct absolute minimum deposit", async function () {
    const absoluteMinimum = await hashvertise.getAbsoluteMinimumDeposit();
    expect(absoluteMinimum).to.equal(ABSOLUTE_MINIMUM_DEPOSIT);
  });
});
