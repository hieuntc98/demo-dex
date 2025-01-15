import React, {useState, useEffect} from 'react'
import {Input, Popover, Radio, Modal, message} from 'antd'
import {ArrowDownOutlined, DownOutlined, SettingOutlined} from '@ant-design/icons'
// import tokenList from '../tokenList.json'
import tokenListMain from '../tokenbsc.json'
import tokenListTest from '../tokenbscTest.json'
import axios from 'axios'
import {useChainId, useSendTransaction, useWaitForTransaction} from 'wagmi'
import {main, onSwapTestnet} from './useSwap'

const formatPercent = percent => {
  return parseFloat(percent * 100).toFixed(2)
}

const formatAddress = address => {
  return address.slice(0, 4) + '...' + address.slice(38)
}

const midOkla = {
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'https://tokens.pancakeswap.finance/images/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d.png',
  '0x55d398326f99059ff775485246999027b3197955': 'https://tokens.pancakeswap.finance/images/symbol/usdt.png',
  '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd': "https://tokens.pancakeswap.finance/images/symbol/bnb.png",
}

const tokenlistOkla = {
  97: tokenListTest,
  56: tokenListMain
}

function Swap(props) {
  const {address, isConnected} = props
  const chainId = useChainId()
  const tokenList = tokenlistOkla[chainId] ?? tokenListMain
  
  const [messageApi, contextHolder] = message.useMessage()
  const [slippage, setSlippage] = useState(2.5)
  const [tokenOneAmount, setTokenOneAmount] = useState(0)
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null)
  const [tokenOne, setTokenOne] = useState(tokenList[2])
  const [tokenTwo, setTokenTwo] = useState(tokenList[3])
  const [dataRoute, setData] = useState([])
  const [dataSwap, setDataSwap] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [changeToken, setChangeToken] = useState(1)
  const [prices, setPrices] = useState(null)
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null
  })

  const {data, sendTransaction} = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      // data: String(txDetails.data),
      value: String(txDetails.value)
    }
  })

  const {isLoading, isSuccess} = useWaitForTransaction({
    hash: data?.hash
  })

  function handleSlippageChange(e) {
    setSlippage(e.target.value)
  }

  function changeAmount(e) {
    setTokenOneAmount(e.target.value)
    // if (e.target.value && prices) {
    //   setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2))
    // } else {
    //   setTokenTwoAmount(null)
    // }
  }

  function switchTokens() {
    setPrices(null)
    setTokenOneAmount(null)
    setTokenTwoAmount(null)
    const one = tokenOne
    const two = tokenTwo
    setTokenOne(two)
    setTokenTwo(one)
  }

  const getRouterSwap = async () => {
    const data = await main(tokenOne.address, tokenTwo.address, tokenOneAmount, address, chainId)
    setData(data.dataUI)
    setDataSwap(data.dataSwap)
    setTokenTwoAmount(data.amountOut / 10 ** 18)
  }

  const onSwap = async ()=>{
    const hash = await onSwapTestnet(dataSwap)
    messageApi.success(`Transaction succeeded: ${hash}!`);
    console.log('🚀 ~ onSwap ~ hash:', hash)
  }

  // useEffect(()=>{
  //   setTokenOne(two)
  //   setTokenTwo(one)
  // },[chainId])

  useEffect(() => {
    tokenOneAmount && getRouterSwap()
    
  }, [tokenOne.address, tokenTwo.address, tokenOneAmount])

  function openModal(asset) {
    setChangeToken(asset)
    setIsOpen(true)
  }

  function selectToken(asset, okla) {
    if (asset === 1) setTokenOne(okla)
    if (asset === 2) setTokenTwo(okla)
    setIsOpen(false)
  }

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  )

  return (
    <>
      {contextHolder}
      <Modal open={isOpen} footer={null} onCancel={() => setIsOpen(false)} title="Select a Token">
        <div className="modelContent">
          {tokenList?.map((e, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => {
                  selectToken(changeToken, tokenList[i])
                }}>
                <img src={e.img} alt={e.ticket} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{e.name}</div>
                  <div className="tokenTicker">{e.ticker}</div>
                </div>
              </div>
            )
          })}
        </div>
      </Modal>

      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          {/* <Popover content={settings} title="Settings" trigger="click" placement="bottomRight">
            <SettingOutlined className="corg" />
          </Popover> */}
        </div>

        <div className="inputs">
          <Input placeholder="0" value={tokenOneAmount} onChange={changeAmount} />
          <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
          <div className="switchButton1" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetTwoLogo" className="assetLogo" />
            {tokenTwo.ticker}
            <DownOutlined />
          </div>
        </div>

        <div className="swapButton" disabled={!tokenOneAmount || !isConnected} onClick={onSwap}>
          Swap
        </div>
      </div>
      <div className="tradeBox">
        {tokenOneAmount &&
          dataRoute.map(item => {
            return (
              <div className="oklaContainer">
                {Array.isArray(item.pair[0]) ? (
                  <div className="mainRouter">
                    <div className="mainPercent">{formatPercent(item.percent)}</div>
                    {item.pair.map(ite => {
                      console.log('dadadad___', midOkla[ite[0].pair.token1])
                      return (
                        <div className="pairsongsong">
                          <div className="pairtoken inputs">
                            <img
                              src={midOkla[ite[0].pair.token0] ? midOkla[ite[0].pair.token0] : tokenOne.img}
                              alt="assetOneLogo"
                              className="assetOneOkla"
                            />
                            <div>{'>'}</div>
                            <img
                              src={midOkla[ite[0].pair.token1] ? midOkla[ite[0].pair.token1] : tokenTwo.img}
                              alt="assetOneLogo"
                              className="assetOneOkla"
                            />
                          </div>
                          {ite.map(it => {
                            return <div className="okla">{formatPercent(it.percent) + ' ' + formatAddress(it.pair.provider)}</div>
                            // return <div className="okla">{it.pair.provider}</div>
                          })}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mainRouter">
                    <div className="mainPercent">{formatPercent(item.percent)}</div>
                    <div className="pairsongsong">
                      <div className="pairtoken inputs">
                        <img src={tokenOne.img} alt="assetOneLogo" className="assetOneOkla" />
                        <div>{'>'}</div>
                        <img src={tokenTwo.img} alt="assetOneLogo" className="assetOneOkla" />
                      </div>
                      <div className="pairPool">
                        {item.pair.map(item => {
                          return <div className="">{formatPercent(item.percent) + ' ' + formatAddress(item.pair.provider)}</div>
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </>
  )
}

export default Swap
