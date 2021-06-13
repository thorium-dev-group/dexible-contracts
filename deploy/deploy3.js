
const ethers = require("ethers");

const GASPRICE = ethers.utils.parseUnits("35", 9);
const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const deployUniswapper = async props => {
    if(await alreadyDeployed("UniswapDex", props)) {
        console.log("UniswapDex already deployed at", props.UniswapDex.address);
        return props;
    }
    console.log("Deploying UniswapDex...");
    let libraries = {};
    let all = await props.deployments.all();
    Object.keys(all).forEach(k => {
        let dep = all[k];
        libraries[k] = dep.address;
    });
    let impl = await props.deploy("UniswapDex", {
        from: props.owner,
        gasPrice: GASPRICE,
        libraries
    });
    let r = await impl.receipt;
    console.log("UniswapDex impl gas used", r.gasUsed.toString());
    props.deployCosts.push(r.gasUsed);

    let interface = new ethers.utils.Interface(impl.abi);
    let init = interface.encodeFunctionData("initialize(address,address)", [UNI_FACTORY, UNI_ROUTER]);
    
    let args = [impl.address, props.proxyAdminContract.address, init]
    console.log("Deployed UniswapDex impl at", impl.address);
    console.log("Deploying UniswapDex proxy with args", args);
    let proxy = await props.deploy("TransparentUpgradeableProxy", {
        log: true,
        from: props.owner,
        gasPrice: GASPRICE,
        args
    });
    r = proxy.receipt;
    props.deployCosts.push(r.gasUsed);
    console.log("Deployed UniswapDex proxy at", proxy.address);

    props.uniswapperProxy = proxy;
    props.uniswapper = impl;
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
  console.log("Cost:", asEth(totalGas.mul(GASPRICE)));
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
    props = await deployUniswapper(props);
    printCost(props);
}