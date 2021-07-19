
const setupAccounts = async (props) => {
    let accounts = await ethers.getSigners();
    
    let owner = accounts[0];
    let ownerAddress = await owner.getAddress();
    let trader = accounts[1];
    let traderAddress = await trader.getAddress();
    let proxyAdmin = accounts[3];

    let relay = accounts[4];
    let relayAddress = await relay.getAddress();
    
    const AD = await ethers.getContractFactory("ProxyAdmin", proxyAdmin);
    let proxyAdminContract = await AD.deploy();
    let r = await proxyAdminContract.deployTransaction.wait();
    console.log("Deployed proxy admin at", proxyAdminContract.address);
    console.log("ProxyAdmin deploy cost", r.gasUsed.toString());
    
    return {
        ...props,
        ethers,
        accounts,
        owner,
        ownerAddress,
        trader,
        traderAddress,
        relay,
        relayAddress,
        proxyAdminContract,
        proxyAdmin,
        devTeam: owner,
        devTeamAddress: ownerAddress,
        deployCosts: [r.gasUsed]
    }
};

const approveRelay = async props => {
    let {relayAddress,owner, settlementContract}=props;
    console.log("Approving relay", relayAddress);
    let gas = await settlementContract.connect(owner).estimateGas.addRole(settlementContract.RELAY_ROLE(), relayAddress);
    console.log("Gas estimate", gas.toString());
    let price = await props.ethers.provider.getGasPrice();
    console.log("Gas price", price.toString());
    let fee = await price.mul(gas);
    console.log("Total fee", props.ethers.utils.formatEther(fee));
    await settlementContract.connect(owner).addRole(settlementContract.RELAY_ROLE(), relayAddress);
}

module.exports = {
    setupAccounts,
    approveRelay
}