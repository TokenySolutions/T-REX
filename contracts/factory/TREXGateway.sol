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
import "../roles/AgentRole.sol";
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

/// Only Owner or Agent can call
error OnlyAdminCall();

/// Batch Size is too big, could run out of gas
error BatchMaxLengthExceeded(uint16 lengthLimit);


contract TREXGateway is ITREXGateway, AgentRole {

    /// address of the TREX Factory that is managed by the Gateway
    address private _factory;

    /// public deployment status variable
    bool private _publicDeploymentStatus;

    /// deployment fee details
    Fee private _deploymentFee;

    /// deployment fees enabling variable
    bool private _deploymentFeeEnabled;

    /// mapping containing all deployer addresses
    mapping(address => bool) private _deployers;

    /// mapping for deployment discounts on fees
    mapping(address => uint16) private _feeDiscount;

    /// constructor of the contract, setting up the factory address and
    /// the public deployment status
    constructor(address factory, bool publicDeploymentStatus) {
        _factory = factory;
        _publicDeploymentStatus = publicDeploymentStatus;
        emit FactorySet(factory);
        emit PublicDeploymentStatusSet(publicDeploymentStatus);
    }

    /**
     *  @dev See {ITREXGateway-setFactory}.
     */
    function setFactory(address factory) external override onlyOwner {
        if(factory == address(0)) {
            revert ZeroAddress();
        }
        _factory = factory;
        emit FactorySet(factory);
    }

    /**
     *  @dev See {ITREXGateway-setPublicDeploymentStatus}.
     */
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

    /**
     *  @dev See {ITREXGateway-transferFactoryOwnership}.
     */
    function transferFactoryOwnership(address _newOwner) external override onlyOwner {
        Ownable(_factory).transferOwnership(_newOwner);
    }

    /**
     *  @dev See {ITREXGateway-enableDeploymentFee}.
     */
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

    /**
     *  @dev See {ITREXGateway-setDeploymentFee}.
     */
    function setDeploymentFee(uint256 _fee, address _feeToken, address _feeCollector) external override onlyOwner {
        if(_feeToken == address(0) || _feeCollector == address(0)) {
            revert ZeroAddress();
        }
        _deploymentFee.fee = _fee;
        _deploymentFee.feeToken = _feeToken;
        _deploymentFee.feeCollector = _feeCollector;
        emit DeploymentFeeSet(_fee, _feeToken, _feeCollector);
    }

    /**
     *  @dev See {ITREXGateway-batchAddDeployer}.
     */
    function batchAddDeployer(address[] calldata deployers) external override {
        if(!isAgent(msg.sender) && msg.sender != owner()) {
            revert OnlyAdminCall();
        }
        if(deployers.length > 500) {
            revert BatchMaxLengthExceeded(500);
        }
        for (uint256 i = 0; i < deployers.length; i++) {
            if(isDeployer(deployers[i])) {
                revert DeployerAlreadyExists(deployers[i]);
            }
            _deployers[deployers[i]] = true;
            emit DeployerAdded(deployers[i]);
        }
    }

    /**
     *  @dev See {ITREXGateway-addDeployer}.
     */
    function addDeployer(address deployer) external override {
        if(!isAgent(msg.sender) && msg.sender != owner()) {
            revert OnlyAdminCall();
        }
        if(isDeployer(deployer)) {
            revert DeployerAlreadyExists(deployer);
        }
        _deployers[deployer] = true;
        emit DeployerAdded(deployer);
    }

    /**
     *  @dev See {ITREXGateway-batchRemoveDeployer}.
     */
    function batchRemoveDeployer(address[] calldata deployers) external override {
        if(!isAgent(msg.sender) && msg.sender != owner()) {
            revert OnlyAdminCall();
        }
        if(deployers.length > 500) {
            revert BatchMaxLengthExceeded(500);
        }
        for (uint256 i = 0; i < deployers.length; i++) {
            if(!isDeployer(deployers[i])) {
                revert DeployerDoesNotExist(deployers[i]);
            }
            delete _deployers[deployers[i]];
            emit DeployerRemoved(deployers[i]);
        }
    }

    /**
     *  @dev See {ITREXGateway-removeDeployer}.
     */
    function removeDeployer(address deployer) external override {
        if(!isAgent(msg.sender) && msg.sender != owner()) {
            revert OnlyAdminCall();
        }
        if(!isDeployer(deployer)) {
            revert DeployerDoesNotExist(deployer);
        }
        delete _deployers[deployer];
        emit DeployerRemoved(deployer);
    }

    /**
     *  @dev See {ITREXGateway-batchApplyFeeDiscount}.
     */
    function batchApplyFeeDiscount(address[] calldata deployers, uint16[] calldata discounts) external override {
        if(!isAgent(msg.sender) && msg.sender != owner()) {
            revert OnlyAdminCall();
        }
        if(deployers.length > 500) {
            revert BatchMaxLengthExceeded(500);
        }
        for (uint256 i = 0; i < deployers.length; i++) {
            if(discounts[i] > 10000) {
                revert DiscountOutOfRange();
            }
            _feeDiscount[deployers[i]] = discounts[i];
            emit FeeDiscountApplied(deployers[i], discounts[i]);
        }
    }

    /**
     *  @dev See {ITREXGateway-applyFeeDiscount}.
     */
    function applyFeeDiscount(address deployer, uint16 discount) external override {
        if(!isAgent(msg.sender) && msg.sender != owner()) {
            revert OnlyAdminCall();
        }
        if(discount > 10000) {
            revert DiscountOutOfRange();
        }
        _feeDiscount[deployer] = discount;
        emit FeeDiscountApplied(deployer, discount);
    }

    /**
     *  @dev See {ITREXGateway-batchDeployTREXSuite}.
     */
    function batchDeployTREXSuite(
        ITREXFactory.TokenDetails[] memory _tokenDetails,
        ITREXFactory.ClaimDetails[] memory _claimDetails) external override
    {
        if(_tokenDetails.length > 5) {
            revert BatchMaxLengthExceeded(5);
        }
        for (uint256 i = 0; i < _tokenDetails.length; i++) {
            deployTREXSuite(_tokenDetails[i], _claimDetails[i]);
        }
    }

    /**
     *  @dev See {ITREXGateway-getPublicDeploymentStatus}.
     */
    function getPublicDeploymentStatus() external override view returns(bool) {
        return _publicDeploymentStatus;
    }

    /**
     *  @dev See {ITREXGateway-getFactory}.
     */
    function getFactory() external override view returns(address) {
        return _factory;
    }

    /**
     *  @dev See {ITREXGateway-getDeploymentFee}.
     */
    function getDeploymentFee() external override view returns(Fee memory) {
        return _deploymentFee;
    }

    /**
     *  @dev See {ITREXGateway-isDeploymentFeeEnabled}.
     */
    function isDeploymentFeeEnabled() external override view returns(bool) {
        return _deploymentFeeEnabled;
    }

    /**
     *  @dev See {ITREXGateway-deployTREXSuite}.
     */
    function deployTREXSuite(ITREXFactory.TokenDetails memory _tokenDetails, ITREXFactory.ClaimDetails memory _claimDetails)
    public override {
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
        emit GatewaySuiteDeploymentProcessed(msg.sender, _tokenDetails.owner, feeApplied);
    }

    /**
     *  @dev See {ITREXGateway-isDeployer}.
     */
    function isDeployer(address deployer) public override view returns(bool) {
        return _deployers[deployer];
    }

    /**
     *  @dev See {ITREXGateway-calculateFee}.
     */
    function calculateFee(address deployer) public override view returns(uint256) {
        return _deploymentFee.fee - ((_feeDiscount[deployer] * _deploymentFee.fee) / 10000);
    }
}
