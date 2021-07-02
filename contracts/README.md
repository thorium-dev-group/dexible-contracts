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
    <li><a href="#DexRouter">DexRouter</a></li>
    <li><a href="#Settlement">Settlement</a></li>
  </ol>
</details>

<br/>
<hr/>
<br/>

## Types

This library defines various types used in Settlement contracts and libraries.

<br/>

## LibStorage

### LibStorage Functions

|               |                                                                                            |
|---------------|--------------------------------------------------------------------------------------------|
| `ConfigStorage` | Stores all the config settings for the contracts                                           |
| `AccessStorage` | Stores all the access control role settings for the contracts                              |
| `InitControls`  | Stores all the initialization settings so that the contracts can only be initialized once. |

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
| `get/setMinFee`        | No longer in use                                                                                                                                                                                                                                                                                                                             |
| `get/setPenaltyFee`    | Retrieves/sets a trader penalty fee. A penalty fee was originally intended to penalize traders that attempted to front-run the Dexible relays by removing spend allowance or token balances from their wallets prior to a trade being settled. Currently, the penalty fee is set to 0; but we may install a penalty fee later if we find the relays are losing money due to bad actors in the ecosystem. |


<br/>
<br/>

<br/><br/>

## LibAccess


LibAccess is a library that is extended by other contracts that makeup the Dexible Settlement contract stack. Specific activities for the core Settlement contract must have proper controls to protect against malicious actors. Namely, changing configuration, pausing contract operations, and approving relay wallets submitting fill requests are all limited to addresses on an access list. There is also an "action" role that was previously used to limit which contracts the core settlement contract could use to settle fills (uniswap, sushiswap, etc); but the action role is now reserved for future extensions.

### LibAccess Functions

|                |                                                                                                                                                                                                                                                                                                       |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `_addRole`     | This function should only be callable by addresses with 'admin' role to associate other addresses with a specific role. It's an internal function so that only an extending contracts can make calls to it. The parent contract is responsible for checking calling addresses against the admin role. |
| `hasRole`      | This function checks whether an address has a specific role. This is a public view-only function that merely looks up the role and address to see if it's recorded before.                                                                                                                            |
|  `_revokeRole` | This function removes a specific role for an address. It's an internal function that can only be called by extending contracts. It is the extending contract's responsibility to make sure the caller has the correct admin role to revoke other roles.                                               |

<br/>
<br/>

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

<br/>
<br/>

## BaseConfig

This contract extends BaseAccess and controls access to configuration settings for the core contracts. It uses LibConfig to manipulate ConfigStorage settings.

### BaseConfig Functions

|                  |                                                                                                                     |
|------------------|---------------------------------------------------------------------------------------------------------------------|
| `initConfig`       | Initializer function to setup initialize config settings.                                                           |
| `getConfig`        | Retrieves current config settings                                                                                   |
| `getDevTeam`       | Readonly function to get the dev team wallet address                                                                |
| `getLockoutBlocks` | Readonly function to get the minimum number of wait blocks before trader can withdraw funds getMinFee               |
| `getMinFee`        | No longer in use                |
| `getPenaltyFee`    | Get the trader penalty fee (currently 0). This is not currently in use but is here for future iteration if needed.  |
| `setConfig`        | Set all settings in bulk. Only admins can call this function.                                                       |
| `setDevTeam`       | Sets the dev team address. Only admins can call this function.                                                      |
| `setLockoutBlocks` | Set the min wait blocks. Only admins can call this function.                                                        |
| `setMinFee`        | No longer in use                                          |
| `setPenaltyFee`    | Set the trader penalty fee. Only admins can call this function.                                                     |

<br/>
<br/>

## IDexRouter

A "router" in the Dexible context refers to a source of liquid through which to settle trades. Different router implementations will rely on different sources. For example, the ZrxRouter relies on the 0x Dex Aggregator while UniswapRouter relies on UniswapV2.

`fill` — This is the primary function called on the router in order to swap tokens on behalf of a trader. The full order details and router-specific call data is provided to carry out the swap. Note that input tokens for the fill are transferred to the router prior to calling this function. The router's job is to satisfy the output token requirements of the order in whatever way it can.


## Settlement

### Settlement Events

|                 |                                                                                                                                                                                                                                                                       |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `TraderPenalized` | Not currently used, but a future version may include trader penalties if traders front-run relays to remove token balances or spend allowances in order to prevent trades from succeeding.                                                                            |
| `SwapFailed`      | This is emitted if a swap failed due to excessive slippage or other normal market conditions. Note that the transaction itself does not fail; rather, the trader is charged for gas (but not Dexible trading fees) but their swapped token balance remains unchanged. |
| `SwapSuccess`     | This is emitted when a swap succeeds.                                                                                                                                                                                                                                 |
| `ReceivedETH`     | This is emitted when the dev team deposits ETH into the contract to reimburse relay wallets.                                                                                                                                                                                                                                 |
| `WithdrewETH`     | This is emitted the dev team withdraws ETH from the contract.                                                                                                                                                                                                                                 |
| `PaidGasFunds`     | This is emitted a relay is reimbursed estimated gas costs.                                                                                                                                                                                                                                 |
| `InsufficientGasFunds`     | This is emitted the contract does not have enough funds to reimburse the relay.                                                                                                                                                                                                                                 |

