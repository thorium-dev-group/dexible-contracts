const {ethers} = require("hardhat");
const { expect } = require("chai");
const {accounts, settlement} = require("./utils/setup");
const {advanceBlockTo} = require("./utils/time");

describe("GasTank", function() {
    this.timeout(30000);

    let props = {ethers};
    before(async function() {
        await accounts(props);
    });

    beforeEach(async function() {
        props = await settlement(props);
    });

    let depositGas = async function(gas) {
        let {
            trader,
            settlementContract: tester
        } = props;
        let txn = await tester.connect(trader).depositGas({
            value: gas
        });
        await txn.wait();
    }

    it("Should deposit gas", async function() {
        let {
            traderAddress,
            trader,
            settlementContract: tester
        } = props;

        let gas = ethers.utils.parseEther("1");
        let bb = await ethers.provider.getBalance(traderAddress);
        await depositGas(gas)
        let b = await tester.connect(trader).availableForUse(traderAddress);
        expect(b).to.eq(gas);
        b = await ethers.provider.getBalance(traderAddress);
        expect(bb).to.be.gt(b);
    });

    it("Should lock funds for withdraw", async function() {
        let {
            traderAddress,
            trader,
            settlementContract: tester
        } = props;
        let gas = ethers.utils.parseEther("1");
        //console.log("Depositing gas...");
        await depositGas(gas);
        //console.log("Requesting withdraw...");
        await tester.connect(trader).requestWithdrawGas(gas);
        let thawing = await tester.connect(trader).thawingFunds(traderAddress);
        //console.log("Thawing", thawing.toString());
        expect(thawing).to.eq(gas);
        let b = await ethers.provider.getBlockNumber();
        //console.log("Advancing block..", b);
        await advanceBlockTo(b+4);
        //b = await ethers.provider.getBlockNumber();
        //console.log("Block now", b);

        thawing = await tester.connect(trader).thawingFunds(traderAddress);
        //console.log("Now thawing is", thawing.toString());
        expect(thawing).to.eq(0);

        b = await tester.connect(trader).availableGasForWithdraw(traderAddress);
        //console.log("Available", b.toString());
        expect(b).to.eq(gas);
        let b4 = await ethers.provider.getBalance(traderAddress);
        await tester.connect(trader).withdrawGas(gas);
        b = await ethers.provider.getBalance(traderAddress);
        expect(b).to.gt(b4);        
    });
})