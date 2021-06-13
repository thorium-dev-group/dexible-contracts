
const dotenv = require('dotenv');
dotenv.config();

const hre = require("hardhat");
const ethers = require("ethers");

async function main() {

    let walletID = process.env.WALLET_ID;
    if(!walletID) {
        throw new Error("Missing WALLET_ID env var");
    }
    let key = process.env[walletID];
    if(!key) {
        throw new Error("WALLET_ID env var does not reference an env var with the wallet's private key");
    }
    let provider = new ethers.providers.InfuraProvider("homestead", process.env.INFURA_KEY);
    let wallet = new ethers.Wallet(key, provider);
    let nonce = process.env.NONCE;
    if(!nonce) {
        throw new Error("NONCE env var is required");
    }
    let gp = process.env.GAS_PRICE || "35";

    let txn = {
        to: wallet.address,
        from: wallet.address,
        gasLimit: ethers.BigNumber.from(21000),
        gasPrice: ethers.utils.parseUnits(gp, 9),
        value: ethers.BigNumber.from(0),
        nonce
    }
    console.log("Sending cancellation");
    let t = await wallet.sendTransaction(txn);
    console.log("Waiting for cancellation", t.hash);
    await t.wait();
    console.log("Confirmed");
    
}

main();