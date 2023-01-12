const {ethers} = require("hardhat");
const { expect, assert} = require("chai");
const {accounts, settlement, zrx} = require("./utils/setup");
const {approveRelay} = require("./utils/accounts");
const {setupOrder} = require("./utils/order");
const {estimate, localEstimate}  = require("./utils/zrx");
const {balanceOf} = require("./utils/erc20");
const erc20ABI = require("./abi/ERC20ABI.json");
const {adjustOrder} = require("./utils/CostEstimator");

const MATIC_MAIN = "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0";
const WETH_MAIN = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI_MAIN = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDC_MAIN = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const IFUND_MAIN = "0x04b5e13000c6e9a3255dc057091f3e3eeee7b0f0";
const UNI_MAIN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
const LDO_MAIN = "0x5a98fcbea516cf06857215779fd812ca3bef1b32";
const BADGER_MAIN = "0x3472a5a71965499acd81997a54bba8d852c6e53d";
const WBTC_MAIN = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599";

const MATIC_WHALE = "0xC131701Ea649AFc0BfCc085dc13304Dc0153dc2e";
const USDC_WHALE = "0x7E0188b0312A26ffE64B7e43a7a91d430fB20673";
const WETH_WHALE = "0x725a1fe791b9081492442518596a2E9e4dc4711b";

const USDC_KOVAN = "0x2F375e94FC336Cdec2Dc0cCB5277FE59CBf1cAe5";
const DAI_KOVAN =  "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa";
const UNI_KOVAN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
const WETH_KOVAN = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
const WETH_KOVAN_WHALE = "0xa71937147b55Deb8a530C7229C442Fd3F31b7db2";
const USDC_KOVAN_WHALE = "0x6058233f589DBE86f38BC64E1a77Cf16cf3c6c7e";
const UNI_WHALE = "0x41653c7d61609D856f29355E404F310Ec4142Cfb";
const KOVAN_CALLER = "0xBf341c95C52181D4eCa6cf10c3f17316FD262E39";

const POLY_MATIC = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
const POLY_WBTC = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
const POLY_WETH = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";

const POLY_MATIC_WHALE = "0x2ee05Fad3b206a232E985acBda949B215C67F00e"

