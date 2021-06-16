# Contracts

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#usage">Types</a></li>
    <li><a href="#LibStorage">LibStorage</a></li>
    <li><a href="#LibConfig">LibConfig</a></li>
    <li><a href="#LibAccess">LibAccess</a></li>
    <li><a href="#BaseAccess">BaseAccess</a></li>
    <li><a href="#BaseConfig">BaseConfig</a></li>
    <li><a href="#GasTank">GasTank</a></li>
    <li><a href="#DexRouter">DexRouter</a></li>
    <li><a href="#Settlement">Settlement</a></li>
  </ol>
</details>

## Types

This library defines various types used in Settlement contracts and libraries.

<br/><br/>

## LibStorage

### LibStorage Functions

|               |                                                                                            |
|---------------|--------------------------------------------------------------------------------------------|
| `ConfigStorage` | Stores all the config settings for the contracts                                           |
| `AccessStorage` | Stores all the access control role settings for the contracts                              |
| `InitControls`  | Stores all the initialization settings so that the contracts can only be initialized once. |
| `GasStorage`    | Stores all the trader gas tank data                                                        |

<br/><br/>

## LibConfig

Configuration settings for the core Settlement contract is done through a library. The extending contract should provide the admin role protections that prevent just any address from changing the settings.

### LibConfig Functions

|                      |                                                                                                                                                                                                                                                                                                                                                                                                          |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `store`                | This function takes a storage address and config settings and simply sets all the stored variables according to the tuple of settings provided.                                                                                                                                                                                                                                                          |
| `copy`                 | Just copies all the config settings in memory                                                                                                                                                                                                                                                                                                                                                            |
| `get/setDevTeam`    | Retrieves or sets the dev team address. The dev team address is where the fee portion of payments are sent after each fill.                                                                                                                                                                                                                                                                              |
| `get/setLockoutBlocks` | Retrieves or sets the number of blocks a trader must wait before withdrawing their gas deposit. This is to prevent traders from front-running a relay that submitted an order in order to circumvent paying for the execution or forcing a failed txn.                                                                                                                                                   |
| `get/setMinFee`        | Retrieves/sets the minimum fee an order must have to settle through Dexible.                                                                                                                                                                                                                                                                                                                             |
| `get/setPenaltyFee`    | Retrieves/sets a trader penalty fee. A penalty fee was originally intended to penalize traders that attempted to front-run the Dexible relays by removing spend allowance or token balances from their wallets prior to a trade being settled. Currently, the penalty fee is set to 0; but we may install a penalty fee later if we find the relays are losing money due to bad actors in the ecosystem. |


<br/>
<br/>

## LibGas

LibGas is responsible for managing all interactions with a trader's "gas tank" balance. A gas tank is a deposit of ETH that the trader provides to Dexible to pay for automated trading. Each settlement deducts gas and dexible fees from this gas tank.

<br/>

### LibGas Events

|             |                                                                                                                                                                                        |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `GasDeposit`  | This event is emitted when a trader deposits gas. This makes accounting easier on traders to know when and how much gas was deposited into Dexible Settlement contract.                |
| `GasThawing`  | This is emitted when a trader initiates a thaw period in preparation for withdrawing funds. The thaw period, currently 4 blocks, must pass before the trader can withdraw their funds. |
| `GasWithdraw` | This is emitted when a trader finally withdraws funds from their gas tank.                                                                                                             |                                                                                                 |

<br/>

### LibGas Functions

