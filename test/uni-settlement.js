const {ethers} = require("hardhat");
const { expect, assert} = require("chai");
const {accounts, settlement, uniswap} = require("./utils/setup");
const {approveRelay} = require("./utils/accounts");
const {setupOrder} = require("./utils/order");
const {reserves}  = require("./utils/uniswap");
const {balanceOf} = require("./utils/erc20");
const erc20ABI = require("./abi/ERC20ABI.json");

const MATIC = "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const MATIC_WHALE = "0xa1B9ae88E04429E1c2A41eaE264aEc5d88914810";
const GASPRICE = ethers.utils.parseUnits("100", 9);

describe("UniSettlement", function() {
    this.timeout(30000);

    let props = {ethers};
    before(async function() {
        props = await accounts(props);
    });

    beforeEach(async function(){
        props = await settlement(props);

        await approveRelay(props);
        props = await uniswap(props);
    });

    

    context("----Settlement With Order----", function() {
        let order = null;
        let encodedPath = null;
        let whale = null;
        let price = null;
        before(async function() {
            let res = await reserves({
                tokenA: MATIC,
                tokenB: WETH
            });
    
            console.log("TokenA", res[0].toString());
            console.log("TokenB", res[1].toString());
            price = res[0].div(res[1]);
            console.log("Price", price.toString());
    
            await ethers.provider.send('hardhat_impersonateAccount', [MATIC_WHALE]);
    
            whale = await ethers.provider.getSigner(MATIC_WHALE);
            order = setupOrder({
                traderAddress: MATIC_WHALE,
                tokenA: {
                    address: MATIC,
                    //include 1% for impact and fee
                    amount: ethers.utils.parseUnits(price.toString(), 18).mul(101).div(100)
                },
                tokenB: {
                    address: WETH,
                    //.5% slippage
                    amount: ethers.utils.parseEther("1").mul(995).div(1000)
                }
            });
            let path = [MATIC, WETH];
            let abi = ethers.utils.defaultAbiCoder;
            encodedPath = abi.encode(["address[]"], [path]);
        });

        const depositGas = async gas => {
            let {
                settlementContract: tester
            } = props;
            await tester.connect(whale).depositGas({
                value: gas
            });
        }

        const requestWithdraw = async gas => {
            let {
                settlementContract: tester
            } = props;
            await tester.connect(whale).requestWithdrawGas(gas);
        }

        const approveSpend = async () => {
            let {
                settlementContract: tester
            } = props;
            let ec20 = new ethers.Contract(MATIC, erc20ABI, ethers.provider);
            await ec20.connect(whale).approve(tester.address, order.input.amount);
        }

        /*
        it("Should not allow fill w/out gas", async function() {
            await expect(
              props.settlementContract.connect(props.relay).fill(order, props.uniswapScript.address, encodedPath, {
                    gasPrice: GASPRICE
                })
            ).to.be.revertedWith("Insufficient gas tank funds");
        });
        */

        it("Should not allow fill w/out approval", async function(){
            //await depositGas(ethers.utils.parseEther("1"));
            await expect(
                props.settlementContract.connect(props.relay).fill(order, props.uniswapScript.address, encodedPath, {
                    gasPrice: GASPRICE
                })
            ).to.be.revertedWith("Insufficient spend allowance on input token");
        });

        /*
        it("Should allow fill w/thawing funds", async function() {
            let gas = ethers.utils.parseEther("1");
            await depositGas(gas);
            await approveSpend();
            await requestWithdraw(gas);
            b = await props.settlementContract.connect(props.trader).availableForUse(MATIC_WHALE);
            expect(b).to.eq(gas);
            await expect(props.settlementContract.connect(props.relay).fill(order, props.uniswapScript.address, encodedPath, {
                gasPrice: GASPRICE
            })).to.emit(props.settlementContract, "SwapSuccess");
            b = await props.settlementContract.connect(props.trader).availableForUse(MATIC_WHALE);
            expect(b).to.not.eq(gas);
        });
        */

        it("Should handle slippage failures", async function(){
            let gas = ethers.utils.parseEther("1");
            //await depositGas(gas);
            await approveSpend();

            let sBal = await balanceOf({owner: MATIC_WHALE, token: MATIC});

            //simulate price increase by expecting more output than actually produced
            order.output.amount = ethers.utils.parseEther("1");
            await expect(props.settlementContract.connect(props.relay).fill(order, props.uniswapScript.address, encodedPath, {
                gasPrice: GASPRICE
            })).to.emit(props.settlementContract, "SwapFailed");
            //b = await props.settlementContract.connect(props.trader).availableForUse(MATIC_WHALE);
            //expect(b).to.not.eq(gas);

            let eBal = await balanceOf({owner: MATIC_WHALE, token: MATIC});
            expect(sBal).to.eq(eBal);
        });

        

    });
    



});