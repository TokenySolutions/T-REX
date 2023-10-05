// SPDX-License-Identifier: GPL-3.0
//
//                                             :+#####%%%%%%%%%%%%%%+
//                                         .-*@@@%+.:+%@@@@@%%#***%@@%=
//                                     :=*%@@@#=.      :#@@%       *@@@%=
//                       .-+*%@%*-.:+%@@@@@@+.     -*+:  .=#.       :%@@@%-
//                   :=*@@@@%%@@@@@@@@@%@@@-   .=#@@@%@%=             =@@@@#.
//             -=+#%@@%#*=:.  :%@@@@%.   -*@@#*@@@@@@@#=:-              *@@@@+
//            =@@%=:.     :=:   *@@@@@%#-   =%*%@@@@#+-.        =+       :%@@@%-
//           -@@%.     .+@@@     =+=-.         @@#-           +@@@%-       =@@@@%:
//          :@@@.    .+@@#%:                   :    .=*=-::.-%@@@+*@@=       +@@@@#.
//          %@@:    +@%%*                         =%@@@@@@@@@@@#.  .*@%-       +@@@@*.
//         #@@=                                .+@@@@%:=*@@@@@-      :%@%:      .*@@@@+
//        *@@*                                +@@@#-@@%-:%@@*          +@@#.      :%@@@@-
//       -@@%           .:-=++*##%%%@@@@@@@@@@@@*. :@+.@@@%:            .#@@+       =@@@@#:
//      .@@@*-+*#%%%@@@@@@@@@@@@@@@@%%#**@@%@@@.   *@=*@@#                :#@%=      .#@@@@#-
//      -%@@@@@@@@@@@@@@@*+==-:-@@@=    *@# .#@*-=*@@@@%=                 -%@@@*       =@@@@@%-
//         -+%@@@#.   %@%%=   -@@:+@: -@@*    *@@*-::                   -%@@%=.         .*@@@@@#
//            *@@@*  +@* *@@##@@-  #@*@@+    -@@=          .         :+@@@#:           .-+@@@%+-
//             +@@@%*@@:..=@@@@*   .@@@*   .#@#.       .=+-       .=%@@@*.         :+#@@@@*=:
//              =@@@@%@@@@@@@@@@@@@@@@@@@@@@%-      :+#*.       :*@@@%=.       .=#@@@@%+:
//               .%@@=                 .....    .=#@@+.       .#@@@*:       -*%@@@@%+.
//                 +@@#+===---:::...         .=%@@*-         +@@@+.      -*@@@@@%+.
//                  -@@@@@@@@@@@@@@@@@@@@@@%@@@@=          -@@@+      -#@@@@@#=.
//                    ..:::---===+++***###%%%@@@#-       .#@@+     -*@@@@@#=.
//                                           @@@@@@+.   +@@*.   .+@@@@@%=.
//                                          -@@@@@=   =@@%:   -#@@@@%+.
//                                          +@@@@@. =@@@=  .+@@@@@*:
//                                          #@@@@#:%@@#. :*@@@@#-
//                                          @@@@@%@@@= :#@@@@+.
//                                         :@@@@@@@#.:#@@@%-
//                                         +@@@@@@-.*@@@*:
//                                         #@@@@#.=@@@+.
//                                         @@@@+-%@%=
//                                        :@@@#%@%=
//                                        +@@@@%-
//                                        :#%%=
//
/**
 *     NOTICE
 *
 *     The T-REX software is licensed under a proprietary license or the GPL v.3.
 *     If you choose to receive it under the GPL v.3 license, the following applies:
 *     T-REX is a suite of smart contracts implementing the ERC-3643 standard and
 *     developed by Tokeny to manage and transfer financial assets on EVM blockchains
 *
 *     Copyright (C) 2023, Tokeny sàrl.
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
pragma solidity 0.8.17;

import "./ITREXGateway.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// A required parameter was set to the Zero address.
error ZeroAddress();

/// The Public Deployment Status is already set properly
error PublicDeploymentAlreadyEnabled();

/// The Public Deployment Status is already set properly
error PublicDeploymentAlreadyDisabled();

/// The Deployment fees are already enabled
error DeploymentFeesAlreadyEnabled();

/// The Deployment fees are already disabled
error DeploymentFeesAlreadyDisabled();

/// The address is already a deployer
error DeployerAlreadyExists(address deployer);

/// The address is not a deployer
error DeployerDoesNotExist(address deployer);

/// Cannot deploy if not deployer when public deployment disabled
error PublicDeploymentsNotAllowed();

/// Public deployers can only deploy for themselves
error PublicCannotDeployOnBehalf();

/// Discount cannot be bigger than 10000 (100%)
error DiscountOutOfRange();


contract TREXGateway is ITREXGateway, Ownable {

    address private _factory;
    bool private _publicDeploymentStatus;
    Fee private _deploymentFee;
    bool private _deploymentFeeEnabled;
    mapping(address => bool) private _deployers;
    mapping(address => uint16) private _feeDiscount;


    constructor(address factory, bool publicDeploymentStatus) {
        _factory = factory;
        _publicDeploymentStatus = publicDeploymentStatus;
        emit FactorySet(factory);
        emit PublicDeploymentStatusSet(publicDeploymentStatus);
    }

    function setFactory(address factory) external override onlyOwner {
        if(factory == address(0)) {
            revert ZeroAddress();
        }
        _factory = factory;
        emit FactorySet(factory);
    }

    function setPublicDeploymentStatus(bool _isEnabled) external override onlyOwner {
        if(_isEnabled == _publicDeploymentStatus && _isEnabled == true) {
            revert PublicDeploymentAlreadyEnabled();
        }
        if(_isEnabled == _publicDeploymentStatus && _isEnabled == false) {
            revert PublicDeploymentAlreadyDisabled();
        }
        _publicDeploymentStatus = _isEnabled;
        emit PublicDeploymentStatusSet(_isEnabled);
    }

    function transferFactoryOwnership(address _newOwner) external override onlyOwner {
        Ownable(_factory).transferOwnership(_newOwner);
    }

    function enableDeploymentFee(bool _isEnabled) external override onlyOwner {
        if(_isEnabled == _deploymentFeeEnabled && _isEnabled == true) {
            revert DeploymentFeesAlreadyEnabled();
        }
        if(_isEnabled == _deploymentFeeEnabled && _isEnabled == false) {
            revert DeploymentFeesAlreadyDisabled();
        }
        _deploymentFeeEnabled = _isEnabled;
        emit DeploymentFeeEnabled(_isEnabled);
    }

    function setDeploymentFee(uint256 _fee, address _feeToken, address _feeCollector) external override onlyOwner {
        if(_feeToken == address(0) || _feeCollector == address(0)) {
            revert ZeroAddress();
        }
        _deploymentFee.fee = _fee;
        _deploymentFee.feeToken = _feeToken;
        _deploymentFee.feeCollector = _feeCollector;
        emit DeploymentFeeSet(_fee, _feeToken, _feeCollector);
    }

    function addDeployer(address deployer) external onlyOwner {
        if(isDeployer(deployer)) {
            revert DeployerAlreadyExists(deployer);
        }
        _deployers[deployer] = true;
        emit DeployerAdded(deployer);
    }

    function removeDeployer(address deployer) external onlyOwner {
        if(!isDeployer(deployer)) {
            revert DeployerDoesNotExist(deployer);
        }
        delete _deployers[deployer];
        emit DeployerRemoved(deployer);
    }

    function applyFeeDiscount(address deployer, uint16 discount) external override onlyOwner {
        if(discount > 10000) {
            revert DiscountOutOfRange();
        }
        _feeDiscount[deployer] = discount;
        emit FeeDiscountApplied(deployer, discount);
    }

    function deployTREXSuite(ITREXFactory.TokenDetails memory _tokenDetails, ITREXFactory.ClaimDetails memory _claimDetails)
    external {
        if(_publicDeploymentStatus == false && !isDeployer(msg.sender)) {
            revert PublicDeploymentsNotAllowed();
        }
        if(_publicDeploymentStatus == true && msg.sender != _tokenDetails.owner && !isDeployer(msg.sender)) {
            revert PublicCannotDeployOnBehalf();
        }
        uint256 feeApplied = 0;
        if(_deploymentFeeEnabled == true) {
            if(_deploymentFee.fee > 0 && _feeDiscount[msg.sender] < 10000) {
                feeApplied = calculateFee(msg.sender);
                IERC20(_deploymentFee.feeToken).transferFrom(
                    msg.sender,
                    _deploymentFee.feeCollector,
                    feeApplied
                );
            }
        }
        string memory _salt  = string(abi.encodePacked(Strings.toHexString(_tokenDetails.owner), _tokenDetails.name));
        ITREXFactory(_factory).deployTREXSuite(_salt, _tokenDetails, _claimDetails);
        emit GatewaySuiteDeploymentRequest(msg.sender, _tokenDetails.owner, feeApplied);
    }

    function getPublicDeploymentStatus() external override view returns(bool) {
        return _publicDeploymentStatus;
    }

    function getFactory() external override view returns(address) {
        return _factory;
    }

    function getDeploymentFee() external override view returns(Fee memory) {
        return _deploymentFee;
    }

    function isDeploymentFeeEnabled() external override view returns(bool) {
        return _deploymentFeeEnabled;
    }

    function isDeployer(address deployer) public override view returns(bool) {
        return _deployers[deployer];
    }

    function calculateFee(address deployer) public override view returns(uint256) {
        return _deploymentFee.fee - ((_feeDiscount[deployer] * _deploymentFee.fee) / 10000);
    }
}
