const hre = require("hardhat");
const ethers = require('ethers');

//const MULTI_SIG = "0x5DB6E1b7CE743a2D49B2546B3ebE17132E0Ab04d";

//this is actually BHub wallet, no multisig. After Berlin fork, multi-sig
//payments were causing all txns to fail.
const MULTI_SIG = "0xb631E8650fB4bEfDAe74Ab9f86a9Cb65bC134706"; 

const KOVAN = "0x147bFD9cEffcd58A2B2594932963F52B16d528b1";
const MAINNET = "0xad84693a21E0a1dB73ae6c6e5aceb041A6C8B6b3";

function buildConfig(props) {
    let minFee = props.minFee || ethers.utils.parseEther(".0029");
    let penalty = props.penalty || ethers.utils.parseEther("0");
    return {
        devTeam: props.team,
        minFee: minFee,
        penaltyFee: penalty,
        lockoutBlocks: 4,
    }
}

async function main() {
    let {getSigners, deployments, getChainId} = hre;
    let [owner, deployer] = await hre.ethers.getSigners();
    let chainId = await getChainId();
    if(!chainId) {
        throw new Error("Missing chain ID");
    }
    chainId -= 0;

    //proxy addresses
    //RINKEBY:
    let settlement = null;
    let gp = null;
    let team = owner.address;
    if(chainId === 42) {
        settlement = KOVAN;
        gp = ethers.utils.parseUnits("1", 9);
    } else if(chainId === 1) {
    //MAINNET:
        settlement = MAINNET;
        gp = ethers.utils.parseUnits("15", 9);
        team = MULTI_SIG;
    }

    if(!settlement) {
        throw new Error("Missing or invalid chainId: " + chainId + "(" + typeof chainId + ")");
    }

    console.log("Settlement address", settlement);
    
    let lib = await deployments.getOrNull("Settlement");
    let proxy = new ethers.Contract(settlement, lib.abi, owner);
    proxy.connect(owner);
    let cfg = await proxy.getConfig();
    console.log("CURRENT CONFIG", cfg);

    let newCfg = buildConfig({
        owner: owner.address,
        team
    }, proxy);
    console.log("New config", newCfg);
    let txn = await proxy.setConfig(newCfg, {
        gasPrice: gp
    });
    console.log("Txn", txn.hash);
    await txn.wait();
    console.log("Config updated");
    
}

main();