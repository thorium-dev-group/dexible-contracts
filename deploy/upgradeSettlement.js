

const deploySettlement = async props => {
    
     console.log("Deploying new Settlement version...");
     let libraries = {};
     let all = await props.deployments.all();
     Object.keys(all).forEach(k => {
         let dep = all[k];
         libraries[k] = dep.address;
     });
     let impl = await props.deploy("Settlement", {
         from: props.owner,
         libraries
     });
     let r = await impl.receipt;
     if(r) {
        console.log("Settlement impl gas used", r.gasUsed.toString());
     }
     
     console.log("Deployed new Settlement at", impl.address);
     return impl;   
     
 }
 
 module.exports = async ({getUnnamedAccounts, deployments}) => {
     let [owner, proxyOwner] = await getUnnamedAccounts();
     
     let libraries = {};
     let all = await deployments.all();
     Object.keys(all).forEach(k => {
         let dep = all[k];
         libraries[k] = dep.address;
     });
 
     let diff = await deployments.fetchIfDifferent("Settlement", {
         libraries
     });
 
     if(!diff) {
         console.log("No differences in Settlement, skipping upgrade");
         return;
     }
 
     let impl = await deploySettlement({
         owner,
         deployments,
         deploy: deployments.deploy 
     });
     if(impl) {
            await deployments.execute("ProxyAdmin", 
            {from: proxyOwner},
            "upgrade",
            //KOVAN:
            //"0x147bFD9cEffcd58A2B2594932963F52B16d528b1",
            //MAINNET:
            "0xad84693a21E0a1dB73ae6c6e5aceb041A6C8B6b3",
            impl.address);
         
     }
     
 
 }