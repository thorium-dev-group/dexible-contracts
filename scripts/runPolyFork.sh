#/bin/shell

set -o allexport; source .env; 
set +o allexport;

npx hardhat node --verbose --fork https://polygon-mainnet.infura.io/v3/$INFURA_ID; --fork-chain-id 137