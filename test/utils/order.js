
const setupOrder = (props) => {
    
    return {
        trader: props.traderAddress,
        orderType: props.orderType || 0,
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