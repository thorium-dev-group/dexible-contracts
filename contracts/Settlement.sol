//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./IDexRouter.sol";
import "./GasTank.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./Types.sol";

contract Settlement is GasTank {

    using SafeMath for uint256;
    using SafeMath for uint112;
    using SafeMath for uint128;
    using SafeMath for uint;
    using SafeERC20 for IERC20;

    //============= EVENT DEFS =================/
    event TraderPenalized(address indexed trader, uint256 penalty, uint256 gasPaid, string reason);
    event SwapFailed(address indexed trader, uint gasPaid, string reason);
    event SwapSuccess(address indexed trader,
                       address indexed executor, 
                       uint inputAmount,
                       uint outputAmount,
                       uint fee,
                       uint gasPaid);

    //============== CONSTANTS ==============/
    //estimate gas usage for testing a user's deposit
    uint256 constant GAS_ESTIMATE = 450_000;

    //extra overhead for transferring funds
    uint256 constant GAS_OVERHEAD = 60_000;

    //gas needed after action executes
    uint256 constant OP_GAS = 80_000;

    struct BalTracking {
        uint256 inBal;
        uint256 outBal;
        uint256 afterIn;
        uint256 actualOut;
    }

    /**
     * Fill an order using the given router and forwarded call data.
     */
    function fill(Types.Order memory order, IDexRouter router, bytes calldata data) public onlyRelay nonReentrant {

        uint256 startGas = gasleft();
        //pre-trade condition checks
        BalTracking memory _tracker = _preCheck(order);

        //pre-trade actions to setup trade/router
        _preActions(order, router);

        //execute action
        (bool success, string memory failReason) = performFill(order, router, data);

        //post-trade condition check
        _postCheck(order, _tracker, success);

        //post-trade actions to transfer fees, etc.
        _postActions(order, success, failReason, _tracker, startGas);
    } 

    // @dev initialize the settlement contract 
    function initialize(Types.Config memory config) public initializer {
        BaseConfig.initConfig(config);
    }


    // @dev whether the trader has gas funds to support order at the given gas price
    function _hasFunds(Types.Order memory order, uint256 gasPrice) internal view returns (bool) {
        uint256 gas = GAS_ESTIMATE.mul(gasPrice);
        uint256 total = gas.add(order.fee)
                           .add(order.dexFee)
                           .add(LibStorage.getConfigStorage().penaltyFee);
        
        bool b = this.hasEnoughGas(order.trader, total);
        return b;
    }

    // @dev whether the trader has a token balance to support input side of order
    function _hasTokens(Types.Order memory order) internal view returns (bool) {
        bool b = order.input.token.balanceOf(order.trader) >= order.input.amount;
        return b;
    }

    // @dev whether the trader has approved this contract to spend enought for order
    function _canSpend(Types.Order memory order) internal view returns (bool) {
        bool b = order.input.token.allowance(order.trader, address(this)) >= order.input.amount;
        return b;
    }

    function _preCheck(Types.Order memory order) internal view returns (BalTracking memory) {
        require(_hasFunds(order, tx.gasprice), "Insufficient gas tank funds");
        require(_hasTokens(order), "Insufficient input token balance to trade");
        require(_canSpend(order), "Insufficient spend allowance on input token");
        //before balances
        return BalTracking(
            order.input.token.balanceOf(order.trader),
            order.output.token.balanceOf(order.trader),
            0,0
        );
    }

    function _preActions(Types.Order memory order, IDexRouter router) internal {
        //transfer input tokens to router so it can perform dex trades
        order.input.token.safeTransferFrom(order.trader, address(router), order.input.amount);
        if(order.dexFee > 0) {
            //pay ETH fee to DEX if rquired
            payable(address(router)).transfer(order.dexFee);
        }
    }

    function performFill(Types.Order memory order, IDexRouter router, bytes calldata data) internal returns (bool success, string memory failReason) {
        try router.fill{gas: gasleft().sub(OP_GAS)}(order, data) {
            success = true;
        } catch Error(string memory err) {
            success = false;
            failReason = err;
        } catch {
            success = false;
            failReason = "Unknown fail reason";
        }
    }

    function _postCheck(Types.Order memory order, BalTracking memory _tracking, bool success) internal view {
        
        _tracking.afterIn = order.input.token.balanceOf(order.trader);

        if(!success) {
            //have to revert if funds were not refunded in order to roll everything back.
            //in this case, the router is at fault, which is Dexible's fault and therefore 
            //Dexible relay address should eat the cost of failure
            require(_tracking.afterIn == _tracking.inBal, "failed trade action did not refund input funds");
        } else {
            _tracking.actualOut = order.output.token.balanceOf(order.trader);
            //if the in/out amounts don't line up, then transfers weren't made properly in the
            //router.

            require(_tracking.actualOut > _tracking.outBal, "Insufficient output produced");
            require(_tracking.actualOut.sub(_tracking.outBal) >= order.output.amount, "Trade action did not transfer output tokens to trader");
            require(_tracking.afterIn < _tracking.inBal, "Input tokens not used!");
            require(_tracking.inBal.sub(_tracking.afterIn) <= order.input.amount, "Used too many input tokens");
            
        }
          
    }

    function _postActions(Types.Order memory order, 
                          bool success, 
                          string memory failReason, 
                          BalTracking memory _tracking,
                          uint startGas) internal {
        if(!success) {
            //pay relayer back their gas but take no fee
            uint256 totalGasUsed = startGas.sub(gasleft()).add(GAS_OVERHEAD);
            uint256 gasFee = totalGasUsed.mul(tx.gasprice);
            deduct(order.trader, uint112(gasFee));
             //tell trader it failed
            emit SwapFailed(order.trader, gasFee, failReason);

            //console.log("Paying gas", gasFee);
            _msgSender().transfer(gasFee);
        } else {
            //otherwise, pay fee and gas
            uint256 totalGasUsed = startGas.sub(gasleft()).add(GAS_OVERHEAD);
            uint256 gasFee = totalGasUsed.mul(tx.gasprice);
            deduct(order.trader, uint112(gasFee.add(order.fee).add(order.dexFee)));

            _msgSender().transfer(gasFee);
            payable(LibStorage.getConfigStorage().devTeam).transfer(order.fee);
        
            emit SwapSuccess(order.trader,
                        _msgSender(),
                        _tracking.inBal.sub(_tracking.afterIn),
                        _tracking.actualOut.sub(_tracking.outBal),
                        order.fee.add(order.dexFee),
                        gasFee);
        }
    }
}