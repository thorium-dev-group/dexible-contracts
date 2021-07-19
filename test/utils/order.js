
const setupOrder = (props) => {
    
    return {
        trader: props.traderAddress,
        feeToken: props.feeToken,
        feeTokenETHPrice: props.feeTokenETHPrice,
        gasEstimate: props.gasEstimate,
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