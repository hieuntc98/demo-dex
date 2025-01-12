import React, { useState, useEffect } from "react";
import { Input, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
} from "@ant-design/icons";
import tokenList from "../tokenList.json";
import poolList from "../poolList.json";
import ABIPool from "../abiPool.json";
import { useContractWrite,usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import { getBalance} from '@wagmi/core'
import { bscTestnet } from '@wagmi/chains'
import { config } from '../index'
import { toBigNumber } from '../common/index'

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

  const ContractWrite = usePrepareContractWrite({
    address: "0x4Fb7bb788EB7330a4cd2C3EFba21e4D28400B09D",
    abi: ABIPool,
    functionName: 'addLiquidity',
    args: [
      toBigNumber(tokenOneAmount),
      toBigNumber(tokenTwoAmount),
    ],
    enabled:  enableAdd && tokenOneAmount !== null && tokenTwoAmount !== null
  });

  const { write, data } = useContractWrite(ContractWrite.config);
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

  async function getBalances (e){
    const balance = await getBalance(config, {
        address: props.address,
        chainId: bscTestnet.chainId,
        token: e.address, 
    })
    setBalances(balance.formatted)
    console.log(balance,'_balancebalancebalance')
  }

  function addPool() {
    setEnableAdd(true)
  
    if (write) {
      write();
    }
  }

  useEffect(() => {
    if (isSuccess) {
      messageApi.success(`Transaction succeeded: ${data?.hash}!`);
    } else if (isLoading) {
      messageApi.loading('Transaction is pending...');
    }
    setEnableAdd(false)
  }, [isLoading, isSuccess,messageApi,data?.hash]);

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
                    getBalances(e)
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
            tokenOne && 
            <div>  
                <p>Balances: {balances && Math.round(balances)}</p>
            </div>
          }
          {/* <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="corg" />
          </Popover> */}
        </div>

        <div className="inputs">
          <Input
            placeholder="0"
            value={tokenOneAmount}
            onChange={changeAmount}
          />
            <Input
            placeholder="0"
            value={tokenTwoAmount}
            onChange={changeAmount2}
          />
          <Input placeholder={pool.name} />
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
      </div>
    </>
  );
}

export default Pool;
