const ethers = require("ethers");


const alreadyDeployed = async (name, props) => {
    let lib = await props.deployments.getOrNull(name);
    if(lib) {
        props[name] = lib;
        return true;
    }
    return false;
}

const deployAccess = async props => {
    if(await alreadyDeployed("LibAccess", props)) {
        console.log("LibAccess already deployed at", props.LibAccess.address);
        return props;
    }

    console.log("Deploying LibAccess...");
    let accLib = await props.deploy("LibAccess", {
        from: props.owner,
    });
    let libR = await accLib.receipt || {gasUsed: "0"};
    if(!props.deployCosts) {
        props.deployCosts = [];
    }
    props.deployCosts.push(libR.gasUsed);
    props.allLib = accLib;
    console.log("Deployed access library at", accLib.address);
    console.log("Access Library cost", libR.gasUsed.toString());
    return props;
}

const deployConfig = async props => {
    if(await alreadyDeployed("LibConfig", props)) {
        console.log("LibConfig already deployed at", props.LibConfig.address);
        return props;
    }

    console.log("Deploying LibConfig...");
    let cfgLib = await props.deploy("LibConfig", {
        from: props.owner,
    });
    libR = await cfgLib.receipt;
    props.deployCosts.push(libR.gasUsed);
    console.log("Deployed config lib at", cfgLib.address);
    console.log("Config library cost", libR.gasUsed.toString());
    props.cfgLib = cfgLib;
    return props;
}

const deployGas = async props => {
    
    if(await alreadyDeployed("LibGas", props)) {
        console.log("LibGas already deployed at", props.LibGas.address);
        return props;
    }
    

    console.log("Deploying LibGas...");
    let libGas = await props.deploy("LibGas", {
        from: props.owner,
    });
    libR = await libGas.receipt;
    props.deployCosts.push(libR.gasUsed);
    console.log("Deployoed gas lib at", libGas.address);
    console.log("Gas library cost", libR.gasUsed.toString());
    props.libGas = libGas;
    return props;
}

const asEth = v => {
  return ethers.utils.formatEther(v);
}

const printCost = props => {
  let totalGas = props.deployCosts.reduce((o, c)=>{
                    return c.add(o);
                },ethers.utils.parseEther("0"));
  console.log("Total Deploy Gas Used", totalGas.toString());
}

//deploy libraries
module.exports = async ({getNamedAccounts, getUnnamedAccounts, deployments, getChainId}) => {
    let [owner] = await getUnnamedAccounts();
    let proxy = await deployments.getOrNull("ProxyAdmin");

    let props = {
        deployments,
        deploy: deployments.deploy,
        owner,
        deployCosts: [],
        proxyAdminContract: proxy
    };
    
    props = await deployAccess(props)
                    .then(deployConfig)
    printCost(props);
    
}