<br/>

### Settlement Fills + Risks

#### Fill

`fill`

This is the primary function to settle fill requests through Dexible. It can only be called by Dexible-owned relays and cannot be recursively called by any other contract or relay. The purpose of the function is to:

* Verify the trader has sufficient funds to trade (input token)
* Verify the trader has given the Settlement contract sufficient approval to spend input tokens
* Transfer input tokens to a specified IDexRouter address
* Delegate token swapping to the specified IDexRouter
* Verify that post-trade output token balances satisfied the trader's expectation
* Reimburse the relay wallet (caller) with sufficient funds to pay the txn fee

The fill function relies on a trycatch mechanism to catch problems that may occur due to slippage and still allows the txn to succeed so that relays are reimbursed regardless of trade outcome. Certain conditions, however, should be charged back to Dexible since the relay should have checked those conditions prior to sending the txn on-chain (token balance and spend allowance). The fill relies on an IDEXRouter implementation, and currently the only one in use is ZrxRouter. This relies on the 0x Dex Aggregator to fulfill token swaps and extract an appropriate fee from the output token.

<br/>

#### Risks

**Dexible-Owned Output Token** <br/>
Since trades are fully automated, and only Dexible relay wallets can request order fills, it is possible that Dexible could introduce a dummy token, with its own liquidity pool in Uniswap, and submit orders to swap a trader's approved input tokens for its own dummy token. While this would completely destroy Dexible's reputation and make the system completely pointless; but it is something some community members have expressed concern over.

One possible mitigation is to introduce approval checks for both input and output tokens. This way, traders who are concerned can pay the additional fees to only allow trades into tokens they approve. This would prevent Dexible from swapping into unknown tokens without explicit approval from traders.

<hr/>

**Rouge Dexible Orders** <br/>
If Dexible were to have a rogue employee that uses the infrastructure to submit bad orders for trader addresses, the trader would end up owning assets that they did not approve. The above mitigation would limit the loss to only tokens they approve; however, it would still end up leaving the trader with trades they didn't expect at prices they probably didn't want.

One way to prevent this is to ensure that all order details are signed at the time of submission and that signature be verified as part of every order fill request. This would have to be done internal to Dexible, however, since full order details are sensitive to traders and should not be disclosed publicly. A proof mechanism could be developed such that the Settlement contract can prove that the given settlement request is in fact part of a larger approval. More thought would be needed to mitigate this inherent risk of centralized automation systems.

<br/>
<br/>


### Settlement Functions

|              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `fill`   | The primary called function that settles order fills. Only callable by an approved Dexible relay.                                                                  |
| `withdraw`   |  A way for the dev team to withdraw funds from the contract. Only an admin can withdraw funds.                                                                 |
| `_hasTokens`   | An internally used function to check whether the trader has sufficient token balance for the Settlement contract to satisfy the order request. This reverts if there are insufficient tokens for the trade and charges the Dexible relay. This is because the relay should have checked the token balance prior to submitting on-chain; however, a future version may actually penalize the trader if Dexible can publicly guarantee that it verified token balance prior to submitting on-chain.                                                                  |
| `_canSpend`    | An internally used function to check whether the trader has spend allowance for Settlement contract for the input tokens being traded. It reverts if there is insufficient spend allowance and charges the Dexible relay since it should have checked for spend allowance prior to submitting on-chain. See note above about potential penalties in the future.                                                                                                                                                                                                    |
| `_preCheck`    | This internally called function simply wraps up the _hasTokens and _canSpend function calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `_preActions`  | Sets up the trade prior to calling the IDexRouter implementation specified. It merely transfers funds to the router.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `performFill`  | Internal call to wrap the router fill call in a trycatch so that we can properly handle swap failures. Note that we deduct a certain amount of gas out of the call to allow for post-call processing (reimbursements, events, etc)                                                                                                                                                                                                                                                                                                                 |
| `_trySwap`     | The actual call to the IDexRouter to swap tokens. This will revert if the swap fails on the IDexRouter side.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `_postCheck`   | Internal function to check token balances after a swap completes. If the swap failed, we have to make sure funds were given back to the trader. If it succeeded, we have to make sure the output token balance satisfied the order requirements and that input token balance changed appropriately as well.                                                                                                                                                                                                                                                        |
| `_postActions` | Internal function to perform post-fill updates. Regardless of swap outcome, it must reimburse the relay and pay the Dexible fee from the contract's ETH balance.                                                                                                                                                                                                                                                                                                                             |v