|                             |                                                                                                                                                                                                                                                                                                                                    |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `availableFundsForWithdraw` | This function retrieves the amount of a gas tank balance that is able to be withdrawn immediately. These are funds that have waited the minimum thaw period and are now available to be withdrawn.                                                                                                                                 |
| `availableForUse`           | This function retrieves how much of a trader's gas tank balance is actually available to use for settlement payments. This should not include any amount that is ready for withdraw (i.e. has been requested for withdraw and waited minimum thaw period).                                                                         |
| `thawingFunds`              | This function retrieves the amount of funds currently waiting a minimum number of blocks before it can be withdrawn by the owner. This amount must be initiated by a withdraw request.                                                                                                                                             |
| `hasEnough`                 | This function checks whether the trader has enough available funds in their gas tank to cover the cost of a settlement. This function is not used by the settlement contract and is intended for relays to check if there are sufficient gas tank funds for a user to pay for a trade. This function may be removed in the future. |
| `deposit`                   | This function allows a trader to deposit funds into their gas tank for use in paying for fees and gas refunds to relays.                                                                                                                                                                                                           |
| `thaw`                      | This function initiates the minimum block wait period to withdraw a specified amount of funds.                                                                                                                                                                                                                                     |
| `withdraw`                  | This function allows a trader to withdraw their gas tank funds once the min wait period has expired.                                                                                                                                                                                                                               |
| `deduct`                    | This is an internal function that is used by Settlement to deduct fees and gas reimbursement funds from a trader's gas tank balance.                                                                                                                                                                                               |


<br/><br/>

## LibAccess


LibAccess is a library that is extended by other contracts that makeup the Dexible Settlement contract stack. Specific activities for the core Settlement contract must have proper controls to protect against malicious actors. Namely, changing configuration, pausing contract operations, and approving relay wallets submitting fill requests are all limited to addresses on an access list. There is also an "action" role that was previously used to limit which contracts the core settlement contract could use to settle fills (uniswap, sushiswap, etc); but the action role is now reserved for future extensions.

### LibAccess Functions

|                |                                                                                                                                                                                                                                                                                                       |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `_addRole`     | This function should only be callable by addresses with 'admin' role to associate other addresses with a specific role. It's an internal function so that only an extending contracts can make calls to it. The parent contract is responsible for checking calling addresses against the admin role. |
| `hasRole`      | This function checks whether an address has a specific role. This is a public view-only function that merely looks up the role and address to see if it's recorded before.                                                                                                                            |
|  `_revokeRole` | This function removes a specific role for an address. It's an internal function that can only be called by extending contracts. It is the extending contract's responsibility to make sure the caller has the correct admin role to revoke other roles.                                               |


## BaseAccess

This is a base contract that manages all the access control logic. It defines all the hashes for the various roles we need to manage as well as modifiers needed for function-level access control. This controle uses LibAccess to manipulate AccessStorage fields.

### BaseAccess Functions

|              |                                                                                                                                                            |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `_msgSender`   | This function is similar to OpenZepplin's _msgSender function so that future versions may apply meta-txns and abstract the message sender from msg.sender. |
| `hasRole`      | Checks whether an address has a particular role.                                                                                                           |
| `onlyAdmin`    | Modifier to check whether the calling address has the admin role                                                                                           |
| `onlyPauser`   | Modifier to check whether the calling address has the pauser role. Note that pausing is not currently implemented.                                         |
| `onlyRelay`    | Modifier to check whether the calling address has a relay role                                                                                             |
| `initializer`  | Similar to OpenZepplin's initializer modifier, marks a function as only be callable one time just after deployment.                                        |
| `nonReentrant` | Similar to OpenZepplin's nonReentrant modifier, makes sure that a function cannot be called recursively by another contract.                               |
| `addRole`      | Adds a role to an address. Only admins should be allowed to call this function.                                                                            |
| `revokeRole`   | Remove a role from an address. Only admins should be allowed to call this function.                                                                        |
| `_setupRole`   | This is called internally to setup roles. It is defined internally so that initialize functions can call to establish initial admin roles.                 |
| `initAccess`   | Internal function to initialize access to admin initializing the contract.                                                                                 |

## BaseConfig

This contract extends BaseAccess and controls access to configuration settings for the core contracts. It uses LibConfig to manipulate ConfigStorage settings.

### BaseConfig Functions

