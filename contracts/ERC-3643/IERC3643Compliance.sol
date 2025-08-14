// SPDX-License-Identifier: CC0-1.0
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
pragma solidity 0.8.27;

/// Events

/// @dev This event is emitted when a token has been bound to the compliance contract.
/// @param _token is the address of the token to bind.
event TokenBound(address _token);

/// @dev This event is emitted when a token has been unbound from the compliance contract.
/// @param _token is the address of the token to unbind.
event TokenUnbound(address _token);

interface IERC3643Compliance {
  /// Functions

  /// initialization of the compliance contract

  /**
   *  @dev binds a token to the compliance contract
   *  @param _token address of the token to bind
   *  This function can be called ONLY by the owner of the compliance contract
   *  Emits a TokenBound event
   */
  function bindToken(address _token) external;

  /**
   *  @dev unbinds a token from the compliance contract
   *  @param _token address of the token to unbind
   *  This function can be called ONLY by the owner of the compliance contract
   *  Emits a TokenUnbound event
   */
  function unbindToken(address _token) external;

  // compliance check and state update
  /**
   *  @dev function called whenever tokens are transferred
   *  from one wallet to another
   *  this function can update state variables in the modules bound to the compliance
   *  these state variables being used by the module checks to decide if a transfer
   *  is compliant or not depending on the values stored in these state variables and on
   *  the parameters of the modules
   *  This function can be called ONLY by the token contract bound to the compliance
   *  @param _from The address of the sender
   *  @param _to The address of the receiver
   *  @param _amount The amount of tokens involved in the transfer
   *  This function calls moduleTransferAction() on each module bound to the compliance contract
   */
  function transferred(address _from, address _to, uint256 _amount) external;

  /**
   *  @dev function called whenever tokens are created on a wallet
   *  this function can update state variables in the modules bound to the compliance
   *  these state variables being used by the module checks to decide if a transfer
   *  is compliant or not depending on the values stored in these state variables and on
   *  the parameters of the modules
   *  This function can be called ONLY by the token contract bound to the compliance
   *  @param _to The address of the receiver
   *  @param _amount The amount of tokens involved in the minting
   *  This function calls moduleMintAction() on each module bound to the compliance contract
   */
  function created(address _to, uint256 _amount) external;

  /**
   *  @dev function called whenever tokens are destroyed from a wallet
   *  this function can update state variables in the modules bound to the compliance
   *  these state variables being used by the module checks to decide if a transfer
   *  is compliant or not depending on the values stored in these state variables and on
   *  the parameters of the modules
   *  This function can be called ONLY by the token contract bound to the compliance
   *  @param _from The address on which tokens are burnt
   *  @param _amount The amount of tokens involved in the burn
   *  This function calls moduleBurnAction() on each module bound to the compliance contract
   */
  function destroyed(address _from, uint256 _amount) external;

  /**
   *  @dev checks that the transfer is compliant.
   *  default compliance always returns true
   *  READ ONLY FUNCTION, this function cannot be used to increment
   *  counters, emit events, ...
   *  @param _from The address of the sender
   *  @param _to The address of the receiver
   *  @param _amount The amount of tokens involved in the transfer
   *  This function will call moduleCheck() on every module bound to the compliance
   *  If each of the module checks return TRUE, this function will return TRUE as well
   *  returns FALSE otherwise
   */
  function canTransfer(
    address _from,
    address _to,
    uint256 _amount
  ) external view returns (bool);

  /// check the parameters of the compliance contract

  function isTokenBound(address _token) external view returns (bool);

  /**
   *  @dev getter for the address of the token bound
   *  returns the address of the token
   */
  function getTokenBound() external view returns (address);
}
