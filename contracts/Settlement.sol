//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./IDexRouter.sol";
import "./BaseConfig.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./Types.sol";
import "./libs/LibStorage.sol";

interface IERC20Metadata {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}

interface WNative is IERC20 {
    function withdraw(uint wad) external; 
}

contract Settlement is BaseConfig {

    using SafeMath for uint256;
    using SafeMath for uint112;
    using SafeMath for uint128;
    using SafeMath for uint;
    using SafeERC20 for IERC20;

    //============= EVENT DEFS =================/
    event TraderPenalized(address indexed trader, 
                          uint256 penalty, 
                          uint256 gasPaid, 
                          string reason);
    event SwapFailed(address indexed trader, 
                     string reason, 
                     IERC20 feeToken, 
                     uint gasFeePaid);
    event SwapSuccess(address indexed trader,
                       uint inputAmount,
                       uint outputAmount,
                       IERC20 feeToken,
                       uint gasFee,
                       uint dexibleFee);
    event ReceivedETH(address indexed sender, uint amount);
    event WithdrewETH(address indexed receiver, uint amount);
    event PaidGasFunds(address indexed relay, uint amount);
    event InsufficientGasFunds(address indexed relay, uint amount);

    event SwapV3Success(address indexed trader,
                        address indexed affiliate,
                        uint inputAmount,
                        uint outputAmount,
                        IERC20 feeToken,
                        uint gasFee,
                        uint affiliateFee,
                        uint dexibleFee
                        );
    event AffiliatePaid(address indexed affiliate, IERC20 token, uint amount);


    //============== CONSTANTS ==============/
    //gas needed after action executes
    uint256 constant OP_GAS = 40_000;

    //for final transfers and events
    uint256 constant GAS_OVERHEAD = 60_000;

    uint16 constant ARBITRUM = 42161;
    uint16 constant OPTIMISM = 10;

    struct BalTracking {
        uint256 beforeIn;
        uint256 beforeOut;
        uint256 afterIn;
        uint256 afterOut;
    }

    receive() external payable {
        emit ReceivedETH(msg.sender, msg.value);
    }

    function v3Fill(Types.V3Order calldata order, IDexRouter router, bytes calldata data) public onlyRelay nonReentrant {
        //the starting gas isn't actually the starting gas since a significant amount has 
        //already been burned loading the contract and libs
        uint256 startGas = gasleft().add(40_000);


        //execute fill
        (bool success, uint outAmount, string memory failReason) = performV3Fill(order, order.output.token.balanceOf(address(this)), data);

        //post-trade actions to transfer fees, etc.
        _postV3Actions(order, success, failReason, startGas, outAmount);
    }

    

    /**
     * Team's ability to withdraw ETH balance from the contract.
     */
    function withdraw(uint amount) public onlyAdmin {
        require(amount <= address(this).balance, "Insufficient balance to make transfer");
        _msgSender().transfer(amount);
        emit WithdrewETH(_msgSender(), amount);
    }

    /**
     * Team's ability to deposit native token into this contract using wrapped 
     * native asset allowance
     */
    function depositWNative(WNative native, uint amount) public {
        uint spend = native.allowance(_msgSender(), address(this));
        require(spend >= amount, "Insufficient spend allowance");
        native.transferFrom(_msgSender(), address(this), amount);
        native.withdraw(amount);
    }

    // @dev initialize the settlement contract 
    function initialize(Types.Config memory config) public initializer {
        BaseConfig.initConfig(config);
    }
    
    /*----------------------- V3 Updates --------------------------*/
    function performV3Fill(Types.V3Order calldata order, uint256 startBal, bytes calldata data) internal 
    returns (bool success, uint outAmount, string memory failReason) {
        //execute action. This is critical that we use our own internal call to actually
        //perform swap inside trycatch. This way, transferred funds to router are 
        //reverted if swap fails

        try this._tryV3Swap{
            gas: gasleft().sub(OP_GAS)
        }(order, startBal, data) returns (bool _success, uint _out, string memory _failReason) {
            if(!_success) {
                console.log("FailReason", _failReason);
            }
            return (_success, _out, _failReason);
        } catch Error(string memory err) {
            console.log("Error thrown", err);
            success = false;
            failReason = err;
            outAmount = 0;
            console.log("FailReason", err);
        } catch {
            console.log("Unknown problem occurred");
            success = false;
            outAmount = 0;
            failReason = "Unknown fail reason";
        }
    }

    function _tryV3Swap(Types.V3Order calldata order, uint256 startBal, bytes calldata _data) external 
    returns (bool, uint, string memory) {
        require(msg.sender == address(this), "Can only be called by settlement contract");
        _preV3Actions(order);

        console.log("Decoding target args");
        //call data contains the target address and data to pass to it to execute
        (address swapTarget, address allowanceTarget, bytes memory data) = abi.decode(_data, (address,address,bytes));
      
        console.log("Approving spend for target", allowanceTarget);
        uint spend = order.input.token.allowance(address(this), allowanceTarget);
        console.log("Spend allowance", spend);

        //for protocols that require zero-first approvals
        if(spend != 0) {
            console.log("0-ing out spend allowance");
            order.input.token.safeApprove(allowanceTarget, 0);
        } else {
            console.log("Token spend does not need to be 0'd out");
        }

        //make sure 0x target has approval to spend this contract's tokens
        order.input.token.safeApprove(allowanceTarget, order.input.amount);

        console.log("Calling swapTarget", swapTarget);
        console.log("Gas left", gasleft());

        (bool s,/*bytes memory returnData*/) = swapTarget.call{gas: gasleft()}(data);
        if(!s) {
            revert("Failed to swap");
        }

        return (true, order.output.token.balanceOf(address(this)).sub(startBal), ""); //abi.decode(returnData, (uint)), "");
    }

    // @dev perform any pre-swap actions, like transferring tokens to router
    function _preV3Actions(Types.V3Order calldata order) internal {
        //transfer input tokens to router so it can perform dex trades
        console.log("Transfering input for trading:", order.input.amount);
        order.input.token.safeTransferFrom(order.trader, address(this), order.input.amount);
        console.log("Expected output", order.output.amount);
    }

     function _computeV3GasFee(Types.V3Order calldata order, uint gasUsed) internal view returns (uint gasFee) {
        console.log("---- Computing Fees -----");
        uint estGasCost = tx.gasprice * gasUsed;
        console.log("Estimated gas cost", estGasCost);
        uint decs = IERC20Metadata(address(order.fees.feeToken)).decimals();
        gasFee = (estGasCost.mul(10**decs)).div(order.fees.feeTokenETHPrice);
        console.log("Gas portion in fee token", gasFee);
    }

    // @dev carry out post-swap actions, transferring funds, etc.
    function _postV3Actions(Types.V3Order calldata order, 
                          bool success, 
                          string memory failReason, 
                          uint startGas, 
                          uint outAmount) internal {

        //reimburse relay estimated gas fees. Add a little overhead for the remaining
        //ops in this function
        console.log("Start gas", startGas);
        console.log("Gas left", gasleft());

        uint256 totalGasUsed = startGas.sub(gasleft()).add(GAS_OVERHEAD);
        console.log("Total gas used", totalGasUsed);

        uint256 gasFee = totalGasUsed.mul(tx.gasprice);
        uint cid;
        assembly {
            cid := chainid()
        }
        if(cid == ARBITRUM) {
            //arbitrum gas cost includes a portion for L1 submission. We account for it 
            //with a multiplier.
            gasFee *= 8;
        }
        console.log("Gas fee", gasFee);

            
        //if there is ETH in the contract, reimburse the relay that called the fill function
        if(address(this).balance < gasFee) {
            console.log("Cannot reimburse relay since do not have enough funds");
            emit InsufficientGasFunds(_msgSender(), gasFee);
        } else {
            console.log("Transfering gas fee to relay");
            _msgSender().transfer(gasFee);
            emit PaidGasFunds(_msgSender(), gasFee);
        }
       
        if(!success) {
            _handleV3Failure(order, totalGasUsed, failReason);
            return;
        } 

        _handleV3Success(order, outAmount);        
    }

    function _handleV3Failure(
        Types.V3Order calldata order,
        uint totalGasUsed,
        string memory failReason
    ) internal {
         //compute fees for failed txn
        uint gasInFeeToken = _computeV3GasFee(order, totalGasUsed);


        //we still owe the gas fees to the team/relay even though the swap failed. This is because
        //the trader may have set slippage too low, thus increasing the chance of failure.
        console.log("Failed gas fee", gasInFeeToken);
        if(order.fees.feeToken == order.input.token) {
            console.log("Transferring partial input token to devteam for failure gas fees");
            order.fees.feeToken.safeTransferFrom(order.trader, LibStorage.getConfigStorage().devTeam, gasInFeeToken);
            emit SwapFailed(order.trader,failReason, order.fees.feeToken, gasInFeeToken);
        
        } else {
            console.log("Fee token is output; therefore cannot reimburse team for failure gas fees");
            emit SwapFailed(order.trader,failReason, order.fees.feeToken, 0);
        }
        
        //tell trader it failed
        console.log("Swap failed");
    }

    function _handleV3Success(
        Types.V3Order calldata order,
        uint outAmount
    ) internal {

        //on success, the gas and bps fee are paid to the dev team
        
        //gross is delta between starting/ending balance before/after swap
        uint grossOut = outAmount;
        console.log("Gross output amount", grossOut);

        uint toTrader = 0;
        uint total = order.fees.dexibleFee.add(order.fees.affiliatePortion).add(order.fees.gasFee);
            
        if(order.fees.feeToken == order.input.token) {
            //if we take fees from the input token,
            //the trader gets all output 
            toTrader = grossOut;
            console.log("Transferring fees from input token to devTeam/affiliate", total);
            
            if(order.fees.affiliatePortion > 0) {
                console.log("Transferring amount to affiliate", order.fees.affiliatePortion);
                order.fees.feeToken.safeTransferFrom(order.trader, order.fees.affiliate, order.fees.affiliatePortion);
                emit AffiliatePaid(order.fees.affiliate, order.fees.feeToken, order.fees.affiliatePortion);
            }
            order.fees.feeToken.safeTransferFrom(order.trader, LibStorage.getConfigStorage().devTeam, order.fees.dexibleFee.add(order.fees.gasFee));
        } else {
            //otherwise, trader gets a portion of the output
            //and team gets rest
            console.log("Reducing output by fees", total);
            toTrader = grossOut.sub(total);

            if(order.fees.affiliatePortion > 0) {
                console.log("Transferring amount to affiliate", order.fees.affiliatePortion);
                order.fees.feeToken.safeTransfer(order.fees.affiliate, order.fees.affiliatePortion);
                emit AffiliatePaid(order.fees.affiliate, order.fees.feeToken, order.fees.affiliatePortion);
            }
            
            //output comes from this contract, not trader for fees
            console.log("Sending fees from output token to team/affiliate", total);
            order.fees.feeToken.safeTransfer(LibStorage.getConfigStorage().devTeam, order.fees.dexibleFee.add(order.fees.gasFee));
        }
        
        console.log("Sending total output to trader", toTrader);
        order.output.token.safeTransfer(order.trader, toTrader);

        emit SwapV3Success(order.trader,
                    order.fees.affiliate,
                    order.input.amount,
                    toTrader, 
                    order.fees.feeToken,
                    order.fees.gasFee,
                    order.fees.affiliatePortion,
                    order.fees.dexibleFee); 
        console.log("Finished swap");
    }

}