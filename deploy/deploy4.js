
const ethers = require("ethers");

const GASPRICE = ethers.utils.parseUnits("35", 9);
const SUSHI_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"; //"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const SUSHI_FACTORY = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"; //"0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const deploySushisapper = async props => {
    if(await alreadyDeployed("SushiswapDex", props)) {
        console.log("SushiswapDex already deployed at", props.SushiswapDex.address);
        return props;
    }
    console.log("Deploying SushiswapDex...");
    let libraries = {};
    let all = await props.deployments.all();
    Object.keys(all).forEach(k => {
        let dep = all[k];
        libraries[k] = dep.address;
    });
    let impl = await props.deploy("SushiswapDex", {
        from: props.owner,
        gasPrice: GASPRICE,
        libraries
    });
    let r = await impl.receipt;
    console.log("SushiswapDex impl gas used", r.gasUsed.toString());
    props.deployCosts.push(r.gasUsed);

    let interface = new ethers.utils.Interface(impl.abi);
    let init = interface.encodeFunctionData("initialize(address,address)", [SUSHI_FACTORY, SUSHI_ROUTER]);
    
    let args = [impl.address, props.proxyAdminContract.address, init]
    console.log("Deployed SushiswapDex impl at", impl.address);
    console.log("Deploying SushiswapDex proxy with args", args);
    let proxy = await props.deploy("TransparentUpgradeableProxy", {
        log: true,
        from: props.owner,
        gasPrice: GASPRICE,
        args
    });
    r = proxy.receipt;
    props.deployCosts.push(r.gasUsed);
    console.log("Deployed SushiswapDex proxy at", proxy.address);

    props.sushiswapperProxy = proxy;
    props.sushiswapper = impl;
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
    props = await deploySushisapper(props);
    printCost(props);
}