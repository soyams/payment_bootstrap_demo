//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CryptoPay{

    mapping(address=>uint) balances;

    event _transfer(bool _status, uint _amount);
   
    modifier _isEmptyReceiver(address receiver){
        require(receiver!=address(0),"receiver address is empty.");
        _;
    }
    modifier _isEmptySender(address sender){
        require(sender!=address(0),"sender address is empty.");
        _;
    }
    modifier _isEqual(address sender,address receiver){
        require(sender!=receiver,"sender & receiver must be different.");
        _;
    }

    receive() external payable{}
    fallback() external payable{}
   
    function _payment(address payable _sender, address payable _receiver) public payable _isEmptySender(_sender) _isEmptyReceiver(_receiver) _isEqual(_sender,_receiver) returns(bool ,bytes memory){
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