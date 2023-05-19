//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CryptoPay{

    address payable _receiver;
    mapping(address=>uint) balances;

    event _transfer(bool _status, uint _amount);
   
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
    constructor(address payable _receiverAddress){
        _receiver=_receiverAddress;
    }
    receive() external payable{}
    fallback() external payable{}
   
    function _payment(address payable _sender) public payable _isEmptySender(_sender) _isEmptyReceiver() _isEqual(_sender) returns(bool ,bytes memory){
        require(_sender==payable(msg.sender),"only owner");
        require(msg.value>0,"amount is not zero");
        uint amount= msg.value;
        balances[_sender]=_sender.balance;
        require(balances[_sender]>=amount,"not enough balance to pay.");
        balances[_receiver]=_receiver.balance;
        balances[_sender]-=amount;
        balances[_receiver]+=amount;
        (bool flag,bytes memory _data)=_receiver.call{gas:50000,value:msg.value}("");
        emit _transfer(flag,amount);
        return (flag,_data);
    }
    function _getBalance(address _address) public view returns(uint _currentBalance){
        return (_address.balance); 
    }
   
}