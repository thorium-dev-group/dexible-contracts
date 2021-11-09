

const deployFeeCalculator = async props => {
    
    if(await alreadyDeployed("FeeCalculator", props)) {
        console.log("FeeCalculator already deployed at", props.FeeCalculator.address);
        return props;
    }

    
    console.log("Deploying FeeCalculator...");
   
    let impl = await props.deploy("FeeCalculator", {
        from: props.owner
    });
    let r = await impl.receipt;
    console.log("Deployment hash", r.hash);
    console.log("FeeCalculator impl gas used", r.gasUsed.toString(), "deployed to", impl.address);
    return props;
}


const alreadyDeployed = async (name, props) => {
    let lib = await props.deployments.getOrNull(name);
    if(lib) {
        props[name] = lib;
        return true;
    }
    return false;
}


//deploy libraries
module.exports = async ({getUnnamedAccounts, deployments}) => {
    let [owner] = await getUnnamedAccounts();

    let props = {
        deployments,
        deploy: deployments.deploy,
        owner,
    };
    props = await deployFeeCalculator(props);
}