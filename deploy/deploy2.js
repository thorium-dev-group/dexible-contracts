
const ethers = require("ethers");


const buildConfig = props => {
    let minFee = props.minFee || ethers.utils.parseEther(".0029");
    let penalty = props.penalty || ethers.utils.parseEther("0");
    
    return {
        devTeam: props.owner,
        minFee: minFee,
        penaltyFee: penalty,
        lockoutBlocks: 4,
    }
}

const configInitializer = async (props, impl) => {
    return await impl.interface.encodeFunctionData('initialize((address,uint128,uint128,uint8))',[buildConfig(props)]);
}


const deploySettlement = async props => {
    
    if(await alreadyDeployed("Settlement", props)) {
        console.log("SwapSettlment already deployed at", props.Settlement.address);
        return props;
    }
    console.log("Deploying Settlement...");
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
    console.log("Settlement impl gas used", r.gasUsed.toString());
    props.deployCosts.push(r.gasUsed);
    let interface = new ethers.utils.Interface(impl.abi);
    let init = await configInitializer(props, {interface});
    let args = [impl.address, props.proxyAdminContract.address, init]
    console.log("Deployed settlement impl at", impl.address);
    console.log("Deploying settlement proxy with args", args);
    let proxy = await props.deploy("TransparentUpgradeableProxy", {
        log: true,
        from: props.owner,
        args
    });
    r = proxy.receipt;
    props.deployCosts.push(r.gasUsed);
    console.log("Deployed settlement proxy at", proxy.address);
    props.settlementProxy = proxy;
    props.settlement = impl;
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


const alreadyDeployed = async (name, props) => {
    let lib = await props.deployments.getOrNull(name);
    if(lib) {
        props[name] = lib;
        return true;
    }
    return false;
}


//deploy libraries
module.exports = async ({getNamedAccounts, getUnnamedAccounts, deployments, getChainId}) => {
    let [owner] = await getUnnamedAccounts();
    let proxy = await deployments.getOrNull("ProxyAdmin");
    if(!proxy) {
        throw new Error("Missing proxy admin contract");
    }

    let props = {
        deployments,
        deploy: deployments.deploy,
        owner,
        deployCosts: [],
        proxyAdminContract: proxy
    };
    props = await deploySettlement(props);
    printCost(props);
}