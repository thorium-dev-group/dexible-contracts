const {ethers} = require("hardhat");
const { expect, assert} = require("chai");
const {accounts, settlement, zrx} = require("./utils/setup");
const {approveRelay} = require("./utils/accounts");
const {setupOrder} = require("./utils/order");
const {estimate}  = require("./utils/zrx");
const {balanceOf} = require("./utils/erc20");
const erc20ABI = require("./abi/ERC20ABI.json");
const {adjustOrder} = require("./utils/CostEstimator");


describe("SwapRelay", function() {
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

    
    it("Should swap relay roles", async function() {
        let {settlementContract, owner, relayAddress, relay2Address} = props;
        if(!relayAddress || !relay2Address) {
            throw new Error("Don't have relay addresses to swap");
        }
        let role = await settlementContract.RELAY_ROLE();
        let r = await settlementContract.hasRole(role, relayAddress);
        if(!r) {
            throw new Error("Expected relay to have relay role");
        }
        r = await settlementContract.hasRole(role, relay2Address);
        if(r) {
            throw new Error("Did not expect new relay to have relay role");
        }

        await settlementContract.connect(owner).swapRelay(relayAddress, relay2Address);
        r = await settlementContract.hasRole(role, relayAddress);
        if(r) {
            throw new Error("Expected old relay not to have relay role");
        }
        r = await settlementContract.hasRole(role, relay2Address);
        if(!r) {
            throw new Error("Expected new relay to have relay role");
        }
    })

});