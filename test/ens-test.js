const {ethers} = require("hardhat");
const { expect, assert} = require("chai");
const {accounts} = require("./utils/setup");
const ERC = require("./abi/ERC20ABI.json");


const ENS = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
const AMT = ethers.utils.parseEther("40000");

describe("Should simulate ens transfer", async function() {
    this.timeout(30000);

    let props = {ethers};
    before(async function() {
        props = await accounts(props);
    });

    it("Should make transfer", async () => {
        const wallet = new ethers.Wallet(process.env.MAINNET_OWNER, ethers.provider);
        const proxy = new ethers.Wallet(process.env.MAINNET_PROXY_ADMIN).address;

        const erc = new ethers.Contract(ENS, ERC, ethers.provider);
        const bal = await erc.balanceOf(wallet.address);
        console.log("Owner", props.owner.address, "Balance", bal.toString());

        const txn = await erc.connect(wallet).transfer(proxy, AMT);
        const r = await txn.wait();

        console.log("REC", r);
    })
})