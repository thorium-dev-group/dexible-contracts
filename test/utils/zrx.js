const axios = require('axios');

//const BASE_URL = "https://api.0x.org/swap/v1";
const BASE_URL = "https://kovan.api.0x.org/swap/v1";
const QUOTE_URL = `${BASE_URL}/quote?`;


const estimate = async function(props) {

    let params = {
        buyToken: props.buyToken,
        sellToken: props.sellToken,
        sellAmount: props.sellAmount,
        feeRecipient: props.devTeam,
        buyTokenPercentageFee: .001
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
    let qs = toQueryStr(props);

    let url = `${QUOTE_URL}${qs}`;
    return axios.get(url);
    
}

const toQueryStr = obj => {
    let str = '';
    let first = true;
    for(var p in obj) {
        let v = encodeURIComponent(obj[p]);
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