const TOKEN_IN = MATIC_MAIN;
const TOKEN_OUT = WBTC_MAIN;
const TRADER = MATIC_WHALE;
const FEE_TOKEN = TOKEN_IN;
const TOKEN_IN_DECS = 18;
const TOKEN_OUT_DECS = 8;
const FEE_TOKEN_DECS = 18;
const IN_AMOUNT = ethers.utils.parseUnits("1200", TOKEN_IN_DECS);
const NETWORK = 1;
const WETH_TOKEN = WETH_MAIN;
const bn = ethers.BigNumber.from;
const GAS_PRICE = ethers.utils.parseUnits("100", 9);

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

    const inputBalance = (props) => {
        let {
            provider,
            trader,
            token
        } = props;
        let erc = new ethers.Contract(token, erc20ABI, provider);
        return erc.balanceOf(trader);
    }

    context("----Settlement With Order----", function() {
        let order = null;
        let encodedCallData = null;
        let whale = null;
        let price = null;
        let maxGas = null;
        before(async function() {
            console.log("======= BEFORE TEST =========");

            let res = await localEstimate({
                maxFixedGas: GAS_PRICE.toString(),
                sellToken: TOKEN_IN,
                buyToken: TOKEN_OUT,
                sellAmount: IN_AMOUNT.toString(),
                chainId: NETWORK,
                slippage: .005,
                minInput: bn(1).toString(),
            });

            if(res.bestQuote) {
                res = res.bestQuote;
            }

            props.quote = res;
            const fees = res.fees;
           
            console.log("Fee MATIC price", res.feeTokenETHPrice);
            console.log("MATIC usd price", res.ethUSDPrice);

            await ethers.provider.send('hardhat_impersonateAccount', [TRADER]);
            //await ethers.provider.send("hardhat_setBalance", [TRADER, ethers.utils.parseEther("1000000").toHexString().replace(/0x0*/,'0x')]);
            
            console.log("Network", await ethers.provider.getNetwork());
            let inBal = await inputBalance({
                provider: ethers.provider,
                trader: TRADER,
                token: TOKEN_IN
            });
            console.log("Input token balance", inBal.toString());

            //console.log("RES", res);
            console.log("Original quote output", res.buyAmount.toString());

            console.log("Expected gas", res.estimatedGas);
            maxGas = GAS_PRICE;
            whale = await ethers.provider.getSigner(TRADER);
            console.log("Whale ETH balance", await ethers.provider.getBalance(TRADER));
            console.log("feeTokenETHPrice", res.feeTokenETHPrice);
            const minBuyAmount = bn(res.buyAmountAfterFees); //minGrossOutput);
            console.log("Min buy", minBuyAmount.toString());

            order = setupOrder({
                traderAddress: TRADER,
                feeToken: res.feeToken.address,
                feeTokenETHPrice: bn(res.feeTokenETHPrice),
                ethUSDPrice: bn(res.ethUSDPrice),
                gasEstimate: bn(res.adjustedGasEstimate),
                tokenA: {
                    address: TOKEN_IN,
                    amount: bn(res.sellAmount)
                },
                tokenB: {
                    address: TOKEN_OUT,
                    amount: minBuyAmount
                }
            });
           
            console.log("Order", order);
            let abi = ethers.utils.defaultAbiCoder;
            console.log("Allowance target", res.allowanceTarget);
            encodedCallData = abi.encode(["address","address", "bytes"], [res.dexAddress||res.to,res.allowanceTarget,res.data]);
            console.log("========= END BEFORE TEST ==========");
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
            let feeErc20 = new ethers.Contract(props.quote.feeToken.address, erc20ABI, ethers.provider);
            let beforeBal = await feeErc20.balanceOf(props.ownerAddress);
            let txn = await props.settlementContract.connect(props.relay).fill(order, props.zrxScript.address, encodedCallData, {
                gasPrice: gp,
                gasLimit: bn(800000)
            });
            await expect(txn).to.emit(props.settlementContract, "SwapSuccess");
            await expect(txn).to.emit(props.settlementContract, "PaidGasFunds");
            let r = await txn.wait();
            let afterBal = await feeErc20.balanceOf(props.ownerAddress);
            expect(afterBal).to.be.gt(beforeBal);

            console.log("Gas used", r.gasUsed.toString(), "total gas fee", r.gasUsed.mul(gp).toString());
            console.log("Fees", afterBal.sub(beforeBal).toString());
        });

        
        it("Should handle slippage failures", async function(){
            await approveSpend();
            await fundGas();

            let sBal = await balanceOf({owner: TRADER, token: TOKEN_IN});
            console.log("Starting balance", sBal.toString());

            //simulate price increase by expecting more output than actually produced
            order.output.amount = ethers.utils.parseUnits("1000", TOKEN_OUT_DECS);
            let gp = maxGas.mul(2);
            console.log("Using GP", gp.toString(), "compared to", maxGas.toString());
            
            let txn = await props.settlementContract.connect(props.relay).fill(order, props.zrxScript.address, encodedCallData, {
                gasPrice: gp,
                gasLimit: bn(800000)
            });

            const r = await txn.wait();
            expect(txn).to.emit(props.settlementContract, "SwapFailed");
            let eBal = await balanceOf({owner: TRADER, token: TOKEN_IN});
            if(order.feeToken === order.input.token) {
                //if fee is paid in input, it should have deducted fee
                expect(sBal).to.gt(eBal);
            } else {
                //otherwise it should be the same
                expect(sBal).to.eq(eBal);
            }

            console.log("Gas used", r.gasUsed.toString(), "total gas fee", r.gasUsed.mul(gp).toString());
        });

    });
    



});