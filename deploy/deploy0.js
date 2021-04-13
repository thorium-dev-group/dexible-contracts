
//deploy proxy admin
module.exports = async ({getNamedAccounts, getUnnamedAccounts, deployments, getChainId}) => {
    
    
    let [owner, deployAccount] = await getUnnamedAccounts();
    let test = await deployments.getOrNull("ProxyAdmin");
    if(!test) {
        let impl = await deployments.deploy("ProxyAdmin", {
            from: deployAccount
        });
        console.log("Deployed proxy admin", impl.address);
        let r = await deployments.save("ProxyAdmin", impl);
    } else {
        console.log("Skipping proxy deployment, already deployed");
    }    
}