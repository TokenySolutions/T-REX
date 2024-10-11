pragma solidity 0.8.26;

contract MockContract {
    address _irRegistry;
    uint16 _investorCountry;
    address _compliance;

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

    function setCompliance(address compliance) public {
        _compliance = compliance;
    }

    function compliance() public view returns (address) {
        return _compliance;
    }
}