|                  |                                                                                                                     |
|------------------|---------------------------------------------------------------------------------------------------------------------|
| `initConfig`       | Initializer function to setup initialize config settings.                                                           |
| `getConfig`        | Retrieves current config settings                                                                                   |
| `getDevTeam`       | Readonly function to get the dev team wallet address                                                                |
| `getLockoutBlocks` | Readonly function to get the minimum number of wait blocks before trader can withdraw funds getMinFee               |
| `getMinFee`        | Readonly function to get the minimum fee that every order settlement request must have getPenaltyFee                |
| `getPenaltyFee`    | Get the trader penalty fee (currently 0). This is not currently in use but is here for future iteration if needed.  |
| `setConfig`        | Set all settings in bulk. Only admins can call this function.                                                       |
| `setDevTeam`       | Sets the dev team address. Only admins can call this function.                                                      |
| `setLockoutBlocks` | Set the min wait blocks. Only admins can call this function.                                                        |
| `setMinFee`        | Set the min fee for settlement orders. Only admins can call this function.                                          |
| `setPenaltyFee`    | Set the trader penalty fee. Only admins can call this function.                                                     |


## GasTank

This contract manages logic around gas tank management. It relies on LibGas to manipulate Gas Storage fields. It extends BaseConfig, and by proxy BaseAccess, for configuration and access control management.

|                         |                                                                                                                                                                                 |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `availableGasForWithdraw` | Retrieves a trader's current gas tank amount that can be withdrawn. These are funds that should have waited the minimum thaw period and are now available for withdraw.         |
| `availableForUse`         | Retrieves the amount of a trader's gas tank that is available to pay for fees and gas. This should not include funds available for withdraw.                                    |
| `thawingFunds`            | Retrieves the amount of funds a trader is thawing waiting for minimum block period to pass before withdraw is allowed.                                                          |
| `hasEnoughGas`            | Checks whether a trader has enough gas tank funds to pay a specified amount.                                                                                                    |
| `depositGas`              | Allows a trader to deposit funds into a gas tank to pay fees and gas for settlement.                                                                                            |
| `requestWithdrawGas`      | Allows a trader to request that a certain amount of their gas tank balance be made available for withdraw after a minimum block thaw period (currently configured as 4 blocks). |
| `withdrawGas`             | Allows a trader to withdraw their gas funds after they've thawed for the minimum wait period.                                                                                   |
| `deduct`                  | An internally called function to deduct funds from a trader's gas tank once settlement request has finished.                                                                    |

## DexRouter

A "router" in the Dexible context refers to a source of liquid through which to settle trades. Different router implementations will rely on different sources. For example, the ZrxRouter relies on the 0x Dex Aggregator while UniswapRouter relies on UniswapV2.

`fill` — This is the primary function called on the router in order to swap tokens on behalf of a trader. The full order details and router-specific call data is provided to carry out the swap. Note that input tokens for the fill are transferred to the router prior to calling this function. The router's job is to satisfy the output token requirements of the order in whatever way it can.


## Settlement

### Settlement Events

|                 |                                                                                                                                                                                                                                                                       |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `TraderPenalized` | Not currently used, but a future version may include trader penalties if traders front-run relays to remove token balances or spend allowances in order to prevent trades from succeeding.                                                                            |
| `SwapFailed`      | This is emitted if a swap failed due to excessive slippage or other normal market conditions. Note that the transaction itself does not fail; rather, the trader is charged for gas (but not Dexible trading fees) but their swapped token balance remains unchanged. |
| `SwapSuccess`     | This is emitted when a swap succeeds.                                                                                                                                                                                                                                 |
*A Note About Gas Estimates*
The settlement contract reimburses Dexible relay wallets based on an estimate of what the actual gas costs will be. In practice this varies depending on the tokens being traded. While we've tried to minimize estimate overages, it inevitably works out such that most transaction reimbursements are higher than actual gas costs. If there is a more accurate method of getting the actual gas costs in solidity, we will employ that method immediately. In the meantime, the Settlement contract uses estimates for how much gas costs will be and deducts those estimates from the trader's gas tank balance.

### Settlement Fills + Risks

#### Fill

`fill`

This is the primary function to settle fill requests through Dexible. It can only be called by relays and cannot be recursively called by any other contract or relay. The purpose of the function is to:

* Verify the trader has sufficient funds to trade (input token)
* Verify the trader has given the Settlement contract sufficient approval to spend input tokens
* Verify the trader has enough gas to pay for the trade
* Transfer input tokens to a specified IDexRouter address
* Delegate token swapping to the specified IDexRouter
* Verify that post-trade output token balances satisfied the trader's expectation
* Deduct fees from the trader's gas tank balance
* Pay the dev team the Dexible fee (currently fixed at .0029E)
* Reimburse the relay wallet (caller) with sufficient funds to pay the txn fee

