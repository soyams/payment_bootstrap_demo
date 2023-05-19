
$("document").on('ready',function(){
  console.log("hi");

  $("#payAmount").on('click',App._proceed())
})

App = {
  web3Provider: null,
  contract: {},
  account:'0x0',

  init: function() {
    return App.initWeb3();
  },


  initWeb3: function() {
    if(window.ethereum){
      App.web3Provider=window.ethereum
      Promise.resolve(window.ethereum.request({method:'eth_requestAccounts'})).then(function(_acc){
        window.ethereum.defaultAccount=_acc[0];
        console.log(window.ethereum.defaultAccount);
      }).catch(function(err){console.log(err);});
    }
    else if(window.web3){
      App.web3Provider=window.web3.currentProvider;
    }
    else{
      App.web3Provider=new Web3.providers.HttpProvider("http://127.0.0.1:8545");
    }
    web3=new Web3(App.web3Provider);
    // console.log(web3);
    App.initContract();
  },

  initContract: function() {
    
    $.getJSON('./build/contracts/CryptoPay.json',function(json_data){
      App.contract.transaction_contract=TruffleContract(json_data);
      App.contract.transaction_contract.setProvider(App.web3Provider);
      App.get_account();
    });
  },

  get_account:function(){
   web3.eth.getAccounts(function(err,_acc){
      web3.eth.defaultAccount=_acc[0];
      //  App.get_account_balance();
      App._payment();
    });
  },
  get_account_balance:function(){
  
    App.contract.transaction_contract.deployed().then(function(_instance){
      console.log(web3.eth.defaultAccount)
      Promise.resolve(_instance._getBalance(web3.eth.defaultAccount)).then(function(_bal){
        balance=parseFloat(_bal);
        console.log("WALLET BALANCE:"+web3.fromWei(balance,"ether")+" Ether");
        return true;
        }).catch(function(err){
        console.log(err);
        return false;
      });
    });
  },
  _payment:function(){    

    var _to="0xf7e8A6B110FaDbBfB30e0754e6222A5EbCdA393d"
    var _from=document.getElementById("sender_wallet_address").value
    var _amount=document.getElementById("payable_amount").value
    console.log(_to, _from,_amount)
      App.contract.transaction_contract.deployed().then(_instance=>{
          Promise.resolve(_instance._payment(_from,_to,{
            from:_from,
            gas:4000000,
            value:web3.toWei(_amount,"ether")
          })).then(_resp=>{
            console.log(_resp)
            if(_resp.receipt.status=='0x1'){
    
              console.log("transaction done.")
              alert("Transaction Done... Transaction Id: "+_resp.tx)
              App._event_transfer();          
            }
            else{
              console.log("transaction revert")
              alert("TxnId: "+_resp.tx+" Failed.")
            }
          }).catch(function(err){
            console.log(err);
          })
        })
  },
  _event_transfer:function(){
    
    App.contract.transaction_contract.deployed().then(function(_instance){
      _instance._transfer({},{
        'to':'latest'
      }).watch((err,res)=>{
        console.log(res)
        
        setTimeout(() => {
          App.get_account_balance();
        }, 3000);
      })
    })
  },
  _proceed:async ()=>{
    
    const _connected=await window.ethereum.request({"method":'eth_accounts'}).then(_acc=>{
      if(_acc.length>0){
        return ({status:true,data:_acc});
      }
      else{
        return ({status:false});
      }
    
    })
    console.log(_connected)
    if(_connected.status==true){
      await  App.init();//working
    }
    else{
      await App._payment();
    }
}
};
