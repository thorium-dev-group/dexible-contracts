const { ethers } = require("hardhat")

const advanceBlock = async function() {
  return ethers.provider.send("evm_mine", [])
}

const advanceBlockTo = async function(blockNumber) {
  for (let i = await ethers.provider.getBlockNumber(); i < blockNumber; i++) {
    await advanceBlock()
  }
}

const advanceTimeAndBlock = async function(time) {
  await advanceTime(time)
  await advanceBlock()
}

const advanceTime = async function(time) {
  await ethers.provider.send("evm_increaseTime", [time])
}

module.exports = {
    advanceBlock,
    advanceBlockTo,
    advanceTimeAndBlock
}