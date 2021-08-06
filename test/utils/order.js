
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

module.exports = {
    setupOrder
}