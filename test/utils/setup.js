const {ethers} = require("hardhat");
const {setupAccounts} = require('./accounts');
const deploy = require('../../src/deployUtils');


const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const SUSHI_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"; 
const SUSHI_FACTORY = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"; 


const accounts = async function(props) {
    return setupAccounts(props);
}

const settlement = async function(props) {
    console.log("---- Deploying Settlement ----");
    props = await deploy.setupSettlement(props);
    let {deployCosts} = props;
    console.log("Total deploy costs", deployCosts.toString());
    return props;
}

const feeCalculator = async function(props) {
    console.log("Deploying Fee Calculator");
    props = await deploy.deployFeeCalculator(props);
    return props;
}

const uniswap = async function(props) {
    console.log("----- Deploying Uniswap Router ----");
    const Con = await ethers.getContractFactory("UniswapDex", {
        libraries: {
            LibAccess: props.accLib.address
        }
    });
    console.log("Deploying uniswap router script impl...");
    let impl = await Con.deploy();
    let r = await impl.deployTransaction.wait();
    console.log("Uniswap router script impl gas used", r.gasUsed.toString());
    props.deployCosts.push(r.gasUsed);

    let init = impl.interface.encodeFunctionData("initialize(address,address)", [UNI_FACTORY, UNI_ROUTER]);
    const PROXY = await ethers.getContractFactory("TransparentUpgradeableProxy"); 
    let proxy  = await PROXY.deploy(impl.address, props.proxyAdminContract.address, init);
    r = await proxy.deployTransaction.wait();
    props.deployCosts.push(r.gasUsed);
    
    props.uniswapScript = new ethers.Contract(proxy.address, impl.interface, props.owner);

    console.log("Deployed uniswap script");

    return props;
}


const sushiswap = async function(props) {
    console.log("----- Deploying Sushiswap Router ----");
    const Con = await ethers.getContractFactory("SushiswapDex", {
        libraries: {
            LibAccess: props.accLib.address
        }
    });
    console.log("Deploying sushiswap router script impl...");
    let impl = await Con.deploy();
    let r = await impl.deployTransaction.wait();
    console.log("Sushiswap router script impl gas used", r.gasUsed.toString());
    props.deployCosts.push(r.gasUsed);

    let init = impl.interface.encodeFunctionData("initialize(address,address)", [SUSHI_FACTORY, SUSHI_ROUTER]);
    const PROXY = await ethers.getContractFactory("TransparentUpgradeableProxy"); 
    let proxy  = await PROXY.deploy(impl.address, props.proxyAdminContract.address, init);
    r = await proxy.deployTransaction.wait();
    props.deployCosts.push(r.gasUsed);
    
    props.sushiswapScript = new ethers.Contract(proxy.address, impl.interface, props.owner);

    console.log("Deployed sushiswap script");

    return props;
}


const zrx = async function(props) {
    console.log("----- Deploying Zrx Router ----");
    const Con = await ethers.getContractFactory("ZrxRouter", {
        libraries: {
            LibAccess: props.accLib.address
        }
    });
    console.log("Deploying zrx router script impl...");
    let impl = await Con.deploy();
    let r = await impl.deployTransaction.wait();
    console.log("Zrx router script impl deployed to", impl.address, "gas used", r.gasUsed.toString());
    props.deployCosts.push(r.gasUsed);

    let init = impl.interface.encodeFunctionData("initialize()", []);
    const PROXY = await ethers.getContractFactory("TransparentUpgradeableProxy"); 
    let proxy  = await PROXY.deploy(impl.address, props.proxyAdminContract.address, init);
    r = await proxy.deployTransaction.wait();
    props.deployCosts.push(r.gasUsed);
    
    console.log("ZrxProxy address", proxy.address);
    props.zrxScript = new ethers.Contract(proxy.address, impl.interface, props.owner);

    console.log("Deployed zrx script");

    return props;
}

module.exports = {
    accounts,
    settlement,
    uniswap,
    sushiswap,
    zrx,
    feeCalculator
}