import React, { useState, useEffect } from "react";
import { Input, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
} from "@ant-design/icons";
import tokenList from "../tokenList.json";
import poolList from "../poolList.json";
import ABIToken from "../token.json";
import ABIPool from "../abiPool.json";
import ABIRouter from "../abiRouter.json";
import { useContractWrite,usePrepareContractWrite, useWaitForTransaction,useContractRead,useBlockNumber} from "wagmi";
import { getBalance} from '@wagmi/core'
import { bscTestnet } from '@wagmi/chains'
import { config } from '../index'
import { toBigNumber } from '../common/index'
import converter from 'hex2dec'
import BigNumber from 'bignumber.js'

function Pool(props) {
  const { address, isConnected } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [tokenOneAmount, setTokenOneAmount] = useState(null); 
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState('');
  const [tokenTwo, setTokenTwo] = useState('');
  const [pool,setPool] = useState('')
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenToken, setIsOpenToken] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [balances,setBalances] = useState(null)
  const [enableAdd,setEnableAdd] = useState(false)
  const [enableRemove,setEnableRemove] = useState(false)
  const result = useBlockNumber()
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const deadline = currentTimestamp + 100000; // 5 minutes from now

  console.log(balances,'-balancesbalances')
  console.log(pool,'_poolpool')
  const { data: reserves } = useContractRead({
    address: pool.address,
    abi: ABIPool,
    functionName: 'getReserves',
    enabled: pool && tokenOneAmount !== null
  });

  const reserve0 = pool && reserves ? new BigNumber(String(converter.hexToDec(reserves[0]._hex))) : 0;
  const reserve1 = pool && reserves ? new BigNumber(String(converter.hexToDec(reserves[1]._hex))) : 0;
  const rate = reserve0 && reserve1 && reserve0.div(reserve1) 
  console.log(rate,'_ratev')
  const checkAvailableReserves =  pool && reserve0 && reserve1 && converter.hexToDec(reserves[1]._hex) == 0 && converter.hexToDec(reserves[0]._hex) == 0

  useEffect(() => {
    if(tokenOneAmount == null && tokenTwoAmount == null) return 
    if(checkAvailableReserves) return
    const amountToken1 = (tokenOneAmount/rate.toFixed(2)).toFixed(2)
    setTokenTwoAmount(amountToken1)
  }, [tokenOneAmount,reserves,rate,tokenTwoAmount,checkAvailableReserves])

  const actionAddLiquidity = usePrepareContractWrite({
    address: pool.address,
    abi: ABIPool,
    functionName: 'addLiquidity',
    args: [
      toBigNumber(tokenOneAmount),
      toBigNumber(tokenTwoAmount),
    ],
    enabled: pool && enableAdd && tokenOneAmount !== null && tokenTwoAmount !== null
  });

  const actionRemoveLiquidity = usePrepareContractWrite({
    address: pool.address,
    abi: ABIPool,
    functionName: 'removeLiquidity',
    args: [
      toBigNumber(tokenOneAmount),
      toBigNumber(tokenTwoAmount),
    ],
    enabled: pool && enableRemove
  });

  const { write, data } = useContractWrite(actionAddLiquidity.config);
  const { write: wirteRemove, data: removeLiquidity} = useContractWrite(actionRemoveLiquidity.config);

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });


  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
  }


  function changeAmount2(e) {
    setTokenTwoAmount(e.target.value);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }
  
  function onSelectPool(pool){
    console.log(pool)
    setPool(pool)
    setTokenOne(pool.token[0])
    setTokenTwo(pool.token[1])
    setIsOpen(false)
  }

  function onSelectToken(){
    setIsOpenToken(true)
  }

  async function getBalances (){
    const balance1 = await getBalance(config, {
        address: props.address,
        chainId: bscTestnet.chainId,
        token: pool && pool.token[0].address, 
    })
    const balance2 = await getBalance(config, {
      address: props.address,
      chainId: bscTestnet.chainId,
      token: pool && pool.token[1].address, 
    })
    const balance3 = await getBalance(config, {
      address: props.address,
      chainId: bscTestnet.chainId,
      token: pool && pool.tokenLP, 
    })
    setBalances([balance1.formatted,balance2.formatted,balance3.formatted])
  }

  console.log(balances,'__-balancesbalances')

  useEffect(() => {
    if(pool){
      getBalances()
    }
  },[pool])

  function addPool() {
    setEnableAdd(true)
    if (write) {
      write();
      getBalances()
    }
  }

  function removePool(){
    setEnableRemove(true)
    console.log(wirteRemove,'_wirteRemove')
    if(wirteRemove){
      wirteRemove()
      getBalances()
    }
  }

  useEffect(() => {
    if(removeLiquidity?.hash){
      messageApi.success(`Transaction succeeded: ${removeLiquidity?.hash}!`);
    }
    if(enableAdd || enableRemove){
      getBalances()
    }
    setEnableAdd(false)
    setEnableRemove(false)
  },[removeLiquidity?.hash,messageApi])
  useEffect(() => {
    if (isSuccess) {  
      messageApi.success(`Transaction succeeded: ${data?.hash}!`);
    } else if (isLoading) {
      messageApi.loading('Transaction is pending...');
    }

    if(enableAdd || enableRemove){
      getBalances()
    }

    setEnableAdd(false)
    setEnableRemove(false)
  }, [isLoading, isSuccess,messageApi,data?.hash]);

  console.log(tokenOne && tokenTwo && rate && tokenOneAmount,'_tokenOneAmounttokenOneAmount')
  return (
    <>
      {contextHolder}
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a Pool"
      >
        <div className="modelContent">
          {poolList?.map((e, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => onSelectPool(e)}
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
      <Modal
        open={isOpenToken}
        footer={null}
        onCancel={() => setIsOpenToken(false)}  
        title="Select a Token"
      >
        <div className="modelContent">
          {pool.token?.map((e, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => {
                    setIsOpenToken(false)
                }}
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
          <h4>Pool</h4>
          {
            tokenOne && tokenTwo && 
            <div>  
                <span>BalancesLP: {balances && balances[2] && Number(balances[2]).toFixed(2)}</span>
            </div>
          }
        </div>
        {tokenOneAmount && tokenOne && tokenTwo && rate &&
          <div className="spanDev">
            <span >{checkAvailableReserves ? 0 : Number(rate.toFixed(2))} {tokenOne.ticker} per {tokenTwo.ticker}</span>
          </div>
        }  
        <div className="inputs">
        {
            tokenOne && tokenTwo && 
            <div className="balances1">  
                <p>Balances: {balances && Math.round(balances[0])}</p>
            </div>
          }
          <Input
            placeholder="0"
            value={tokenOneAmount}
            onChange={changeAmount}
          />
            {
            tokenOne && tokenTwo && 
            <div className="balances2">  
                <p className="mb2">Balances: {balances && Math.round(balances[1])}</p>
            </div>
          }
            <Input
            placeholder="0"
            disabled={!checkAvailableReserves}
            value={tokenTwoAmount}
            onChange={changeAmount2}
          />
          <Input placeholder={pool.name} disabled={true}/>
          <div className="switchButton">
            <ArrowDownOutlined className="switchArrow" disabled={true} />
          </div>
          <div className="assetOne" onClick={() => pool ? onSelectToken() : openModal(2)}>
            {
                !tokenOne ? 
                <p>Select Token</p>
                : 
                <>
                <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
                {tokenOne.ticker}
                </>
            }
           
            <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
          {
                !pool ? 
                <p>Select Token</p>
                : 
                <>
                <img src={tokenTwo.img} alt="assetOneLogo" className="assetLogo" />
                {tokenTwo.ticker}
                </>
            }
            <DownOutlined />
          </div>
          <div className="assetThree" onClick={() => openModal(2)}>
          {
                !pool ? 
                <p>Select Pool</p>
                : 
                <>
                <img src={pool.img} alt="assetOneLogo" className="assetLogo" />
                {/* {pool.name} */}
                </>
            }
            <DownOutlined />
          </div>
        </div>

        <div
          className="swapButton"
          onClick={addPool}
          disabled={!tokenOneAmount || !isConnected}
        >
          Add Pool
        </div>

        <div
          className="swapButton"
          onClick={removePool}
          disabled={!tokenOneAmount || !isConnected}
        >
          Remove Pool
        </div>
      </div>
    </>
  );
}

export default Pool;
