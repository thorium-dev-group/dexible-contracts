
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

module.exports = {
    setupOrder,
    setupFeeData
}