const {ethers} = require("hardhat");
const { expect, assert} = require("chai");
const {accounts, feeCalculator} = require("./utils/setup");
const {setupFeeData} = require("./utils/order");
const erc20ABI = require("./abi/ERC20ABI.json");


const WETH_MAIN = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const FEE_TOKEN = WETH_MAIN;
const ETH_USD = ethers.utils.parseEther("3192.29");
const FEE_ETH_PRICE = ethers.utils.parseEther("1");
const GAS_PRICE = ethers.utils.parseUnits("111", 9);
const bn = ethers.BigNumber.from;

describe("FeeCalculator", function() {
    this.timeout(30000);

    let props = {ethers};
    before(async function() {
        props = await accounts(props);
    });

    beforeEach(async function(){
        props = await feeCalculator(props);
    });

    it("Should compute fees", async function() {
        const feeCalc = props.feeCalculator;
        const data = setupFeeData({
            feeToken: FEE_TOKEN,
            gasEstimate: bn(500000),
            ethUSDPrice: ETH_USD,
            feeTokenETHPrice: FEE_ETH_PRICE,
            gasPrice: GAS_PRICE,
            feeAmountUSD:bn(14)
        });

        const ifc = feeCalc.interface;
        const encoded = ifc.encodeFunctionData("computeFees", [data]);
        console.log("ENCODED", encoded);
        console.log("Going to", feeCalc.address);

        /*
        const [dexFee, gasFee, totalFees] = await feeCalc.computeFees(data);
        console.log("Dex fee", dexFee.toString(), "Gas fee", gasFee.toString(), "total", totalFees.toString());
        */
       let r = await props.owner.provider.call(
           {
                to: feeCalc.address,
                from: props.owner.address,
                data: encoded,
                gasPrice: bn(117000000000),
                gas: bn(400000)
            }
       );
       console.log("RESULT", r);
    })

});

