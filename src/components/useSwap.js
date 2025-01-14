/* global BigInt */
const Web3 = require('web3')
const {get, isArray, upperCase} = require('lodash')

const addressRouter = '0x9E9b3CBBA901031f646B04e9fC9a2E3448B40335'
class Pair {
  constructor({address0, reserve0, address1, reserve1, pairAddress = '0x', series = [], parallel = []}) {
    this.address0 = address0
    this.reserve0 = reserve0 // A
    this.address1 = address1
    this.reserve1 = reserve1 // B
    this.series = series
    this.parallel = parallel
    this.pairAddress = pairAddress
  }

  static fromSeriesPairs({pair0, pair1}) {
    const [A, B, C, D] = [pair0.reserve0, pair0.reserve1, pair1.reserve0, pair1.reserve1]
    const params = {
      address0: pair0.address0,
      reserve0: (C * A) / (C + B), // A Total
      address1: pair1.address1,
      reserve1: (B * D) / (C + B), // B Total
      series: [pair0, pair1]
    }
    return new Pair(params)
  }

  static fromParallelPairs(pairs) {
    const totalReserve0 = pairs.reduce((total, item) => total + item.reserve0, 0)
    const pairOkla = pairs.filter(item => item.reserve0 / totalReserve0 > 1 / 100)
    const totalReserve0Filtered = pairOkla.reduce((total, item) => total + item.reserve0, 0)

    const params = {
      address0: pairOkla[0].address0,
      reserve0: pairOkla.reduce((total, item) => total + item.reserve0, 0),
      address1: pairOkla[pairOkla.length - 1].address1,
      reserve1: pairOkla.reduce((total, item) => total + item.reserve1, 0),
      parallel: pairOkla.map(item => ({
        pair: item,
        percent: item.reserve0 / totalReserve0Filtered
      }))
    }
    return new Pair(params)
  }

  getRouter(amountIn) {
    if (this.parallel.length > 0)
      return this.parallel.map(item => {
        return {
          pair: item.pair.getRouter(Math.floor(amountIn * item.percent)),
          percent: item.percent
        }
      })
    if (this.series.length > 0) {
      const amountIn1 = this.series[0].caculateAmountOut(amountIn)
      return [this.series[0].getRouter(amountIn), this.series[1].getRouter(amountIn1)]
    }
    return {
      amountIn,
      amountOut: this.caculateAmountOut(amountIn),
      token0: this.address0,
      provider: this.pairAddress
    }
  }

  getData(amountIn, sender) {
    const dataRouter = this.getRouter(amountIn).reverse()

    const dataFormat = []

    for (let route of dataRouter) {
      if (isArray(route.pair[0])) {
        for (let pair of route.pair[0]) {
          dataFormat.push({
            ...pair.pair,
            from: sender,
            to: addressRouter
          })
        }
      }
    }

    for (let route of dataRouter[dataRouter.length - 1].pair) {
      dataFormat.push({
        ...route.pair,
        from: sender,
        to: sender
      })
    }

    for (let route of dataRouter.reverse()) {
      if (isArray(route.pair[1])) {
        for (let pair of route.pair[1]) {
          dataFormat.push({...pair.pair, from: addressRouter, to: sender})
        }
      }
    }

    const addaad = dataFormat.map(item => {
      const {amountIn, amountOut, token0, provider, from, to} = item
      return [BigInt(amountIn), BigInt(amountOut), provider, token0, from, to]
    })

    return {
      dataUI: dataRouter,
      dataSwap: addaad,
      amountOut: this.caculateAmountOut(amountIn)
    }
  }

  caculateAmountOut(amountIn) {
    const amountInWithFee = amountIn * 0.9975
    return Math.floor((this.reserve1 * amountInWithFee) / (this.reserve0 + amountInWithFee))
  }
}

