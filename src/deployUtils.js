
const deployAccess = async props => {
    
    let ethers = props.ethers;
    let ACC = await ethers.getContractFactory("LibAccess");
    if(!ACC) {
        throw new Error("Could not find LibAccess");
    }
    console.log("Deploying access library...");
    let accLib = await ACC.deploy();
    let libR = await accLib.deployTransaction.wait();
    if(!props.deployCosts) {
        props.deployCosts = [];
    }
    props.deployCosts.push(libR.gasUsed);
    console.log("Deployed access library at", accLib.address);
    console.log("Access Library cost", libR.gasUsed.toString());
    props.accLib = accLib;
    return props;
    
}

const deployConfig = async props => {
    
    let ethers = props.ethers;
    const CFG = await ethers.getContractFactory("LibConfig");
    console.log("Deploying config library...");
    let cfgLib = await CFG.deploy();
    libR = await cfgLib.deployTransaction.wait();
    props.deployCosts.push(libR.gasUsed);
    console.log("Deployed config lib at", cfgLib.address);
    console.log("Config library cost", libR.gasUsed.toString());
    props.cfgLib = cfgLib;
    return props;
    
}

const deployGas = async props => {
    
    let ethers = props.ethers;
    console.log("Deploying gas library...");
    const GAS = await ethers.getContractFactory("LibGas");
    let libGas = await GAS.deploy();
    libR = await libGas.deployTransaction.wait();
    props.deployCosts.push(libR.gasUsed);
    console.log("Deployoed gas lib at", libGas.address);
    console.log("Gas library cost", libR.gasUsed.toString());
    props.libGas = libGas;
    return props;
    
}

const setupSettlement = async props => {
    
    return deployAccess(props)
          .then(deployConfig)
          //.then(deployGas)
          .then(deploySettlement);
          
          return props;
}

const deploySettlement = async props => {
   
    const Con = await ethers.getContractFactory("Settlement", {
        libraries: {
            LibAccess: props.accLib.address,
            LibConfig: props.cfgLib.address,
            //LibGas: props.libGas.address
        }
    });
    console.log("Deploying settlement impl...");
    
    let impl = await Con.deploy();
    let r = await impl.deployTransaction.wait();
    console.log("Settlement impl gas used", r.gasUsed.toString());
    props.deployCosts.push(r.gasUsed);

    let init = await configInitializer(props, impl);
    console.log("Deployed settlement impl at", impl.address);
    console.log("Deploying settlement proxy...")
    const PROXY = await ethers.getContractFactory("TransparentUpgradeableProxy"); 
    let proxy  = await PROXY.deploy(impl.address, props.proxyAdminContract.address, init);
    r = await proxy.deployTransaction.wait();
    console.log("Deployed settlement proxy at", proxy.address);
    console.log("Settlement proxy deploy cost", r.gasUsed.toString());
    props.deployCosts.push(r.gasUsed);

    props.settlementContract = new ethers.Contract(proxy.address, impl.interface, props.owner);
    
    return props;
}


const deployFeeCalculator = async props => {
    const Con = await props.ethers.getContractFactory("FeeCalculator");
    console.log("Deploying fee calculator...");
    const impl = await Con.deploy();
    let r = await impl.deployTransaction.wait();
    console.log("To deploy fee calc", r.gasUsed.toString());
    props.feeCalculator = new props.ethers.Contract(impl.address, impl.interface, props.owner);
    return props;
}

const buildConfig = props => {
    let ethers = props.ethers;
    let minFee = props.minFee || 14;
    let penalty = props.penalty || ethers.utils.parseEther("0");
    
    return {
        devTeam: props.ownerAddress,
        minFee: minFee,
        penaltyFee: penalty,
        lockoutBlocks: 4,
    }
}

const configInitializer = async (props, impl) => {
    return await impl.interface.encodeFunctionData('initialize((address,uint128,uint128,uint8))',[buildConfig(props)]);
}

module.exports = {
    deployAccess,
    deployConfig,
    //deployGas,
    deployFeeCalculator,
    deploySettlement,
    setupSettlement
}