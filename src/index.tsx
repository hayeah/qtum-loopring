import "font-awesome/css/font-awesome.css"
import "normalize.css"

import "./index.css"

import * as React from "react"
import { render } from "react-dom"

import {
  Contract,
  QtumRPC,
} from "qtumjs"

function App(props: { addresses: string[] }) {
  return (
    <div>
      <h1>
        Hello LoopRing <span className="fa fa-heart" />
      </h1>

      <h2>
        VERSION: {VERSION}
      </h2>

      <h3>
        Token Addresses:
      </h3>

      <div>
        { props.addresses.map((address) => <p key={address}>{address}</p>) }
      </div>
    </div>
  )
}

// data in solar.[env].json
const repo = REPO

const rpc = new QtumRPC(QTUM_RPC)

const tokenRegistry = new Contract(
  rpc,
  repo.contracts["contracts/TokenRegistry.sol"],
)

window.addEventListener("load", async () => {

  // assume four tokens are deployed
  const res = await tokenRegistry.call("getTokens", [0, 4])

  const tokenAddresses = res.outputs[0]

  render(<App addresses={tokenAddresses}/>, document.getElementById("root"))
})
