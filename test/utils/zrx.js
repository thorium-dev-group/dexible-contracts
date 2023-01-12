const axios = require('axios');
const { ethers } = require('ethers');

const endpoints = {
    1: "https://api.0x.org/swap/v1/quote?",
    42: "https://kovan.api.0x.org/swap/v1/quote?"
}


const bn = ethers.BigNumber.from;

const localEstimate = async function(props) {
    
    let url = process.env.SOR_API;
    if(!url) {
        throw new Error("No SOR_API in env");
    }
    console.log("Chain", props.chainId);
    
    let params = {
        quote: {
            sell: {
                chainId: props.chainId,
                address: props.sellToken,
                amount: props.sellAmount
            },
            buy: {
                chainId: props.chainId,
                address: props.buyToken
            },
            //chainID: props.chainId,
            slippagePercentage: props.slippage,
            order_size: {
                min: props.minInput,
                samples: 25
            },
            fee: {
                feeType: 'relative',
                providerFee: .08
            },
            estimatedGasUsage: 700_000,
            gasPriceGwei: 25
        },
        //maxFixedGas: props.maxFixedGas,
        //fixedPrice: props.fixedPrice
    }

    let r = await axios({
        method: "POST",
        url,
        data: params
    });
    console.log("ZrxResult", r.data);
    return r.data.bestQuote || r.data.best;
}

const estimate = async function(props) {

    let params = {
        baseUrl: endpoints[props.chainId],
        buyToken: props.buyToken,
        sellToken: props.sellToken,
        sellAmount: props.sellAmount,
        slippagePercentage: props.slippage
    };
    
    r = await runQuery(params);
    if(!r || !r.data) {
        console.log("Missing body in response");
        return null;
    }

    let data = r.data;
    return {
        ...data,
        allowanceTarget: data.allowanceTarget,
        price: data.price,
        dexAddress: data.to,
        dexInput: data.data,
        buyAmount: data.buyAmount,
        sellAmount: data.sellAmount,
        estimatedGas: data.estimatedGas,
        gasPrice: data.gasPrice
    }
}

const runQuery = props => {
    let qs = toQueryStr({
        ...props,
        baseUrl: undefined
    });

    let url = `${props.baseUrl}${qs}`;
    console.log("Calling 0x at", url);
    return axios.get(url);
    
}

const toQueryStr = obj => {
    let str = '';
    let first = true;
    for(var p in obj) {
        let v = obj[p];
        if(typeof v === 'undefined') {
            continue;
        }
        v = encodeURIComponent(v);
        if(!first) {
            str += "&";
        }
        str += `${p}=${v}`;
        first = false;
    }
    return str;
}


module.exports = {
    estimate,
    localEstimate
}