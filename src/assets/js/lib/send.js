const Web3=require('web3')
let web3;

_init=async function(){
    if(typeof window.ethereum!="undefined"){
        web3=new Web3(window.ethereum)
        try{
           await window.ethereum.request({'method':'eth_requestAccounts'}).then(_account=>{
                web3.eth.defaultAccount=_account
            })
        }
        catch(err){
            console.log(err);
            alert('No selected account found..User rejected the request')
            // _proceed();
        }
    }
    else if(window.web3){
        web3=new Web3(window.web3)
    }
    else{
        console.log("install metamask")
    }

    window.ethereum.on('chainChanged',(_chainId)=>{
        this._getAccount();
    })
    window.ethereum.on('accountsChanged',(_account)=>{
        this._getAccount();
    })
    this._getAccount();
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

_payment=async function(response){

    let _to="0xf7e8A6B110FaDbBfB30e0754e6222A5EbCdA393d"
    let _from=document.getElementById("sender_wallet_address").value
    let _amount=document.getElementById("payable_amount").value

    let chainId=await window.ethereum.request({'method':'eth_chainId'}).then(chainId=>{
      chainId=web3.toDecimal(chainId)
      return chainId;
    })
    console.log("Current ChainId: ",chainId)
    const contract=await $.getJSON('./build/contracts/CryptoPay.json').then(jsonData=>{
      return jsonData;  
    });
    console.log()
    const contractABI=contract.abi
    const _contractAddress=contract.networks[chainId].address   
    console.log(_contractAddress)
    paymentContract= web3.eth.contract(contractABI).at(_contractAddress)
    console.log(paymentContract)

    if(web3.eth.defaultAccount!=_from){
        web3.eth.defaultAccount=_from
    }
    try{
        const _gasPrice= await web3.eth.getGasPrice((err,_gasPrice)=>{
          if(!err){
            console.log("Estimate Gas Price: "+web3.fromWei(JSON.parse(_gasPrice),'Gwei')+" Gwei")
            return _gasPrice;
          }
          else{
            console.log(err)
          }
        })
        const _estimatedGas=await web3.eth.estimateGas({from:web3.eth.defaultAccount},(err,_estimateGas)=>{
          console.log("Estimate Gas Limit: "+_estimateGas)
          return _estimateGas;
        })
        await paymentContract._payment(_from,_to,{from:web3.eth.defaultAccount,value:web3.toWei(_amount,'ether')},async function(err,_txId){//gas:_estimatedGas,gasPrice:_gasPrice
          console.log("transaction id: ",_txId) 
          if(_txId!=null){
              console.log(_txId)
              document.getElementById('loading').style.display="block"
              //set a condition here
              await _eventTransfer(_txId);
            }
            else{
              console.log(err)
              document.getElementById('error_msg').style.display="block"
              document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message
              setTimeout(function(){
                location.reload()},9000)
            }

        })
        
    }catch(err){
        console.log(err)
        alert("transaction revert.")
        document.getElementById('error_msg').style.display="block"
        document.getElementById('error_msg').innerHTML="Error Code: "+err.code+" & Error Message: "+err.message
        
    }
}
_eventTransfer=async function(_txId){

  try{
    paymentContract._transfer({
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

  web3.eth.getTransactionReceipt(_txId,(err,_txDetails)=>{
    console.log(_txDetails)
    _txStatus=(_txDetails.status=='0x1')?"Done":"Fail"
    if(!err){
      document.getElementById('success_msg').style.display="block"
      document.getElementById('success_msg').innerHTML="Payment Status: "+_txStatus+" & TransactionHash: "
      p_tag=document.getElementById('success_msg')
      a_tag=document.createElement("a")
      a_tag.setAttribute('href',"https://goerli.etherscan.io/tx/"+_txDetails.transactionHash)
      a_tag.setAttribute('id','tx_id')
      a_tag.setAttribute('target','_blank')
      p_tag.appendChild(a_tag);
      document.getElementById("tx_id").innerHTML=_txDetails.transactionHash
      // setTimeout(function(){
      //   location.reload()},9000)
    }
    else{
      console.log(err)
    }
    
  })
}

_proceed=async function(){

    web3=new Web3(window.ethereum)
    const _connected=await window.ethereum.request({"method":'eth_accounts'}).then(_acc=>{
        if(_acc.length>0){
            web3.eth.defaultAccount=_acc
            return ({status:true,data:_acc});
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
      await _payment();
    }
}

// $("document").on('ready',function(){
//     console.log("hi");
// window.ethereum._metamask.isUnlocked()
//     $("#payAmount").on('click',function(){
//         console.log('botton clilck')
// _proceed()
//     })
// })