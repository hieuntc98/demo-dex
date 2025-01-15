import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
} from "@ant-design/icons";
import tokenList from "../tokenList.json";

import { useContractRead, useContractWrite, usePrepareContractWrite, useSendTransaction, useWaitForTransaction } from "wagmi";
import abiFactory from "../abi/abiFactory.json";
import abiRouter from "../abi/abiRouterAMM.json";
import abiPool from "../abi/apiPool.json";
import converter from 'hex2dec'



import { convertBalanceToWei, convertWeiToBalance, toBigNumber } from "../common";
import BigNumber from "bignumber.js";


const contractAMM = {
  factory: '0x7b6547bDf364C43EBf412295327ac991575D2253',
  router: '0xF2dF2d17d6e89494eCBddad375d13B2315f73F66'
}


function SwapAMM(props) {
  const { address, isConnected } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [tokenOneAmount, setTokenOneAmount] = useState(0);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);


  const { data: addressPair} = useContractRead({
    address: contractAMM.factory,
    abi: abiFactory,
    functionName: 'getPool',
    args: [tokenOne.address, tokenTwo.address],
  });
  console.log("🚀 ~ SwapAMM ~ addressPair:", addressPair)


  const { data: dataPool} = useContractRead({
    address: addressPair,
    abi: abiPool,
    functionName: 'getReserves',
  });
  
  const reserve0 =  new BigNumber(convertWeiToBalance(dataPool[0]._hex ? (converter.hexToDec(dataPool[0]._hex)) : 0))
  const reserve1 =  new BigNumber(convertWeiToBalance(dataPool[1]._hex ? (converter.hexToDec(dataPool[1]._hex)) : 0))

  const k = reserve0.multipliedBy(reserve1)   // x * y = k
        
  const newReserve0 =  reserve0.plus(tokenOneAmount)
  const newReserve1 = k.div(newReserve0);
  const amountOut = reserve1.minus(newReserve1)

  const configSwap = usePrepareContractWrite({
    address: contractAMM.router,
    abi: abiRouter,
    functionName: 'swapExactTokensForTokens',
    args: [
      tokenOne.address,
      tokenTwo.address,
      convertBalanceToWei(tokenOneAmount),
      address
    ],
    enabled: !!tokenOneAmount
  });
  // console.log("🚀 ~ SwapAMM ~ configSwap:", configSwap.error)

  const { write, data, isSuccess } = useContractWrite(configSwap.config);




  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  const onSelectToken = (item) => () => {
    if(changeToken === 1){
      setTokenOne(item)
    }else{
      setTokenTwo(item)
    }
    setIsOpen(false);

  }

  const onSwap = () => {
    write && write()
  }

  useEffect(() => {
  console.log("🚀 ~ SwapAMM ~ data?.hash:", data?.hash)

    if(data?.hash){
      messageApi.success(`Transaction succeeded: ${data?.hash}!`);
    }

  }, [ messageApi, data?.hash]);

  return (
    <>
      {contextHolder}
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a Token"
      >
        <div className="modelContent">
          {tokenList?.map((e, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={onSelectToken(e)}
              >
                <img src={e.img} alt={e.ticket} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{e.name}</div>
                  <div className="tokenTicker">{e.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
        </div>

        <div className="inputs">
          <Input
            placeholder="0"
            value={tokenOneAmount}
            onChange={changeAmount}
          />
          <Input placeholder="0" value={amountOut} disabled={true} />
          <div className="switchButton1">
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

        <div
          className="swapButton"
          disabled={!tokenOneAmount || !isConnected}
          onClick={onSwap}
        >
          Swap
        </div>
      </div>
    </>
  );
}

export default SwapAMM;
