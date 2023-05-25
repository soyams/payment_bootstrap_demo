$(document).on('ready',function(){
  $("#payAmount").on('click',function(){
    _proceed()
  })
})


const Web3=require('web3')
let web3;

_init=async function(){

    if(typeof window.ethereum!="undefined"){
      web3=new Web3(window.ethereum)

      Promise.resolve(window.ethereum.request({'method':'eth_requestAccounts',})).then(_account=>{
          web3.eth.defaultAccount=_account
      }).catch(err=>{
          console.log(err)
          alert("Error message: "+err.message)
          document.getElementById('error_msg').style.display="block"
          document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message
      })
    }
    // else if(window.web3){
    //     web3=new Web3(window.web3)
    // }
    else{
        console.log("install metamask")
    }

    window.ethereum.on('chainChanged',(_chainId)=>{
      alert("Selected chain changed")
      this._getAccount();
    })
    window.ethereum.on('accountsChanged',(_account)=>{
      alert("Selected account changed")
      web3.eth.defaultAccount=_account[0];//comment it
      this._getAccount();
    })
    // this._getAccount();
},
_getAccount=async function(){
    await window.ethereum.request({'method':'eth_accounts'}).then(async _acc=>{
        console.log(_acc)
        web3.eth.defaultAccount=_acc[0]
        await window.ethereum.request({'method':'eth_chainId'}).then(_id=>{
            alert("Connected Chain Id: "+_id+" & Connected Account: "+web3.eth.defaultAccount)
        })
    })
    _payment();
},
_checkForReceipt=function(txId){
  return new Promise(function(accept, reject) {
      var timeout = 30000;//30seconds
      var start = new Date().getTime();

      var make_attempt = function() {
        
            web3.eth.getTransactionReceipt(txId, function(err, receipt) {
              if (err){
                console.log(err)
                return reject(err);}

              if (receipt != null) {
                // console.log(receipt)
                return accept(receipt);
              }
             
              if (timeout > 0 && new Date().getTime() - start > timeout) {
                
                let _err=new Error("Transaction wasn't processed in " + (timeout / 1000) + " seconds!")
                return reject(_err);
              }
           
              setTimeout(make_attempt, 1000);
            });
      };
      make_attempt(); 
  })
},
_payment=async function(){

    let _from=document.getElementById("sender_wallet_address").value
    let _amount=document.getElementById("payable_amount").value
    
    let chainId=await window.ethereum.request({'method':'eth_chainId'}).then(chainId=>{
      chainId=web3.toDecimal(chainId)
      return chainId;
    })

    if(chainId=="5" || chainId=='11155111')
    {
      const contract=await $.getJSON('./build/contracts/CryptoPay.json').then(jsonData=>{
        return jsonData;  
      });

      const contractABI=contract.abi
      const _contractAddress=contract.networks[chainId].address   

      paymentContract=web3.eth.contract(contractABI).at(_contractAddress)

      if(web3.eth.defaultAccount.toLowerCase()==_from.toLowerCase()){

        if(_from.length>0 && _amount.length>0)
        {
          const _gasPrice= await web3.eth.getGasPrice((err,_gasPrice)=>{
            if(!err)
            {
              console.log("Estimate Gas Price: "+web3.fromWei(JSON.parse(_gasPrice),'Gwei')+" Gwei")
              return _gasPrice;
            }
            else{
              console.log(err)
            }
          })

          await paymentContract._payment.estimateGas(_from,{from:web3.eth.defaultAccount,value:web3.toWei(_amount,'ether')},async (err,_estimateGas)=>{
            if(!err){
              console.log("Estimate Gas Limit: "+_estimateGas)
              await paymentContract._payment(_from,{from:web3.eth.defaultAccount,value:web3.toWei(parseFloat(_amount),'ether'),gas:_estimateGas},async function(err,_txId){//gas:_estimatedGas,gasPrice:_gasPrice
                console.log("Transaction Id: ",_txId)
                if(!err && _txId!=null){
                  alert("Transaction Id: "+_txId+" & Current Status: Pending")
                  document.getElementById('loading').style.display="block"
                  
                  try{
                    _txS=await _checkForReceipt(_txId)
                      if(_txS.status=='0x1')
                      {
                        await _eventTransfer(_txId,_txS);
                      }
                      else{
                        console.log("Transaction Receipt: ",_txS)
                        document.getElementById('loading').style.display="none"
                        _txStatus=(_txS.status=='0x1')?"Done":"Fail"
                        alert("Transaction Id: "+_txS.transactionHash+" & Transaction Status: "+_txStatus)
                        setTimeout(await _generateReceipt(_txS),3000)
                      }
                  }
                  catch(err){

                    err=err.toString().split(":")
                    err=err.slice(1)
                    err=err.join(":")
                    alert(err+" So, Transaction Receipt will be mailed to you!!")

                    let networkName="";
                    if(chainId=='5'){
                      networkName='goerli'
                    }
                    else if(chainId=='11155111'){
                      networkName='sepolia'
                    }
                    if(networkName!=""){
                      document.getElementById('loading').style.display="none"
                      document.getElementById('success_msg').style.display="none"
                      document.getElementById('success_msg').innerHTML=""
                      document.getElementById('error_msg').style.display="block"
                      document.getElementById('error_msg').innerHTML="Message: "+err+".. Check here: "
                      p_tag=document.getElementById('error_msg')
                      a_tag=document.createElement("a")
                      a_tag.setAttribute('href',"https://"+networkName+".etherscan.io/tx/"+_txId)
                      a_tag.setAttribute('id','tx_id')
                      a_tag.setAttribute('target','_blank')
                      p_tag.appendChild(a_tag);
                      document.getElementById("tx_id").innerHTML=_txId
                      setTimeout(function(){
                        location.reload()},40000)
                   
                    }
                    else{
                      console.log("Switch to goerli or sepolia only")
                    }
                  }
                }
                else{
                  console.log(err)
                  alert("transaction revert.")
                  document.getElementById('success_msg').style.display="none"
                  document.getElementById('success_msg').innerHTML=""
                  document.getElementById('error_msg').style.display="block"
                  document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message   
                  setTimeout(function(){
                    location.reload()},10000) 
                }   
              })
            }
            else{
              console.log(err)
              alert("Transaction Revert..")
              document.getElementById('success_msg').style.display="none"
              document.getElementById('success_msg').innerHTML=""
              document.getElementById('error_msg').style.display="block"
              document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message  
              setTimeout(function(){
                location.reload()},10000) 
            }
            
          })
          
        }
        else{
          alert("details can't be empty.")
        }
      }
      else{
        web3.eth.defaultAccount=_from.toLowerCase()
        // alert('Switch & Connect account')
        // console.log('switch & connect')

      }
    }
    else{
      console.log("change ethereum network to goerli or sepolia only.")
      alert("change ethereum network to goerli or sepolia only.");
    }
}

