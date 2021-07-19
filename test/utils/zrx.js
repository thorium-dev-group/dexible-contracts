const axios = require('axios');

const endpoints = {
    1: "https://api.0x.org/swap/v1/quote?",
    42: "https://kovan.api.0x.org/swap/v1/quote?"
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
    estimate
}