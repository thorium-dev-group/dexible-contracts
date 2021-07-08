
//deploy proxy admins

const deploySettlementProxy = async (props) => {
    let {getNamedAccounts, getUnnamedAccounts, deployments, getChainId} = props;
    let [owner, deployAccount] = await getUnnamedAccounts();
    let test = await deployments.getOrNull("ProxyAdmin");
    if(!test) {
        let impl = await deployments.deploy("ProxyAdmin", {
            from: deployAccount
        });
        console.log("Deployed settlement admin", impl.address);
        let r = await deployments.save("SettlementAdmin", impl);
    } else {
        console.log("Skipping settlement proxy deployment, already deployed");
    }
    return props;
}

const deployZrxAdmin = async props => {
    let {getNamedAccounts, getUnnamedAccounts, deployments, getChainId} = props;
    let [owner, deployAccount] = await getUnnamedAccounts();
    let test = await deployments.getOrNull("ProxyAdmin");
    if(!test) {
        let impl = await deployments.deploy("ProxyAdmin", {
            from: deployAccount
        });
        console.log("Deployed zrx admin", impl.address);
        let r = await deployments.save("ZrxAdmin", impl);
    } else {
        console.log("Skipping zrx proxy deployment, already deployed");
    }
}

module.exports = async (props) => {
    await deploySettlementProxy(props).then(deployZrxAdmin); 
}