//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Payment{

    address payable _receiver;
    
    event _transfer(bool _status, uint _amount,bytes _data);
    event _revertTransaction(bool _status,string reason);
    // event _revertTransaction(bool _status,bytes reason);

    constructor(address payable _receiverAddress){
        _receiver=_receiverAddress;
    }
    mapping(address=>uint) balances;
    // event _transfer(bool _status, uint _amount);

    modifier _isEmptyReceiver(){
        require(_receiver!=address(0),"receiver address is empty.");
        _;
    }
    modifier _isEmptySender(address sender){
        require(sender!=address(0),"sender address is empty.");
        _;
    }
    modifier _isEqual(address sender){
        require(sender!=_receiver,"sender & receiver must be different.");
        _;
    }
    
    receive() external payable{}
    fallback() external payable{}
   
    function _payAmount(address payable _sender) payable public {

        require(_sender==payable(msg.sender),"only owner");

        try this._payment{value:msg.value}(_sender) returns(bool flag,bytes memory _data){//passing msg.value from one contract to another contract
            emit _transfer(flag,msg.value,_data);
        }
        catch Error(string memory _cause){
            emit _revertTransaction(false, _cause);
        }
        // catch (bytes memory _cause){
        //     emit _revertTransaction(false, _cause);
        // }
    }
    function _payment(address payable _sender) public payable _isEmptySender(_sender) _isEmptyReceiver() _isEqual(_sender) returns(bool , bytes memory ){
            // require(_sender==payable(msg.sender),"only owner");
            require((msg.value)>0,"amount is not zero");
            balances[_sender]=_sender.balance;
            uint _amount=msg.value;
            require(balances[_sender]>=_amount,"not enough balance to pay.");
            balances[_receiver]=_receiver.balance;
            balances[_sender]-=_amount;
            balances[_receiver]+=_amount;
            (bool flag,bytes memory _data)=_receiver.call{value:msg.value,gas:5000}("");
            // require(flag==true,"not transfered");
            // emit _transfer(flag,_amount);
            return (flag,_data);
    }
}
