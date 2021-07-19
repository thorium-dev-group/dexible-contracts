const {ethers} = require("hardhat");

const bn = ethers.BigNumber.from;
const asUnits = ethers.utils.parseUnits;
const asDec = ethers.utils.formatUnits;

    /**
     * We have to compute the estimated impact on order amounts 
     * if the fee token is the sell token 
     */
const adjustOrder = async ({
    order, 
    sellTokenMeta,
    buyTokenMeta,
    gasPrice, 
    feeTokenDecimals, 
    quoteProxy}) => {
        
    if(order.input.token === order.feeToken) {
        console.log("===== Adjusting Order Buy Amount ====");
        let estGasCost = bn(gasPrice).mul(order.gasEstimate);
        console.log("Estimated gas cost", estGasCost.toString());

        let feeTokenETH = bn(order.feeTokenETHPrice);
        console.log("Fee token ETH", feeTokenETH.toString());

        let gasFee = estGasCost.mul(asUnits("1", feeTokenDecimals)).div(feeTokenETH);
        console.log("Gas portion in input token", gasFee.toString());

        let bpsFee = bn(0);
        bpsFee = bn(order.input.amount).mul(10).div(10000); //in bps

        let totalFee = gasFee.add(bpsFee);
        let newIn = bn(order.input.amount).sub(totalFee);

        console.log("Old input amount", order.input.amount.toString(), "new input", newIn.toString());
        let q  = await quoteProxy.newQuote(newIn);
        let minOut = asDec(newIn, sellTokenMeta.decimals)*q.guaranteedPrice;  
        let buyAmt = asUnits(minOut.toFixed(buyTokenMeta.decimals), buyTokenMeta.decimals);
        console.log("Quote buy amount", q.buyAmount.toString(), "actual buy", buyAmt.toString());

        return {
            order: {
                ...order,
                output: {
                    ...order.output,
                    amount: bn(buyAmt)
                }
            },
            dexInput: q.dexInput
        }
    }
    return {
        order,
        dexInput: null 
    }
}

module.exports = {
    adjustOrder
}

