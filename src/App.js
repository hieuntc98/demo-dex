import "./App.css";
import Header from "./components/Header";
import Swap from "./components/Swap";
import Pool from "./components/Pool";
import CreatePool from "./components/CreatePool";
import Tokens from "./components/Tokens";
import { Routes, Route } from "react-router-dom";
import { useConnect, useAccount, useChainId } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {connect} = useConnect({
    connector: new MetaMaskConnector(),
  });
  return (
    <div className="App">
        <Header connect={connect} isConnected={isConnected} address={address} chainId={chainId} />
        <div className="mainWindow">
          <Routes>
            <Route
              path="/swap"
              element={<Swap isConnected={isConnected} address={address} />}
            />
              <Route
                path="/liq"
                element={<Pool isConnected={isConnected} address={address} />}
            />
            <Route
                path="/createPool"
                element={<CreatePool isConnected={isConnected} address={address} />}
            />
            <Route path="/tokens" element={<Tokens />} />
          </Routes>
        </div>
    </div>
  );
}

export default App;