The fill function relies on a trycatch mechanism to catch problems that may occur due to slippage and still allows the txn to succeed so that relays are reimbursed regardless of trade outcome. Certain conditions, however, should be charged back to Dexible since the relay should have checked those conditions prior to sending the txn on-chain (token balance, spend allowance, and gas tank balance for example).

#### Risks

**Dexible-Owned Output Token**
Since trades are fully automated, and only Dexible relay wallets can request order fills, it is possible that Dexible could introduce a dummy token, with its own liquidity pool in Uniswap, and submit orders to swap a trader's approved input tokens for its own dummy token. While this would completely destroy Dexible's reputation and make the system completely pointless; it is something the community has concerns over.

One possible mitigation is to introduce approval checks for both input and output tokens. This way, traders who are concerned can pay the additional fees to only allow trades into tokens they approve. This would prevent Dexible from swapping into unknown tokens without explicit approval from traders.

**Rouge Dexible Orders**
If Dexible were to have a rogue employee that uses the infrastructure to submit bad orders for trader addresses, the trader would end up owning assets that they did not approve. The above mitigation would limit the loss to only tokens they approve; however, it would still end up leaving the trader with trades they didn't expect at prices they probably didn't want.

One way to prevent this is to ensure that all order details are signed at the time of submission and that signature be verified as part of every order fill request. This would have to be done internal to Dexible, however, since full order details are sensitive to traders and should not be disclosed publicly. A proof mechanism could be developed such that the Settlement contract can prove that the given settlement request is in fact part of a larger approval. More thought would be needed to mitigate this inherent risk of centralized automation systems.



### Settlement Functions

|              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `_hasFunds`    | An internally used function to check whether a trader has sufficient funds to pay for the trade. Note that the gas estimate uses a fixed 450k gas limit with the order's specified gas price to compute gas fees (see estimate note above). It adds the dexible fee and any fees that the liquid source might charge, along with a penalty fee (currently not used). As long as they have enough to pay all of this, the settlement will go through. This reverts and charges the Dexible relay if insufficient funds because the relay should have checked first. |
| `_hasTokens`   | An internally used function to check whether the trader has sufficient token balance for the Settlement contract to satisfy the order request. This reverts if there are insufficient tokens for the trade and charges the Dexible relay. This is because the relay should have checked the token balance prior to submitting on-chain; however, a future version may actually penalize the trader if Dexible can publicly guarantee that it verified token balance prior to submitting on-chain.                                                                  |
| `_canSpend`    | An internally used function to check whether the trader has spend allowance for Settlement contract for the input tokens being traded. It reverts if there is insufficient spend allowance and charges the Dexible relay since it should have checked for spend allowance prior to submitting on-chain. See note above about potential penalties in the future.                                                                                                                                                                                                    |
| `_preCheck`    | This internally called function simply wraps up the _hasFunds, _hasTokens, and _canSpend function calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `_preActions`  | Sets up the trade prior to calling the IDexRouter implementation specified. It merely transfers funds to the router.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `performFill`  | Internal call to wrap the router fill call in a trycatch so that we can properly handle swap failures. Note that we deduct a certain amount of gas out of the call to allow for post-call processing (fee deductions, reimbursements, events, etc)                                                                                                                                                                                                                                                                                                                 |
| `_trySwap`     | The actual call to the IDexRouter to swap tokens. This will revert if the swap fails on the IDexRouter side.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `_postCheck`   | Internal function to check token balances after a swap completes. If the swap failed, we have to make sure funds were given back to the trader. If it succeeded, we have to make sure the output token balance satisfied the order requirements and that input token balance changed appropriately as well.                                                                                                                                                                                                                                                        |
| `_postActions` | Internal function to perform post-fill updates. If the swap failed, it must still deduct the gas fee from the trader's gas tank. If succeeded, it must reimburse the relay and pay the Dexible fee from the trader's gas tank balance.                                                                                                                                                                                                                                                                                                                             |v