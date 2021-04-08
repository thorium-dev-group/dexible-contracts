const factoryABI = require("../abi/IUniswapFactory.json"); 
const uniPairABI = require("../abi/IUniswapPair.json");
const {ethers} = require("hardhat");


const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNI_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const findPair = async function(props) {

    let factory = new ethers.Contract(UNI_FACTORY, factoryABI, ethers.provider);
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