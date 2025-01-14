import React, {useState, useEffect} from 'react'
import {Input, Popover, Radio, Modal, message} from 'antd'
import {ArrowDownOutlined, DownOutlined, SettingOutlined} from '@ant-design/icons'
// import tokenList from '../tokenList.json'
import tokenList from '../tokenbsc.json'
import axios from 'axios'
import {useSendTransaction, useWaitForTransaction} from 'wagmi'
import {main} from './useSwap'

const formatPercent = percent => {
  return parseFloat(percent * 100).toFixed(2)
}

function Swap(props) {
  const {address, isConnected} = props
  const [messageApi, contextHolder] = message.useMessage()
  const [slippage, setSlippage] = useState(2.5)
  const [tokenOneAmount, setTokenOneAmount] = useState(0)
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null)
  const [tokenOne, setTokenOne] = useState(tokenList[2])
  const [tokenTwo, setTokenTwo] = useState(tokenList[3])
  const [dataRoute, setData] = useState([])
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
      data: String(txDetails.data),
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
    const data = await main(tokenOne.address, tokenTwo.address, tokenOneAmount)
    setData(data.dataUI)
    setTokenTwoAmount(data.amountOut/10**18)
  }

  useEffect(() => {
    getRouterSwap()
  }, [tokenOne.address, tokenTwo.address, tokenOneAmount])

  function openModal(asset) {
    setChangeToken(asset)
    setIsOpen(true)
  }

  function selectToken(asset, okla) {
    if(asset===1) setTokenOne(okla)
    if(asset===2) setTokenTwo(okla)
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
              <div className="tokenChoice" key={i} onClick={()=>{selectToken(changeToken,tokenList[i])}}>
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

        <div className="swapButton" disabled={!tokenOneAmount || !isConnected}>
          Swap
        </div>
      </div>
      <div className="tradeBox">
        { tokenOneAmount && dataRoute.map(item => {
          return (
            <div className="oklaContainer">
              {Array.isArray(item.pair[0]) ? (
                <div className="mainRouter">
                  <div className="mainPercent">{formatPercent(item.percent)}</div>
                  {item.pair.map(ite => {
                    return (
                      <div className="pairsongsong">
                        <div className="pairtoken inputs">
                          <img src={tokenOne.img} alt="assetOneLogo" className="assetOneOkla" />
                          <div>{'>'}</div>
                          <img src={tokenTwo.img} alt="assetOneLogo" className="assetOneOkla" />
                        </div>
                        {ite.map(it => {
                          return <div className="okla">{formatPercent(it.percent)}</div>
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
                        return <div className="">{formatPercent(item.percent)}</div>
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
