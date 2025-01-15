import "./App.css";
import Header from "./components/Header";
import Swap from "./components/Swap";
import Pool from "./components/Pool";
import CreatePool from "./components/CreatePool";
import Tokens from "./components/Tokens";
import { Routes, Route } from "react-router-dom";
import { useConnect, useAccount } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import SwapAMM from "./components/SwapAMM";

function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });
  return (
    <div className="App">
        <Header connect={connect} isConnected={isConnected} address={address} />
        <div className="mainWindow">
          <Routes>
            <Route
              path="/"
              element={<Swap isConnected={isConnected} address={address} />}
            />
            <Route
                path="/pool"
                element={<Pool isConnected={isConnected} address={address} />}
            />
            <Route
                path="/createPool"
                element={<CreatePool isConnected={isConnected} address={address} />}
            />
            <Route path="/tokens" element={<Tokens />} />

            <Route
              path="/swapAMM"
              element={<SwapAMM isConnected={isConnected} address={address} />}
            />
          </Routes>
        </div>
    </div>
  );
}

export default App;
