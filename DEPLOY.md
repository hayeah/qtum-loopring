```
docker run -it --rm \
  --name myapp \
  -v `pwd`:/dapp \
  -p 9899:9899 \
  -p 9888:9888 \
  -p 13889:13889 \
  hayeah/qtumportal
```

Enter into the container's shell:

```
docker exec -it myapp sh
```

An qtum-cli alias already created inside the container. Instead of calling `qtum-cli`, we'll use `qcli`.

```
alias qcli='qtum-cli -rpcuser=qtum -rpcpassword=test -regtest'
```

# Generate Initial Balance

```
$ qcli getbalance
0.00000000
```

```
$ qcli generate 600
...
  "09b1f73f78e7cbf145f12516a19ce5052eb5d676002fd015ba1f74ae8e746aba",
  "588f357514489c34884acd651416e3c6a69171e8058058024106eafbd1c908d6",
  "3623c6f6fac04fa451bf2f51de090b2bcd60ce306032e78a9e3fae33af8d7cb5",
  "12beffa53fe008617c093151c142ab95d4d4513acad22f844001a5d7cc7e1ab4",
  "2977cc085aa8c38abf81ef8a2ca28cda63a40e3a0bbbfc7119a5854b163e73de",
  "7a3b8c7b586feadc045e6cd3585b6dbc5bafafb7974cf4deb5ef1f66d88c5d12",
  "7827d142e370b27a97d07d90353b7dcc16b47c1df1a134ba5f7fe56a7ab8c82a"
]
```

```
$ qcli getbalance

2000000.00000000
```

# Deploy Contracts

Deploy the main contracts:

```
solar deploy contracts/TokenRegistry.sol
solar deploy contracts/RinghashRegistry.sol '[100]'
solar deploy contracts/TokenTransferDelegate.sol
```

Deploy `DummyToken` contracts: Constructor takes 4 arguments:

```
string _name,
string _symbol,
uint8  _decimals,
uint   _totalSupply
```

```
solar deploy contracts/test/DummyToken.sol:LRCToken '[
  "Loopring Coin",
  "LRC",
  18,
  1e+26
]'

solar deploy contracts/test/DummyToken.sol:EOSToken '[
  "EOS",
  "EOS",
  18,
  1e+26
]'

solar deploy contracts/test/DummyToken.sol:REPToken '[
  "Augur Reputation Token",
  "REP",
  18,
  1e+26
]'

solar deploy contracts/test/DummyToken.sol:QTUMToken '[
  "QTUM",
  "QTUM",
  18,
  1e+26
]'
```

You should now be able to list all the contracts that had been deployed:

```
solar status

✅  contracts/TokenRegistry.sol
        txid: 0a4822f09dd72593fcd8f8d67599aea1ffad7e9923496cc5de42364987abba60
     address: 61dd5cb59e0522f25fc37371c3ef0113072671cf
   confirmed: true
       owner: qSja9E1bhJvfWmSx8fc8M14JYSS9cKCzef

✅  contracts/RinghashRegistry.sol
        txid: 3bc0fb54c528cc8fb9eb846ae4e11d8f72572dcedb4d039f67e2c6d5cba34d90
     address: 41cd85b25b2b0ede1fd39d7e28b8c903960d6c4b
   confirmed: true
       owner: qgqpfq3eAh9Szq4PViA6vLsHj4uSyuXLeR

✅  contracts/TokenTransferDelegate.sol
        txid: c6ea5df0955f6a6888d681f8370779f81ab6e8cb5120dee56b14d625f225b65b
     address: 801cf3cbb597c6c4200862cd3fbd79a9cdb1de1b
   confirmed: true
       owner: qYj99VoPWxSbqYh5eJ396y5dnvh6eTzdfd

✅  LRCToken
        txid: 5686d73e3fde32bc868fe4a76a9138430a2a37f5547cf185c58cf95281a1c2b0
     address: 9f23f4ce95222171e9607e2f8d816af9d6f7865e
   confirmed: true
       owner: qQBBNwKaezC5864WUmVRKMqU4kktr7P5y5

✅  EOSToken
        txid: 8dbf65528997b27ef9074d333e6b91749a74aff1c766586b0271264edce9f9a9
     address: 9329879da2ca884f6562e4ea3aae38998959860c
   confirmed: true
       owner: qU29npKRxBWbYVnp98HnCKJCvAcFdMWDfV

✅  REPToken
        txid: 14672a9e19c5820af317fd6924d4a325c7166bde1879a6ccf74665ba6574c2b2
     address: d63633b672bb29f7b58ae64b054834c24e6c1b73
   confirmed: true
       owner: qZr7BU2LAczQE4BHpoDwhED25q9aFj86eT

✅  QTUMToken
        txid: 8ad65c6987b02d158bc2f46f92fd6f9a99136c397230baf039a16fb39e838a7e
     address: f4f6ed4a33f191d7ed173a332fee9435db81ea65
   confirmed: true
       owner: qNRY75a8cGiUDe75kuogFWLPZDQUSGe8PU
```