_eventTransfer=async function(_txId,_txDetails){

  try{
    paymentContract._transfer({},{
      'toBlock':'latest'
    }).watch(async (err,_data)=>{
        if(!err){
          console.log("event data: ",_data)
          document.getElementById('loading').style.display="none"
          alert("Payment Status: "+_data.args._status+" & Paid Amount: "+web3.fromWei(JSON.parse(_data.args._amount),'ether'))
          setTimeout(await _generateReceipt(_txDetails),3000)
        }
        else{
          console.log("event error: ",err)
         
        }
    })
  }
  catch(err){
    console.log(err)
  }
}
_generateReceipt=async function(_txDetails){

  let chainId=await window.ethereum.request({'method':'eth_chainId'}).then(chainId=>{
    chainId=web3.toDecimal(chainId)
    return chainId;
  })

  let networkName="";
  if(chainId=='5'){
    networkName='goerli'
  }
  else if(chainId=='11155111'){
    networkName='sepolia'
  }

  if(networkName!="")
  {
    _txStatus=(_txDetails.status=='0x1')?"Done":"Fail"
    let selected_element='success_msg'
    let unselected_element="error_msg"
    if(_txStatus=='Fail')
    {
      selected_element='error_msg'
      unselected_element="success_msg"
    }
    document.getElementById(unselected_element).style.display="none"
    document.getElementById(selected_element).style.display="block"
    document.getElementById(selected_element).innerHTML="Payment Status: "+_txStatus+" & TransactionHash: "
    p_tag=document.getElementById(selected_element)
    a_tag=document.createElement("a")
    a_tag.setAttribute('href',"https://"+networkName+".etherscan.io/tx/"+_txDetails.transactionHash)
    a_tag.setAttribute('id','tx_id')
    a_tag.setAttribute('target','_blank')
    p_tag.appendChild(a_tag);
    document.getElementById("tx_id").innerHTML=_txDetails.transactionHash
    setTimeout(function(){
      location.reload()},30000)
  }
  else{
    console.log("network must either goerli or sepolia.")
  }
 
}

_proceed=async function(){

  let _from=document.getElementById("sender_wallet_address").value
  clear();
  if(_from.length>0){

    web3=new Web3(window.ethereum)
    const _connected=await window.ethereum.request({"method":'eth_accounts'}).then(_acc=>{
        if(_acc.length>0){
          web3.eth.defaultAccount=_acc[0]
          if(web3.eth.defaultAccount.toLowerCase()==_from.toLowerCase()){
            return ({status:true,data:web3.eth.defaultAccount});
          }else{
            alert("Switch & Connect Account")
            return ({status:false});
          }
        }
        else{
            return ({status:false});
        }
    })
    
    if(_connected.status!=true){
      console.log("isConnected: "+_connected.status)
      await _init();
    }
    else{
      console.log("isConnected: "+_connected.status+" & connectedAccount: "+_connected.data)
      alert("isConnected: "+_connected.status+" & connectedAccount: "+_connected.data)
      await _payment();
    }
  }
  else{
    alert("details cann't be empty")
  }
}
clear=function(){
  document.getElementById('error_msg').innerHTML=""
  document.getElementById('success_msg').innerHTML=""
  document.getElementById('success_msg').style.display="none"
  document.getElementById('error_msg').style.display="none"
}
