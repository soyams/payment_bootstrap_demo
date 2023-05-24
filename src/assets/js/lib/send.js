const Web3=require('web3')
let web3;

_init=async function(){

    if(typeof window.ethereum!="undefined"){
        web3=new Web3(window.ethereum)
        try{
           await window.ethereum.request({'method':'eth_requestAccounts',}).then(_account=>{
                web3.eth.defaultAccount=_account
            })
        }
        catch(err){
            console.log(err);
            alert('No selected account found..User rejected the request')
            document.getElementById('error_msg').style.display="block"
            document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message
        }
    }
    // else if(window.web3){
    //     web3=new Web3(window.web3)
    // }
    else{
        console.log("install metamask")
    }

    window.ethereum.on('chainChanged',(_chainId)=>{
        this._getAccount();
    })
    window.ethereum.on('accountsChanged',(_account)=>{
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
      console.log(paymentContract)

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

          const _estimatedGas=await paymentContract._payment.estimateGas(_from,{from:web3.eth.defaultAccount,value:web3.toWei(_amount,'ether')},(err,_estimateGas)=>{
            if(!err){
              console.log("Estimate Gas Limit: "+_estimateGas)
              return _estimateGas;
            }
            else{
              console.log(err)
            }
            
          })

          try
          {
            await paymentContract._payment(_from,{from:web3.eth.defaultAccount,value:web3.toWei(parseFloat(_amount),'ether'),gas:_estimatedGas},async function(err,_txId){//gas:_estimatedGas,gasPrice:_gasPrice

              if(_txId!=null){
                  console.log(_txId)
                  document.getElementById('loading').style.display="block"
                  //set a condition here to execute events
                  await _eventTransfer(_txId);
                  // await _eventRevert();
                }
                else{
                  console.log(err)
                  document.getElementById('error_msg').style.display="block"
                  document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message
                 
                  // setTimeout(function(){
                  //   location.reload()},9000)
                }
    
            })
          }
          catch(err)
          {
            console.log(err)
            alert("transaction revert.")
            document.getElementById('error_msg').style.display="block"
            document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message
            
          }   
            
        }
        else{
          alert("details can't be empty.")
        }
      }
      else{
        web3.eth.defaultAccount=_from.toLowerCase()

      }
    }
    else{
      console.log("change ethereum network to goerli or sepolia only.")
      alert("change ethereum network to goerli or sepolia only.");
    }
}
// _eventRevert=async function(){

//   try{
//     paymentContract._revertTransaction({
//       'toBlock':'latest'
//     }).watch(async (err,_data)=>{
//         if(!err){
//           console.log("event data: ",_data)
//           document.getElementById('loading').style.display="none"
//           alert("Payment Status: "+_data.args._status+" & Failure Cause: "+_data.args.reason)
//           setTimeout(await _generateReceipt(_data.transactionHash),3000)
//         }
//         else{
//           console.log("event error: ",err)
//         }
//     })
//   }
//   catch(err){
//     console.log(err)
//   }
// }
_eventTransfer=async function(_txId){

  try{
    paymentContract._transfer({},{
      'toBlock':'latest'
    }).watch(async (err,_data)=>{
        if(!err){
          console.log("event data: ",_data)
        document.getElementById('loading').style.display="none"
        alert("Payment Status: "+_data.args._status+" & Paid Amount: "+web3.fromWei(JSON.parse(_data.args._amount),'ether'))
        setTimeout(await _generateReceipt(_data.transactionHash),3000)
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
_generateReceipt=async function(_txId){

  let chainId=await window.ethereum.request({'method':'eth_chainId'}).then(chainId=>{
    chainId=web3.toDecimal(chainId)
    return chainId;
  })
  console.log(chainId)
  let networkName="";
  if(chainId=='5'){
    networkName='goerli'
  }
  else if(chainId=='11155111'){
    networkName='sepolia'
  }
  console.log(networkName)
  if(networkName!=""){
    await web3.eth.getTransactionReceipt(_txId,(err,_txDetails)=>{
      console.log(_txDetails)
      _txStatus=(_txDetails.status=='0x1')?"Done":"Fail"
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
        // setTimeout(function(){
        //   location.reload()},20000)
      }
      else{
        console.log(err)
      }
      
    })
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