Notice that the `owner` address is different for each of the contract you deployed. This is because QTUM is built on Bitcoin's UXTO model, and each time a contract is deployed a different uxto from the wallet is used, and that UXTO becomes the "owner" of the contract.

In other words, each time you create a contract or send to a contract, the UXTO that is used to create the transaction is the `msg.sender`.

And because each transaction consumes an UXTO, to make multiple "send to contract" transactions you'll need to create multiple UXTOs with the same address.

# Register Tokens

Now let's register the DummyTokens with `contracts/TokenRegistry.sol`. The `registerToken` method checks for `onlyOwner`, so we'll need to prefund the owner address with enough UXTOs for the number of calls we want to make.

The `solar prefund` command can be used to create the UXTOs. We'll use it to create 5 UXTOs with 0.5 QTUM each:

```
solar prefund contracts/TokenRegistry.sol 0.5 5
```

Use `qtum-cli` to check if the UXTOs have indeed been created:

```
// replace the address with what you see in `solar status` output
qcli listunspent 0 1000 '["qSja9E1bhJvfWmSx8fc8M14JYSS9cKCzef"]'

[
  {
    "txid": "4b7e56a3cb8d82c0d45eb5951419f623319df3c0b618c3708369bba7ab8ab83a",
    "vout": 0,
    "address": "qSja9E1bhJvfWmSx8fc8M14JYSS9cKCzef",
    "scriptPubKey": "76a91464a6766048e9097fcace01928a82f3ad10d47fd188ac",
    "amount": 0.50000000,
    "confirmations": 5,
    "spendable": true,
    "solvable": true
  },
  {
    "txid": "4b7e56a3cb8d82c0d45eb5951419f623319df3c0b618c3708369bba7ab8ab83a",
    "vout": 1,
    "address": "qSja9E1bhJvfWmSx8fc8M14JYSS9cKCzef",
    "scriptPubKey": "76a91464a6766048e9097fcace01928a82f3ad10d47fd188ac",
    "amount": 0.50000000,
    "confirmations": 5,
    "spendable": true,
    "solvable": true
  },
  {
    "txid": "4b7e56a3cb8d82c0d45eb5951419f623319df3c0b618c3708369bba7ab8ab83a",
    "vout": 3,
    "address": "qSja9E1bhJvfWmSx8fc8M14JYSS9cKCzef",
    "scriptPubKey": "76a91464a6766048e9097fcace01928a82f3ad10d47fd188ac",
    "amount": 0.50000000,
    "confirmations": 5,
    "spendable": true,
    "solvable": true
  },
  {
    "txid": "4b7e56a3cb8d82c0d45eb5951419f623319df3c0b618c3708369bba7ab8ab83a",
    "vout": 4,
    "address": "qSja9E1bhJvfWmSx8fc8M14JYSS9cKCzef",
    "scriptPubKey": "76a91464a6766048e9097fcace01928a82f3ad10d47fd188ac",
    "amount": 0.50000000,
    "confirmations": 5,
    "spendable": true,
    "solvable": true
  },
  {
    "txid": "4b7e56a3cb8d82c0d45eb5951419f623319df3c0b618c3708369bba7ab8ab83a",
    "vout": 5,
    "address": "qSja9E1bhJvfWmSx8fc8M14JYSS9cKCzef",
    "scriptPubKey": "76a91464a6766048e9097fcace01928a82f3ad10d47fd188ac",
    "amount": 0.50000000,
    "confirmations": 5,
    "spendable": true,
    "solvable": true
  }
]
```

I have written a basic deploy script that loops through the token symbols and register them with TokenRegistry in: [src/scripts/registerTokens.ts](src/scripts/registerTokens.ts).

Transpile the TypeScript to JS, then run it with Node directly:

```
npm run ts-build

node lib/scripts/registerTokens.js
```

The script checks if a symbol had been registered, if not calls `registerToken`, then wait for one confirmation:

```
LRC registered: false
tokenDeployAddress 9f23f4ce95222171e9607e2f8d816af9d6f7865e
txid: 75e9c17f852ac7698cb77595fcb6e924dc66c8e6322b09b037982a9fdf75ceb1
EOS registered: false
tokenDeployAddress 9329879da2ca884f6562e4ea3aae38998959860c
txid: d301c8f90325c6bb8eaf3a2df69b10856817a0a2e83caa65679c863a610e874b
REP registered: false
tokenDeployAddress d63633b672bb29f7b58ae64b054834c24e6c1b73
txid: e7654e8297518a8804af0c52b954db7d2432c3128cd367175fdf25ae4a70c6e9
QTUM registered: false
tokenDeployAddress f4f6ed4a33f191d7ed173a332fee9435db81ea65
txid: 641df69887c32b139f7de1b51998ffce40873e8399ae560a5b7106f517bf3de4
```

Running the second time should not do anything, as the symbols are registered:

```
node lib/scripts/registerTokens.js

LRC registered: true
EOS registered: true
REP registered: true
QTUM registered: true
```

Done.
