const {ethers} = require("hardhat");
const { expect, assert} = require("chai");
const {accounts, settlement, zrx} = require("./utils/setup");
const {approveRelay} = require("./utils/accounts");
const {setupOrder} = require("./utils/order");
const {estimate}  = require("./utils/zrx");
const {balanceOf} = require("./utils/erc20");
const erc20ABI = require("./abi/ERC20ABI.json");

const MATIC = "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const MATIC_WHALE = "0xa1B9ae88E04429E1c2A41eaE264aEc5d88914810";
const GASPRICE = ethers.utils.parseUnits("100", 9);

const USDC_KOVAN = "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede";
const DAI_KOVAN =  "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa";
const WETH_KOVAN = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
const UNI_KOVAN = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const KOVAN_CALLER = "0xBf341c95C52181D4eCa6cf10c3f17316FD262E39";

const TOKEN_IN = DAI_KOVAN;
const TOKEN_OUT = WETH_KOVAN;
const TRADER = KOVAN_CALLER;
const IN_AMOUNT = ethers.utils.parseEther("30");

const bn = ethers.BigNumber.from;

describe("ZrxSettlement", function() {
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

    

    context("----Settlement With Order----", function() {
        let order = null;
        let encodedCallData = null;
        let whale = null;
        let price = null;
        let maxGas = null;
        before(async function() {
            let res = await estimate({
                sellToken: TOKEN_IN,
                buyToken: TOKEN_OUT,
                sellAmount: IN_AMOUNT.toString(),
                devTeam: props.ownerAddress
            });
            
            //console.log("RES", res);

            price = ethers.BigNumber.from("1").div(ethers.utils.parseUnits(res.price, 18));
            console.log("Price", price.toString());
            console.log("Expected gas", res.estimatedGas);
            await ethers.provider.send('hardhat_impersonateAccount', [TRADER]);
            //maxGas = ethers.BigNumber.from(res.gasPrice);
            maxGas = ethers.utils.parseUnits("3", 9);
            whale = await ethers.provider.getSigner(TRADER);
            order = setupOrder({
                traderAddress: TRADER,
                tokenA: {
                    address: TOKEN_IN,
                    amount: ethers.BigNumber.from(res.sellAmount)
                },
                tokenB: {
                    address: TOKEN_OUT,
                    amount: ethers.BigNumber.from(res.buyAmount)
                }
            });
            let abi = ethers.utils.defaultAbiCoder;
            console.log("Allowance target", res.allowanceTarget);
            encodedCallData = abi.encode(["address","address", "bytes"], [res.dexAddress,res.allowanceTarget,res.dexInput]);
            
        });

        const approveSpend = async () => {
            let {
                settlementContract: tester
            } = props;
            let ec20 = new ethers.Contract(TOKEN_IN, erc20ABI, ethers.provider);
            console.log("Approving", tester.address, "for amount", order.input.amount.toString());
            await ec20.connect(whale).approve(tester.address, order.input.amount);
        }

        const fundGas = async () => {
            let {
                settlementContract
            } = props;
            let txn = {
                to: settlementContract.address,
                from: props.owner.address,
                value: ethers.utils.parseEther("1")
            };
            await props.owner.sendTransaction(txn);
        }

        it("Should swap with valid order", async function() {
            
            console.log("Approving spend");
            await approveSpend();
            await fundGas();
            let gp = maxGas; //.mul();


            console.log("Using GP", gp.toString(), "compared to", maxGas.toString());
            let outErc20 = new ethers.Contract(TOKEN_OUT, erc20ABI, ethers.provider);
            let beforeBal = await outErc20.balanceOf(props.ownerAddress);
            let txn = await props.settlementContract.connect(props.relay).fill(order, props.zrxScript.address, encodedCallData, {
                gasPrice: gp,
                gasLimit: bn(600000)
            });
            await expect(txn).to.emit(props.settlementContract, "SwapSuccess");
            await expect(txn).to.emit(props.settlementContract, "PaidGasFunds");
            let r = await txn.wait();
            let afterBal = await outErc20.balanceOf(props.ownerAddress);
            expect(afterBal).to.be.gt(beforeBal);

            console.log("Gas used", r.gasUsed.toString(), "total gas fee", r.gasUsed.mul(gp).toString());
            console.log("Fees", afterBal.sub(beforeBal).toString());
            
        });

        /*
        it("Should handle slippage failures", async function(){
            let gas = ethers.utils.parseEther("1");
            //await depositGas(gas);
            await approveSpend();

            let sBal = await balanceOf({owner: TRADER, token: TOKEN_IN});
            console.log("Starting balance", sBal.toString());

            //simulate price increase by expecting more output than actually produced
            order.output.amount = ethers.utils.parseEther("1");
            let gp = maxGas.mul(2);
            console.log("Using GP", gp.toString(), "compared to", maxGas.toString());
            
            await expect(props.settlementContract.connect(props.relay).fill(order, props.zrxScript.address, encodedCallData, {
                gasPrice: gp
            })).to.emit(props.settlementContract, "SwapFailed");
            //b = await props.settlementContract.connect(props.trader).availableForUse(MATIC_WHALE);
            //expect(b).to.not.eq(gas);

            let eBal = await balanceOf({owner: TRADER, token: TOKEN_IN});
            expect(sBal).to.eq(eBal);
        });
        */

    });
    



});