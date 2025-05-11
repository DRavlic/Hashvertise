import { expect } from "chai";
import { ethers } from "hardhat";
import { Hashvertise } from "../typechain-types";

// Note: test will be run on testnet by default
describe("Hashvertise", function () {
  let hashvertise: Hashvertise;

  beforeEach(async function () {
    const HashvertiseFactory = await ethers.getContractFactory("Hashvertise");
    hashvertise = await HashvertiseFactory.deploy();
    await hashvertise.waitForDeployment();
  });

  it("Should deploy successfully", async function () {
    const address = await hashvertise.getAddress();
    expect(address).to.not.equal(ethers.ZeroAddress);
  });

  it("Should get owner", async function () {
    const owner = await hashvertise.getOwner();
    expect(owner).to.not.equal(ethers.ZeroAddress);
  });
});
