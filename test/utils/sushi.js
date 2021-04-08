const factoryABI = require("../abi/IUniswapFactory.json"); 
const uniPairABI = require("../abi/IUniswapPair.json");
const {ethers} = require("hardhat");

const SUSHI_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"; 
const SUSHI_FACTORY = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"; 


const findPair = async function(props) {

    let factory = new ethers.Contract(SUSHI_FACTORY, factoryABI, ethers.provider);
    let {
        tokenA,
        tokenB
    } = props;
    return await factory.getPair(tokenA, tokenB);
}

const reserves = async function(props) {
    let lp = await findPair(props);
    if(!lp) {
        throw new Error("No pair found for tokens:" + props.tokenA + "," + props.tokenB);
    }
    lp = new ethers.Contract(lp, uniPairABI, ethers.provider);
    return lp.getReserves();
}


module.exports = {
    findPair,
    reserves
}