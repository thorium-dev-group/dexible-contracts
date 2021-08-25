# Dexible Smart Contracts
Smart contract repo

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="https://github.com/BUIDLHub/dexible-contracts/blob/docs/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Dexible v2 Smart Contracts</h3>

  <p align="center">
    Dexible is the EMS that Professional Traders need. These contracts automate swaps for the Dexible DeFi bot aggregator. Navigate to <a href="https://github.com/BUIDLHub/dexible-contracts/tree/master/contracts">contracts</a> to see documentation.
    <br />
    <a href="mailto:support@dexible.io"><strong>Email the team»</strong></a>
    <br />
    <br />
    <a href="https://t.me/dexible">Message us on Telegram</a>
    ·
    <a href="https://discord.gg/Xvnh3Ektkc">Message us on Discord</a>
    ·
  </p>
</p>

<!-- ABOUT THE PROJECT -->
## About The Project

<img src="https://github.com/BUIDLHub/dexible-contracts/blob/docs/screenshot.png" alt="screenshot" width="500">

**What we do.** <br/>
We enable smart DeFi automation, provide detailed pre-trade and post-trade analysis, serve as a single interface for strategy execution and portfolio allocation, and give professionals detailed trade history reports.

**How we do it.** <br/>
We created a robust infrastructure, programmatic API, trade settlement logic, execution parameters, and an intuitive app frontend.

**Contract Audit**
All of our contracts have been audited by Solidified. See <a href="https://github.com/BUIDLHub/dexible-contracts/blob/master/Audit%20Report%20-%20Dexible%20%5B16%20August%202021%5D.pdf" target="_blank">Audit Report </a>

While the audit revealed no major or critical issues with the contracts, there were a few medium-level issues found. The biggest issue was the fact that Dexible could manipulate gas and ETH prices to inflate reimbursements for txn costs. While it is possible for us to do that, it would be easily discovered and have a negative impact on usage. All ETH-USD prices are derived from Coingecko and are updated every 10 minutes. Token ETH prices are calculated as part of our market spot price evaluation, which today happens every 5 seconds.

<br/>
<hr/>

<a href="https://dexible.io" target="_blank">Dexible</a> is the go-to execution engine for professionals trading across DEXes. We automate swaps with private and non-custodial large cap trades and orders in illiquid markets to ensure the best effective rate. 

The algos we've developed optimize your orders to minimize slippage and human error. Dexible automatically monitors the markets and then executes transactions in tranches until orders are filled or canceled. 

We plug into existing liquidity sources like Uni and Sushi. You can execute segmented market, limit, and stop orders, but our traders most like the TWAP orders.


Our vision is to become the de facto EMS for DeFi that offers the most cutting-edge experience.

* You'll be able to programmatically submit orders via API.
* Compose strategies that will automatically enter into farming or staking positions across risk levels.
* Select between multiple algo types.
* Customize your order timing and market participation.
* Perform pre & post-trade analysis.
* And generate reports for accounting & tax instantly.

Coming down the road are technical audits of the smart contracts.
<br/>
<br/>

### What We Stand For

**Be the Face for Teams with Integrity.** <br/>
We believe our code will be in the digital fingerprint of complex financial operations and we believe that a team that puts integrity first should design these with good intentions.

**Set Public Standards.**  <br/>
We believe in standardizing access to the programmatic execution layer through smarter integrations.

**Make Traders' Lives more Fulfilling.** <br/>
We believe that changing how fund managers strategize and execute will give traders peace of mind and help them to tackle more personally fulfilling tasks—whether that's improving their personal financial outcomes or investing in early stage.

**Improve Holistic Innovation.** <br/>
We believe that if we can optimize fund managers’ time, they’d be able to research and invest in more long-term projects with deeper fundamental value, thus improving the publicly decentralized internet.
