pragma solidity 0.8.17;

contract MockContract {
    address _irRegistry;
    uint16 _investorCountry;

    function identityRegistry() public view returns (address identityRegistry) {
        if (_irRegistry != address(0)) {
            return _irRegistry;
        } else {
            return address(this);
        }
    }

    function investorCountry(address investor) public view returns (uint16 country) {
        return _investorCountry;
    }

    function setInvestorCountry(uint16 country) public {
        _investorCountry = country;
    }
}
