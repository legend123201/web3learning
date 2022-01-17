import React, { useEffect, useState } from "react";
// This function detects most providers injected at window.ethereum
import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from "web3";
import Contract from "web3-eth-contract";
import secret from "./secret";
import { abiContract, addressContract } from "../abis/contractAbi";

const MainPage = () => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentChainId, setCurrentChainId] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [currentDestinationAccount, setCurrentDestinationAccount] = useState(null);
  const [currentAmount, setCurrentAmount] = useState(null);
  let web3 = new Web3(Web3.givenProvider);

  useEffect(() => {
    web3.eth.getTransactionCount("0x0DAFb9795fc94Cd2e54fe16dE33fC1f875EC6ff9").then(console.log);

    console.log(web3.eth.currentProvider);
  }, []);

  useEffect(async () => {
    //  const account = await web3.eth.getAccounts();
    if (currentAccount && currentChainId) {
      getBalanceCurrentAccount();
    }
  }, [currentAccount, currentChainId]);

  const getBalanceCurrentAccount = () => {
    try {
      web3.eth.getBalance(currentAccount).then((balance) => {
        setCurrentBalance(web3.utils.fromWei(balance, "ether"));
      });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    async function checkMetaMask() {
      const provider = await detectEthereumProvider();

      if (provider) {
        // From now on, this should always be true:
        // provider === window.ethereum
        if (provider !== window.ethereum) {
          console.error("Do you have multiple wallets installed?");
          alert("Request Failed! Do you have multiple wallets installed?");
          return;
        } else {
          console.log("Access the decentralized web!");
        }

        // nếu như provider hợp lệ
        // hàm lấy chain ID
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        handleChainChanged(chainId);

        // method đăng nhập account có sẵn
        window.ethereum
          .request({ method: "eth_accounts" })
          .then(handleAccountsChanged)
          .catch((err) => {
            // Some unexpected error.
            // For backwards compatibility reasons, if no accounts are available,
            // eth_accounts will return an empty array.
            console.error(err);
          });

        // sự kiện khi chain thay đổi
        window.ethereum.on("chainChanged", handleChainChanged);
        // sự kiện khi account thay đổi
        window.ethereum.on("accountsChanged", handleAccountsChanged);
      } else {
        console.log("Please install MetaMask!");
      }
    }
    checkMetaMask();
  }, []);

  // hàm này chạy khi thay đổi chain
  function handleChainChanged(_chainId) {
    // We recommend reloading the page, unless you must do otherwise
    // window.location.reload();
    setCurrentChainId(_chainId);
  }

  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log("Please connect to MetaMask.");
    } else if (accounts[0] !== currentAccount) {
      // currentAccount = accounts[0];
      // Do any other work!
      console.log(accounts);
      setCurrentAccount(accounts[0]);
    } else {
      alert("Đã đăng nhập!");
    }
  }

  const connect = () => {
    window.ethereum
      .request({ method: "eth_requestAccounts" })
      .then(handleAccountsChanged)
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log("Please connect to MetaMask.");
        } else {
          console.error(err);
        }
      });
  };

  const handleOnChangeDestinationAccount = (event) => {
    // console.log(event.target.value);
    setCurrentDestinationAccount(event.target.value.trim());
  };

  const handleOnChangeAmount = (event) => {
    // console.log(event.target.value);
    setCurrentAmount(event.target.value);
  };

  const handleSendTransaction = () => {
    if (!currentDestinationAccount) {
      alert("Chưa chọn tài khoản để chuyển đến!");
      return;
    }

    if (!currentAmount) {
      alert("Chưa số tiền để chuyển!");
      return;
    }

    try {
      web3.eth
        .sendTransaction({
          from: currentAccount,
          to: currentDestinationAccount,
          value: web3.utils.toWei(currentAmount, "ether"),
        })
        .then(function (receipt) {
          console.log(receipt);
          getBalanceCurrentAccount();
        });
    } catch (e) {
      console.log(e);
      alert("Sai thông tin tài khoản muốn chuyển đến!");
    }
  };

  const handleSendInteractSmartContract = async () => {
    // const providerURL = secret.providerURL;
    try {
      const contract = new web3.eth.Contract(abiContract, addressContract);
      let balance = await contract.methods.balanceOf("0x27dd28928097402B335ca0534A2CEd7dc6B134D6").call();
      console.log(balance);
    } catch (e) {
      alert("Lỗi! Vui lòng kiểm tra Network có phải là Ropsten hay không?");
    }
  };

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand" href="#">
            Super Dapp
          </a>
          <div className="d-flex">
            <button type="button" className="btn btn-warning" onClick={connect}>
              Login MetaMask
            </button>
          </div>
        </div>
      </nav>
      <div className="container">
        <div
          className="border rounded border-dark p-3  mt-2"
          style={{
            background: "linear-gradient(rgba(202, 194, 236, 0.9) 0%, rgba(204, 220, 239, 0.9) 51.04%, rgba(206, 236, 243, 0.9) 100%)",
          }}
        >
          <h3>Network (ChainId ID): {currentChainId}</h3>
          <h1>Account ID: {currentAccount}</h1>
          <h2>Current Balance: {currentBalance} ETH</h2>
        </div>

        <div className="border rounded border-dark p-3 mt-2 d-flex justify-content-center">
          <div>
            <h2 className="text-center">Chuyển tiền:</h2>
            <h2>Tài khoản muốn chuyển tiền: </h2>
            <input type="text" className="form-control" onChange={handleOnChangeDestinationAccount} />
            <h2 className="mt-2">Số tiền muốn chuyển: </h2>
            <div className="input-group mb-3">
              <span className="input-group-text">ETH</span>
              <input
                type="number"
                className="form-control"
                aria-label="Dollar amount (with dot and two decimal places)"
                onChange={handleOnChangeAmount}
              />
            </div>
            <button type="button" className="btn btn-primary mt-2 d-block ms-auto" onClick={handleSendTransaction}>
              Chuyển tiền
            </button>
          </div>
        </div>

        <button type="button" style={{ display: "block" }} className="btn btn-primary mt-2" onClick={handleSendInteractSmartContract}>
          Interact with smart contract on Ropsten network
        </button>
      </div>
    </div>
  );
};

export default MainPage;
