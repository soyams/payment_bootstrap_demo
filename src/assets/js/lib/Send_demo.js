$(document).on('ready',function(){
  $("#payAmount").on('click',function(){
    App._proceed()
  })
})

const Web3=require('web3');
let web3;
App = {
  web3Provider: null,
  contract: {},
  account:'0x0',

  init: function() {
    return App.initWeb3();
  },
  initWeb3: function() {
    if(typeof window.ethereum !='undefined'){
      App.web3Provider=window.ethereum
      Promise.resolve(window.ethereum.request({'method':'eth_requestAccounts'})).then(_acc=>{
        web3.eth.defaultAccount= _acc[0];
        // window.ethereum.defaultAccount=_acc[0]
      }).catch(err=>{
        console.log(err)
        alert("Error message: "+err.message)
        document.getElementById('error_msg').style.display="block"
        document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message
      })
    }
    // else if(window.web3){
    //   App.web3Provider=window.web3.currentProvider
    // }
    else{
      alert("install ethereum wallet")
    }
    web3=new Web3(App.web3Provider)

    window.ethereum.on('accountsChanged',(account)=>{
      alert("Selected account changed")
      web3.eth.defaultAccount=account[0];//comment it
      App.get_account();
    })
    window.ethereum.on('chainChanged',(chainId)=>{
      alert("Selected chain changed")
      App.get_account();
    })
    
  },

  get_account:async function(){
    await window.ethereum.request({"method":"eth_chainId"}).then(async chainId=>{
      if(web3.eth.defaultAccount=='undefined'){
        await window.ethereum.request({"method":"eth_accounts"}).then(async function(err,_acc){
            web3.eth.defaultAccount=_acc[0];
            console.log("Connected Chain Id: "+chainId+" & Connected Account: "+web3.eth.defaultAccount)
            alert("Connected Chain Id: "+chainId+" & Connected Account: "+web3.eth.defaultAccount) //web3.toDecimal(chainId)
            await App._payment();
        });
      }
      else{
        console.log("Connected Chain Id: "+chainId+" & Connected Account: "+web3.eth.defaultAccount)
        alert("Connected Chain Id: "+chainId+" & Connected Account: "+web3.eth.defaultAccount)//web3.toDecimal(chainId)
        await App._payment();
      }    
    })
     
  },
  
  _payment:async function(){    
    
    let _from=document.getElementById("sender_wallet_address").value
    let _amount=document.getElementById("payable_amount").value

    let chainId=await window.ethereum.request({'method':'eth_chainId'}).then(_chainId=>{
      return (web3.toDecimal(_chainId));
    })

    if(chainId=='5' || chainId=='11155111')
    {
      if(_from.length>0 && _amount>0)
      {
        if(web3.eth.defaultAccount!='undefined')
        {
          try
          {
            if(web3.eth.defaultAccount.toLowerCase()==_from.toLowerCase())
            {
              App.web3Provider=window.ethereum
              $.getJSON('./build/contracts/CryptoPay.json',function(json_data){
                App.contract.transaction_contract=TruffleContract(json_data);
                App.contract.transaction_contract.setProvider(App.web3Provider);

              // });

                App.contract.transaction_contract.deployed().then(async _instance=>{
                  const _estimatedGas=await _instance._payment.estimateGas(_from,{from:_from,gas:4000000,value:web3.toWei(parseFloat(_amount),"ether")}).then(_estimatedGas=>{
                    return ({status:true,data:_estimatedGas});
                  }).catch(err=>{
                    console.log(err)
                    return ({status:false,data:err.message});
                  })
                  if(_estimatedGas.status!=false)
                  {
                    Promise.resolve(_instance._payment(_from,{from:_from,gas:_estimatedGas.data,value:web3.toWei(parseFloat(_amount),"ether")})).then(_txDetails=>{
                      console.log(_txDetails)
                      document.getElementById('loading').style.display="block"

                      let networkName="";
                      if(chainId=='5'){
                        networkName='goerli'
                      }
                      else if(chainId=='11155111'){
                        networkName='sepolia'
                      }
                      
                      if(_txDetails.receipt.status=='0x1'){
                        console.log("transaction done.")
                        _txStatus=(_txDetails.receipt.status=='0x1')?"Done":"Fail"
                        alert("Payment Status: "+_txStatus+" & Paid Amount: "+web3.fromWei(JSON.parse(parseFloat(_txDetails.logs[0].args._amount)),'ether'))+' eth'
                        App._event_transfer(networkName);          
                      }
                      else{
                        console.log("transaction revert")
                        alert("TxnId: "+_txDetails.tx+" Failed.")
                        App._revert(networkName,_txDetails);
                      }
                    }).catch(function(err){
                      console.log(err.message);
                      alert("Error message: "+err.message)
                      document.getElementById('success_msg').style.display="none"
                      document.getElementById('success_msg').innerHTML=""
                      document.getElementById('error_msg').style.display="block"
                      document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message
                    })
                  
                  }
                  else{
                    alert("Error message: "+_estimatedGas.data)
                    document.getElementById('success_msg').style.display="none"
                    document.getElementById('success_msg').innerHTML=""
                    document.getElementById('error_msg').style.display="block"
                    document.getElementById('error_msg').innerHTML="Error Message: "+_estimatedGas.data
                  }
                  
                }).catch(err=>{
                  console.log(err)
                  alert(err+".. Switch to goerli or sepolia chain only.")
                  document.getElementById('success_msg').style.display="none"
                  document.getElementById('success_msg').innerHTML=""
                  document.getElementById('error_msg').style.display="block"
                  document.getElementById('error_msg').innerHTML=err
                })
              })
            }
            else{
              alert('Switch & Connect account')
              console.log('switch & connect')
            }
          }
          catch(err){
            console.log(err)
            // alert("No selected account.")
          }
          
        }
        else{
          await App.get_account();
        } 
      }
      else{
        console.log("details are missing")
        alert('details are missing')
      }
    }
    else{
      alert("Switch chain to goerli or sepolia testnet only.");
    }  
  },
  _event_transfer:async function(networkName){

    App.contract.transaction_contract.deployed().then(function(_instance){
      _instance._transfer({},{
        'to':'latest'
      }).watch((err,_txDetails)=>{
       
        if(networkName!="")
        {
        document.getElementById('loading').style.display="none"
        console.log(_txDetails)
        _txStatus=(_txDetails.args._status==true)?"Done":"Fail"
        if(!err){
          document.getElementById('error_msg').style.display="none"
          document.getElementById('success_msg').style.display="block"
          document.getElementById('success_msg').innerHTML="Payment Status: "+_txStatus+" & TransactionHash: "
          p_tag=document.getElementById('success_msg')
          a_tag=document.createElement("a")
          a_tag.setAttribute('href',"https://"+networkName+".etherscan.io/tx/"+_txDetails.transactionHash)
          a_tag.setAttribute('id','tx_id')
          a_tag.setAttribute('target','_blank')
          p_tag.appendChild(a_tag);
          document.getElementById("tx_id").innerHTML=_txDetails.transactionHash
          setTimeout(() => {
            location.reload();
          }, 12000);
        }
        else{
          console.log(err)
          document.getElementById('error_msg').style.display="block"
          document.getElementById('error_msg').innerHTML=err
        }
      }
      else{
        console.log('Select goerli or sepolia chain only')
      }
      })
    })
  },
  _revert:(networkName,_txDetails)=>{

    if(networkName!=""){
      document.getElementById('loading').style.display="none"
    
      _txStatus=(_txDetails.receipt.status=='0x1')?"Done":"Fail"
      document.getElementById('success_msg').style.display="none"
      document.getElementById('error_msg').style.display="block"
      document.getElementById('error_msg').innerHTML="Payment Status: "+_txStatus+" & TransactionHash: "
      p_tag=document.getElementById('error_msg')
      a_tag=document.createElement("a")
      a_tag.setAttribute('href',"https://"+networkName+".etherscan.io/tx/"+_txDetails.receipt.transactionHash)
      a_tag.setAttribute('id','tx_id')
      a_tag.setAttribute('target','_blank')
      p_tag.appendChild(a_tag);
      document.getElementById("tx_id").innerHTML=_txDetails.receipt.transactionHash
      setTimeout(() => {
        location.reload();
      }, 6000);
    }
    else{
      console.log("Select goerli or sepolia chain only")
    }
    
  },
  _proceed:async ()=>{
    
    _from=document.getElementById("sender_wallet_address").value
    App._clear();
    if(_from.length>0)
    {
      web3=new Web3(window.ethereum)
      const _connected=await window.ethereum.request({"method":'eth_accounts'}).then(_acc=>{
        if(_acc.length>0)
        {
          web3.eth.defaultAccount=_acc[0]
          if(web3.eth.defaultAccount.toLowerCase()==_from.toLowerCase()){
            return ({status:true,data:_acc});//web3.eth.defaultAccount
          }
          else{
            alert('Switch & Connect account')
            return ({status:false});
          }
        }
        else{
          return ({status:false});
        }
      })

      if(_connected.status!=true){
        console.log("connected : "+_connected.status)
        await  App.init();
      }
      else{
        console.log("connected : "+_connected.status+" & connected account: "+_connected.data)
        alert("Connected : "+_connected.status+" & Connected Account: "+_connected.data)
        await App._payment();
      }
    }
    else{
      alert('details is missing')
    }  
  },
  _clear:()=>{
   
    document.getElementById('error_msg').innerHTML=""
    document.getElementById('success_msg').innerHTML=""
    document.getElementById('success_msg').style.display="none"
    document.getElementById('error_msg').style.display="none"
    
  }
};
