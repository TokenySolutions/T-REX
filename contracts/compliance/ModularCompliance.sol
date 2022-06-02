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
 *     T-REX is a suite of smart contracts developed by Tokeny to manage and transfer financial assets on the ethereum blockchain
 *
 *     Copyright (C) 2021, Tokeny sàrl.
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

pragma solidity ^0.8.0;

import '../roles/AgentRole.sol';
import '../token/IToken.sol';
import './IModularCompliance.sol';
import './modules/IModule.sol';


contract ModularCompliance is IModularCompliance, Ownable {

    /// token linked to the compliance contract
    IToken private _tokenBound;

    /// Array of modules bound to the compliance
    address[] private modules;

    /**
     * @dev Throws if called by any address that is not a token bound to the compliance.
     */
    modifier onlyToken() {
        require(msg.sender == address(_tokenBound), 'error : this address is not a token bound to the compliance contract');
        _;
    }

    /**
     *  @dev See {IModularCompliance-getTokenBound}.
     */
    function getTokenBound() public view override returns (address) {
        return address(_tokenBound);
    }

    /**
     *  @dev See {IModularCompliance-bindToken}.
     */
    function bindToken(address _token) external override onlyOwner {
        require(_token != address(_tokenBound), 'This token is already bound');
        _tokenBound = IToken(_token);
        emit TokenBound(_token);
    }

    /**
    *  @dev See {IModularCompliance-unbindToken}.
    */
    function unbindToken(address _token) external override onlyOwner {
        require(_token == address(_tokenBound), 'This token is not bound yet');
        delete _tokenBound;
        emit TokenUnbound(_token);
    }

    /**
     *  @dev See {IModularCompliance-addModule}.
     */
    function addModule(address _module) external override onlyOwner {
        uint256 length = modules.length;
        for (uint256 i = 0; i < length; i++) {
            require(modules[i] != _module, 'module already exists');
        }
        modules.push(_module);
        IModule(_module).bindCompliance(address(this));
        emit ModuleAdded(_module);
    }

    /**
     *  @dev See {IModularCompliance-removeModule}.
     */
    function removeModule(address _module) external override onlyOwner {
        uint256 length = modules.length;
        for (uint256 i = 0; i < length; i++) {
            if (modules[i] == _module) {
                modules[i] = modules[length - 1];
                modules.pop();
                IModule(_module).unbindCompliance(address(this));
                emit ModuleRemoved(_module);
                break;
            }
        }
    }

    /**
     *  @dev See {IModularCompliance-getModules}.
     */
    function getModules() external view override returns (address[] memory) {
        return modules;
    }

    /**
    *  @dev See {IModularCompliance-transferred}.
    */
    function transferred(address _from, address _to, uint256 _value) external onlyToken override {
        uint256 length = modules.length;
        for (uint256 i = 0; i < length; i++) {
            IModule(modules[i]).moduleTransferAction(_from, _to, _value, address(this));
        }
    }

    /**
     *  @dev See {IModularCompliance-created}.
     */
    function created(address _to, uint256 _value) external onlyToken override {
        uint256 length = modules.length;
        for (uint256 i = 0; i < length; i++) {
            IModule(modules[i]).moduleMintAction(_to, _value, address(this));
        }
    }

    /**
     *  @dev See {IModularCompliance-destroyed}.
     */
    function destroyed(address _from, uint256 _value) external onlyToken override {
        uint256 length = modules.length;
        for (uint256 i = 0; i < length; i++) {
            IModule(modules[i]).moduleBurnAction(_from, _value, address(this));
        }
    }

    /**
     *  @dev See {IModularCompliance-canTransfer}.
     */
    function canTransfer(address _from, address _to, uint256 _value) external view override returns (bool) {
        uint256 length = modules.length;
        for (uint256 i = 0; i < length; i++) {
            if (!IModule(modules[i]).moduleCheck(_from, _to, _value, address(this))) {
                return false;
            }
        }
        return true;
    }
}

