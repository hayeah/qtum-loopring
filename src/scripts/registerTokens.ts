import {
  QtumRPC,
  Contract,
} from "qtumjs"

// access qtumd RPC service running in docker container
const rpc = new QtumRPC("http://qtum:test@localhost:13889")

const repo = require("../../solar.development.json")

const tokenRegistry = new Contract(rpc, repo.contracts["contracts/TokenRegistry.sol"])

const tokenSymbols = [
  "LRC",
  "EOS",
  "REP",
  "QTUM",
]

async function main() {
  for (const symbol of tokenSymbols) {
    const result = await tokenRegistry.call("isTokenRegisteredBySymbol", [symbol])

    const isRegistered: boolean = result.outputs[0]

    console.log(`${symbol} registered: ${isRegistered}`)

    if (!isRegistered) {
      const tokenDeployName = `${symbol}Token`
      const tokenDeployAddress = repo.contracts[tokenDeployName].address

      console.log("tokenDeployAddress", tokenDeployAddress)

      const tx = await tokenRegistry.send("registerToken", [
        "0x" + tokenDeployAddress,
        symbol,
      ], {
        gasLimit: 3000000,
      })

      console.log("txid:", tx.txid)

      await tx.confirm(1)
    }
  }
}

main()