const abiMultiCall = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bool',
            name: 'allowFailure',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call3[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate3',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'returnData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  }
]
const abiPool = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      {
        internalType: 'uint112',
        name: '_reserve0',
        type: 'uint112'
      },
      {
        internalType: 'uint112',
        name: '_reserve1',
        type: 'uint112'
      },
      {
        internalType: 'uint32',
        name: '_blockTimestampLast',
        type: 'uint32'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'token0',
    outputs: [
      {
        internalType: 'address',
        name: 'address',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'token1',
    outputs: [
      {
        internalType: 'address',
        name: 'address',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]
const abiFactory = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'getPair',
    outputs: [
      {
        internalType: 'address',
        name: 'address',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]

const zeroAddress = '0x0000000000000000000000000000000000000000'

const addressMultiCall = '0xcA11bde05977b3631167028862bE2a173976CA11'
const addressFactory = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'

const addressFactorys = [
  '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', // pancake
  '0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6', // ape
  '0x3CD1C46068dAEa5Ebb0d3f55F6915B10648062B8', // mdex
  '0x858E3312ed3A876947EA49d572A7C42DE08af7EE' // bisswap
]

const tokenMid = [
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // usdc
  '0x55d398326f99059ff775485246999027b3197955' // usdt
  //   '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // wbnb
]

const tokenIn = '0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F' // apala
const tokenOut = '0xe9e7cea3dedca5984780bafc599bd69add087d56' // busd
// const tokenOut = '0x87230146E138d3F296a9a77e497A2A83012e9Bc5' // busd

// const tokenOut = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // Wbnb
// const tokenIn = '0x87230146E138d3F296a9a77e497A2A83012e9Bc5' // busd

export const main = async (tokenIn, tokenOut, amount) => {
  const web3 = new Web3('https://bsc-mainnet.nodereal.io/v1/5c4ed7c647c0479f9ae118b0b62c745c')
  const decodeParams = schema => data => {
    try {
      const rawData = web3.eth.abi.decodeParameters(schema, data)
      return rawData
    } catch (err) {
      return {}
    }
  }

  const contractMultiCall = new web3.eth.Contract(abiMultiCall, addressMultiCall)
  const contractfactory = new web3.eth.Contract(abiFactory, addressFactory)
  const contractPool = new web3.eth.Contract(abiPool, addressFactory)

  const decodeAddress = decodeParams(abiFactory[0].outputs)
  const decodePool = decodeParams(abiPool[0].outputs)
  const dataGetReserves = contractPool.methods.getReserves().encodeABI()
  const dataGetToken0 = contractPool.methods.token0().encodeABI()
  const dataGetToken1 = contractPool.methods.token1().encodeABI()

  const allPair = []
  // setup data
  addressFactorys.map(factory => {
    // a->c
    allPair.push({
      id: factory + tokenIn + tokenOut,
      factory: factory,
      token0: tokenIn,
      token1: tokenOut
    })

    tokenMid.map(mid => {
      // a->b
      allPair.push({
        id: factory + tokenIn + mid,
        factory: factory,
        token0: tokenIn,
        token1: mid
      })
      // b->c
      allPair.push({
        id: factory + mid + tokenOut,
        factory: factory,
        token0: mid,
        token1: tokenOut
      })
    })
  })

  // get Pair
  const dataGetPair = allPair.map(item => ({
    target: item.factory,
    callData: contractfactory.methods.getPair(item.token0, item.token1).encodeABI(),
    allowFailure: false
  }))

  const addressPools = await contractMultiCall.methods
    .aggregate3(dataGetPair)
    .call()
    .then(data => data.map(item => decodeAddress(item.returnData.slice(2)).address))

  // get data pool (reserves + token0 + token1)
  const dataPools = await contractMultiCall.methods
    .aggregate3(
      addressPools.map(address => ({
        target: address,
        callData: dataGetReserves,
        allowFailure: false
      }))
    )
    .call()

  const dataToken0Onchain = await contractMultiCall.methods
    .aggregate3(
      addressPools.map(address => ({
        target: address,
        callData: dataGetToken0,
        allowFailure: false
      }))
    )
    .call()
  const dataToken1Onchain = await contractMultiCall.methods
    .aggregate3(
      addressPools.map(address => ({
        target: address,
        callData: dataGetToken1,
        allowFailure: false
      }))
    )
    .call()

  // format data (lat data lai)
  const okla = allPair.map((item, index) => {
    const [token0Onchain, token1Onchain, reserve0Onchain, reserve1Onchain] = [
      get(decodeAddress(dataToken0Onchain[index].returnData.slice(2)), 'address', zeroAddress),
      get(decodeAddress(dataToken1Onchain[index].returnData.slice(2)), 'address', zeroAddress),
      get(decodePool(dataPools[index].returnData.slice(2)), '_reserve0', 0),
      get(decodePool(dataPools[index].returnData.slice(2)), '_reserve1', 0)
    ]

    const finalData = {
      ...item,
      pairAddress: addressPools[index],
      token0Onchain,
      token1Onchain,
      reserve0Onchain,
      reserve1Onchain
    }

    if (token0Onchain.toUpperCase() !== item.token0.toUpperCase() || token1Onchain.toUpperCase() !== item.token1.toUpperCase()) {
      return {
        ...finalData,
        reserve0: reserve1Onchain,
        reserve1: reserve0Onchain,
        pair: new Pair({
          pairAddress: finalData.pairAddress,
          address0: item.token0,
          reserve0: Number(reserve1Onchain),
          address1: item.token1,
          reserve1: Number(reserve0Onchain)
        })
      }
    }
    return {
      ...finalData,
      reserve0: reserve0Onchain,
      reserve1: reserve1Onchain,
      pair: new Pair({
        pairAddress: finalData.pairAddress,
        address0: item.token0,
        reserve0: Number(reserve0Onchain),
        address1: item.token1,
        reserve1: Number(reserve1Onchain)
      })
    }
  })

  // return

  const ecec = okla.reduce((total, item) => ({...total, [item.id]: item}), {})

  const pairAC = Pair.fromParallelPairs(addressFactorys.map(factory => ecec[factory + tokenIn + tokenOut].pair))

  // console.log('🚀 ~ main ~ pairAC:', pairAC.parallel[0].pair)

  // return

  // const pairAB1 = Pair.fromParallelPairs(
  //   addressFactorys
  //     .map(factory => {
  //       const data = ecec[factory + tokenIn + tokenMid[1]]
  //       if (data.pairAddress === zeroAddress) return
  //       return data.pair
  //     })
  //     .filter(item => item)
  // )
  // console.log('🚀 ~ main ~ pairAB1:', pairAB1)

  // return

  const pairAC1 = Pair.fromSeriesPairs({
    pair0: Pair.fromParallelPairs(
      addressFactorys
        .map(factory => {
          const data = ecec[factory + tokenIn + tokenMid[1]]
          if (data.pairAddress === zeroAddress) return
          return data.pair
        })
        .filter(item => item)
    ),
    pair1: Pair.fromParallelPairs(
      addressFactorys
        .map(factory => {
          const data = ecec[factory + tokenMid[1] + tokenOut]
          if (data.pairAddress === zeroAddress) return
          return data.pair
        })
        .filter(item => item)
    )
  })

  const pairAC2 = Pair.fromSeriesPairs({
    pair0: Pair.fromParallelPairs(
      addressFactorys
        .map(factory => {
          const data = ecec[factory + tokenIn + tokenMid[0]]
          if (data.pairAddress === zeroAddress) return
          return data.pair
        })
        .filter(item => item)
    ),
    pair1: Pair.fromParallelPairs(
      addressFactorys
        .map(factory => {
          const data = ecec[factory + tokenMid[0] + tokenOut]
          if (data.pairAddress === zeroAddress) return
          return data.pair
        })
        .filter(item => item)
    )
  })

  const pairAll = Pair.fromParallelPairs([pairAC, pairAC1, pairAC2])

  return pairAll.getData(amount * 10 ** 18, addressRouter)
}
