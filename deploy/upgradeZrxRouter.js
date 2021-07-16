

const deployZrxRouter = async props => {
   /*
    console.log("Deploying new ZrxRouter version...");
    let libraries = {};
    let all = await props.deployments.all();
    Object.keys(all).forEach(k => {
        let dep = all[k];
        libraries[k] = dep.address;
    });

    let impl = await props.deploy("ZrxRouter", {
        from: props.owner,
        libraries
    });
    let r = await impl.receipt;

    console.log("ZrxRouter deployed at block", r.blockNumber, "with hash", r.transactionHash, "status", r.status, "from address", r.from, " using", r.gasUsed.toString(), "gas");
    console.log("Deployed new ZrxRouter at", impl.address);
    return impl;
    */
    
}

module.exports = async ({getUnnamedAccounts, deployments}) => {
    let [owner, proxyOwner] = await getUnnamedAccounts();
    
    let libraries = {};
    let all = await deployments.all();
    Object.keys(all).forEach(k => {
        let dep = all[k];
        libraries[k] = dep.address;
    });

    let diff = await deployments.fetchIfDifferent("ZrxRouter", {
        libraries
    });

    if(!diff) {
        console.log("No differences in ZrxRouter, skipping upgrade");
        return;
    }

    let impl = await deployZrxRouter({
        owner,
        deployments,
        deploy: deployments.deploy 
    });
    if(impl) {
       let txn = await deployments.execute("ProxyAdmin", 
            {from: proxyOwner },
            "upgrade",
            //KOVAN:
            "0x62967831b650DC2d145c6dC979c087C98Cb2F263",
            //MAINNET
            //"0x2d57690EBA381611C77069fbcfC79D4806a4e53e",
            impl.address);
       console.log("Finished upgrading ZrxRouter with txn", txn);
    }
    

}