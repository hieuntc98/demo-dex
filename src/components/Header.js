import React from "react";
import Logo from "../my-logo.png";
import Eth from "../eth.svg";
import { Link } from "react-router-dom";

function Header(props) {
  const { address, isConnected, connect } = props;

  return (
    <header>
      <div className="leftH">
        <img src={Logo} alt="logo" className="logo" />
        {/* <Link to="/" className="link">
          <div className="headerItem">Swap</div>
        </Link> */}
        <Link to="/" className="link">
          <div className="headerItem">Pool</div>
        </Link>
        {/* <Link to="/tokens" className="link">
          <div className="headerItem">Tokens</div>
        </Link> */}
      </div>

      <div className="rightH">
        <div className="headerItem">
          <img src={"https://testnet.bscscan.com/assets/bsc/images/svg/logos/chain-light.svg?v=25.1.1.1"} alt="eth" className="eth" />
          BSC Testnet
        </div>
        <div className="connectButton" onClick={connect}>
          {isConnected
            ? address.slice(0, 4) + "..." + address.slice(38)
            : "Connect"}
        </div>
      </div>
    </header>
  );
}

export default Header;
