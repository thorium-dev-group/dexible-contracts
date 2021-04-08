const ERC20ABI = require('../abi/ERC20ABI.json');
const {ethers} = require("hardhat");

const balanceOf = async function({owner, token}) {
    let con = new ethers.Contract(token, ERC20ABI, ethers.provider);
    return con.balanceOf(owner);
}

module.exports = {
    balanceOf
}