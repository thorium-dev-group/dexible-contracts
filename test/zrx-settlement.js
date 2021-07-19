const {ethers} = require("hardhat");
const { expect, assert} = require("chai");
const {accounts, settlement, zrx} = require("./utils/setup");
const {approveRelay} = require("./utils/accounts");
const {setupOrder} = require("./utils/order");
const {estimate}  = require("./utils/zrx");
const {balanceOf} = require("./utils/erc20");
const erc20ABI = require("./abi/ERC20ABI.json");
const {adjustOrder} = require("./utils/CostEstimator");

const MATIC = "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0";
const WETH_MAIN = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI_MAIN = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDC_MAIN = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const IFUND_MAIN = "0x04b5e13000c6e9a3255dc057091f3e3eeee7b0f0";
const UNI_MAIN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";

const MATIC_WHALE = "0xa1B9ae88E04429E1c2A41eaE264aEc5d88914810";
const USDC_WHALE = "0x7E0188b0312A26ffE64B7e43a7a91d430fB20673";

const USDC_KOVAN = "0x2F375e94FC336Cdec2Dc0cCB5277FE59CBf1cAe5";
const DAI_KOVAN =  "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa";
const UNI_KOVAN = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
const WETH_KOVAN = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
const WETH_KOVAN_WHALE = "0xa71937147b55Deb8a530C7229C442Fd3F31b7db2";
const USDC_KOVAN_WHALE = "0x6058233f589DBE86f38BC64E1a77Cf16cf3c6c7e";
const UNI_WHALE = "0x41653c7d61609D856f29355E404F310Ec4142Cfb";
const KOVAN_CALLER = "0xBf341c95C52181D4eCa6cf10c3f17316FD262E39";

const TOKEN_IN = USDC_MAIN;
const TOKEN_OUT = UNI_MAIN;
const TRADER = USDC_WHALE;
const FEE_TOKEN = TOKEN_IN;
const TOKEN_IN_DECS = 6;
const TOKEN_OUT_DECS = 18;
const FEE_TOKEN_DECS = 6;
const IN_AMOUNT = ethers.utils.parseUnits("720", FEE_TOKEN_DECS);
const NETWORK = 1;
const WETH_TOKEN = WETH_MAIN;
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

            let res = await estimate({
                sellToken: TOKEN_IN,
                buyToken: TOKEN_OUT,
                sellAmount: IN_AMOUNT.toString(),
                chainId: NETWORK
            });

            let feeETHPrice = null;
            if(FEE_TOKEN !== WETH_TOKEN) {
                feeETHPrice = await estimate( {
                    sellToken: WETH_TOKEN,
                    buyToken: FEE_TOKEN,
                    sellAmount: ethers.utils.parseEther("1").toString(),
                    chainId: NETWORK
                });
                feeETHPrice.price = 1/feeETHPrice.price;
            } else {
                feeETHPrice = {
                    price: 1
                }
            }

            console.log("Fee ETH price", feeETHPrice.price);

            await ethers.provider.send('hardhat_impersonateAccount', [TRADER]);
            await ethers.provider.send("hardhat_setBalance", [TRADER, ethers.utils.parseEther("1").toHexString().replace(/0x0*/,'0x')]);
            
            let inBal = await inputBalance({
                provider: ethers.provider,
                trader: TRADER,
                token: TOKEN_IN
            });
            console.log("Input token balance", inBal.toString());

            //console.log("RES", res);
            console.log("Original quote output", res.buyAmount.toString());

            console.log("Expected gas", res.estimatedGas);
            maxGas = ethers.utils.parseUnits("30", 9);
            whale = await ethers.provider.getSigner(TRADER);
            console.log("Whale ETH balance", await ethers.provider.getBalance(TRADER));
            order = setupOrder({
                traderAddress: TRADER,
                feeToken: FEE_TOKEN,
                feeTokenETHPrice: ethers.utils.parseEther(feeETHPrice.price.toFixed(18)),
                gasEstimate: ethers.BigNumber.from(450000),
                tokenA: {
                    address: TOKEN_IN,
                    amount: ethers.BigNumber.from(res.sellAmount)
                },
                tokenB: {
                    address: TOKEN_OUT,
                    amount: ethers.BigNumber.from(res.buyAmount)
                }
            });
            console.log("Old order", order);

            let {order:newOrder, dexInput:newDexInput} = await adjustOrder({
                order, 
                gasPrice: maxGas, 
                feeTokenDecimals: FEE_TOKEN_DECS, 
                sellTokenMeta: {
                    address: TOKEN_IN,
                    decimals: TOKEN_IN_DECS
                },
                buyTokenMeta: {
                    address: TOKEN_OUT,
                    decimals: TOKEN_OUT_DECS
                },
                quoteProxy: {
                    newQuote: newIn => {
                        return estimate( {
                            slippage: .005,
                            chainId: NETWORK,
                            sellToken: TOKEN_IN,
                            buyToken: TOKEN_OUT,
                            sellAmount: newIn
                        })
                    }
                }
            });
            order = newOrder;
            console.log("New order", order);
            let abi = ethers.utils.defaultAbiCoder;
            console.log("Allowance target", res.allowanceTarget);
            encodedCallData = abi.encode(["address","address", "bytes"], [res.dexAddress,res.allowanceTarget,newDexInput||res.dexInput]);
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
            let feeErc20 = new ethers.Contract(FEE_TOKEN, erc20ABI, ethers.provider);
            let beforeBal = await feeErc20.balanceOf(props.ownerAddress);
            let txn = await props.settlementContract.connect(props.relay).fill(order, props.zrxScript.address, encodedCallData, {
                gasPrice: gp,
                gasLimit: bn(600000)
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
            order.output.amount = ethers.utils.parseEther("1000");
            let gp = maxGas.mul(2);
            console.log("Using GP", gp.toString(), "compared to", maxGas.toString());
            
            await expect(props.settlementContract.connect(props.relay).fill(order, props.zrxScript.address, encodedCallData, {
                gasPrice: gp
            })).to.emit(props.settlementContract, "SwapFailed");
            let eBal = await balanceOf({owner: TRADER, token: TOKEN_IN});
            if(order.feeToken === order.input.token) {
                //if fee is paid in input, it should have deducted fee
                expect(sBal).to.gt(eBal);
            } else {
                //otherwise it should be the same
                expect(sBal).to.eq(eBal);
            }
        });
        

    });
    



});