const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

const setupOrder = (props) => {
    
    return {
        trader: props.traderAddress,
        feeToken: props.feeToken,
        feeTokenETHPrice: props.feeTokenETHPrice,
        gasEstimate: props.gasEstimate,
        ethUSDPrice: props.ethUSDPrice,
        input: {
            token: props.tokenA.address,
            amount: props.tokenA.amount
        },
        output: {
            token: props.tokenB.address,
            amount: props.tokenB.amount
        }
    };
}

const setupFeeData = props => {
    return {
        feeToken: props.feeToken,
        gasEstimate: props.gasEstimate,
        ethUSDPrice: props.ethUSDPrice,
        feeTokenETHPrice: props.feeTokenETHPrice,
        gasPrice: props.gasPrice,
        feeAmountUSD: props.feeAmountUSD
    }
}

/**
 * 
 * expected input: {
 *    feeToken: string;
 *    affiliate?: string;
 *    affiliagePortion?: BigNumber,
 *    feeTokenETHPrice: BigNumber (price*10^18),
 *    dexibleFee: BigNumber,
 *    gasFee: BigNumber,
 *    trader: string,
 *    input: {
 *        address: string;
 *        amount: BigNumber
 *    },
 *    output: {
 *        address: string;
 *        amount: BigNumber
 *    }
 *    
 * }
 */
const setupV3Order = props => {
    const v3Fees = {
        feeToken: props.feeToken.address,
        affiliate: props.affiliate || ethers.constants.AddressZero,
        affiliatePortion: props.affiliatePortion || BigNumber.from(0),
        feeTokenETHPrice: props.feeTokenETHPrice,
        dexibleFee: props.dexibleFee,
        gasFee: props.gasFee
    }
    return {
        trader: props.trader,
        input: props.input,
        output: props.output,
        fees: v3Fees
    }
}

module.exports = {
    setupOrder,
    setupFeeData,
    setupV3Order
}