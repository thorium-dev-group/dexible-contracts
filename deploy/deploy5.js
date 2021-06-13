
const ethers = require("ethers");
const GASPRICE = ethers.utils.parseUnits("35", 9);

const deploySushisapper = async props => {
    if(await alreadyDeployed("ZrxRouter", props)) {
        console.log("SushisZrxRouterwapDex already deployed at", props.ZrxRouter.address);
        return props;
    }
    console.log("Deploying ZrxRouter...");
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
    console.log("ZrxRouter impl gas used", r.gasUsed.toString());
    props.deployCosts.push(r.gasUsed);

    let interface = new ethers.utils.Interface(impl.abi);
    let init = interface.encodeFunctionData("initialize()", []);
    
    let args = [impl.address, props.proxyAdminContract.address, init]
    console.log("Deployed ZrxRouter impl at", impl.address);
    console.log("Deploying ZrxRouter proxy with args", args);
    let proxy = await props.deploy("TransparentUpgradeableProxy", {
        log: true,
        from: props.owner,
        args
    });
    r = proxy.receipt;
    props.deployCosts.push(r.gasUsed);
    console.log("Deployed ZrxRouter proxy at", proxy.address);

    props.zrxProx = proxy;
    props.zrx = impl;
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