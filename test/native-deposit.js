const {ethers} = require("hardhat");
const { expect, assert} = require("chai");
const {accounts, settlement, zrx} = require("./utils/setup");
const {approveRelay} = require("./utils/accounts");
const {setupOrder} = require("./utils/order");
const {balanceOf} = require("./utils/erc20");
const erc20ABI = require("./abi/ERC20ABI.json");


const WETH_MAIN = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const WETH_WHALE = "0x725a1fe791b9081492442518596a2E9e4dc4711b";

const TOKEN_IN = WETH_MAIN;
const TRADER = WETH_WHALE;

const bn = ethers.BigNumber.from;
const fn = ethers.utils.parseEther;

describe("NativeDeposit", function() {
    this.timeout(30000);

    let props = {ethers};
    before(async function() {
        props = await accounts(props);
    });

    beforeEach(async function(){
        props = await settlement(props);

        await approveRelay(props);
        props = await zrx(props);
    });

    context("----Settlement Contract ----", function() {
        let whale = null;
        let inputToken = null;
        let maxGas = null;
        before(async function() {
            console.log("======= BEFORE TEST =========");

            await ethers.provider.send('hardhat_impersonateAccount', [TRADER]);
            await ethers.provider.send("hardhat_setBalance", [TRADER, ethers.utils.parseEther("100").toHexString().replace(/0x0*/,'0x')]);
            
            console.log("Whale ETH balance", await ethers.provider.getBalance(TRADER));
            whale = await ethers.provider.getSigner(TRADER);
            console.log("========= END BEFORE TEST ==========");
        });

        const approveSpend = async () => {
            let {
                settlementContract: tester
            } = props;
            let ec20 = new ethers.Contract(TOKEN_IN, erc20ABI, ethers.provider);
            console.log("Approving", tester.address, "for amount", ethers.constants.MaxUint256.toString());
            inputToken = ec20;
            await ec20.connect(whale).approve(tester.address, ethers.constants.MaxUint256);
        }

        it("Should deposit native token", async function() {
            
            console.log("Approving spend");
            await approveSpend();
            const startBalance = await ethers.provider.getBalance(props.settlementContract.address);
            const expectedOut =  fn("10");

            let txn = await props.settlementContract.connect(whale).depositWNative(TOKEN_IN, expectedOut);
            let r = await txn.wait();
            let afterBal = await ethers.provider.getBalance(props.settlementContract.address);
            const diff = afterBal.sub(startBalance);
            expect(diff).to.be.gte(expectedOut);
            console.log("Gas used", r.gasUsed.toString());
        });
    });
    



});