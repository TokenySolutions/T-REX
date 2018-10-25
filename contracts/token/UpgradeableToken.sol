pragma solidity ^0.4.23;

/**
 * A token upgrade mechanism where users can opt-in amount of tokens to the next smart contract revision.
 *
 * First envisioned by Golem and Lunyr projects.
 */
import "./MintableAndPausableToken.sol";
import "./TokenUpgrader.sol";


contract UpgradeableToken is MintableAndPausableToken {
    // Contract or person who can set the upgrade path.
    address public upgradeMaster;
    
    // Bollean value needs to be true to start upgrades
    bool private upgradesAllowed;

    // The next contract where the tokens will be migrated.
    TokenUpgrader public tokenUpgrader;

    // How many tokens we have upgraded by now.
    uint public totalUpgraded;

    /**
    * Upgrade states.
    * - NotAllowed: The child contract has not reached a condition where the upgrade can begin
    * - Waiting: Token allows upgrade, but we don't have a new token version
    * - ReadyToUpgrade: The token version is set, but not a single token has been upgraded yet
    * - Upgrading: Token upgrader is set and the balance holders can upgrade their tokens
    */
    enum UpgradeState { NotAllowed, Waiting, ReadyToUpgrade, Upgrading }

    // Somebody has upgraded some of his tokens.
    event Upgrade(address indexed _from, address indexed _to, uint256 _value);

    // New token version available.
    event TokenUpgraderIsSet(address _newToken);

    modifier onlyUpgradeMaster {
        // Only a master can designate the next token
        require(msg.sender == upgradeMaster);
        _;
    }

    modifier notInUpgradingState {
        // Upgrade has already begun for token
        require(getUpgradeState() != UpgradeState.Upgrading);
        _;
    }

    // Do not allow construction without upgrade master set.
    constructor(address _upgradeMaster) public {
        upgradeMaster = _upgradeMaster;
    }

    // set a token upgrader
    function setTokenUpgrader(address _newToken)
        external
        onlyUpgradeMaster
        notInUpgradingState
    {
        require(canUpgrade());
        require(_newToken != address(0));

        tokenUpgrader = TokenUpgrader(_newToken);

        // Handle bad interface
        require(tokenUpgrader.isTokenUpgrader());

        // Make sure that token supplies match in source and target
        require(tokenUpgrader.originalSupply() == totalSupply_);

        emit TokenUpgraderIsSet(tokenUpgrader);
    }

    // Allow the token holder to upgrade some of their tokens to a new contract.
    function upgrade(uint _value) external {
        UpgradeState state = getUpgradeState();
        
        // Check upgrate state 
        require(state == UpgradeState.ReadyToUpgrade || state == UpgradeState.Upgrading);
        // Validate input value
        require(_value != 0);

        balances[msg.sender] = balances[msg.sender].sub(_value);

        // Take tokens out from circulation
        totalSupply_ = totalSupply_.sub(_value);
        totalUpgraded = totalUpgraded.add(_value);

        // Token Upgrader reissues the tokens
        tokenUpgrader.upgradeFrom(msg.sender, _value);
        emit Upgrade(msg.sender, tokenUpgrader, _value);
    }

    /**
    * Change the upgrade master.
    * This allows us to set a new owner for the upgrade mechanism.
    */
    function setUpgradeMaster(address _newMaster) external onlyUpgradeMaster {
        require(_newMaster != address(0));
        upgradeMaster = _newMaster;
    }

    // To be overriden to add functionality
    function allowUpgrades() external onlyUpgradeMaster () {
        upgradesAllowed = true;
    }

    // To be overriden to add functionality
    function rejectUpgrades() external onlyUpgradeMaster () {
        require(!(totalUpgraded > 0));
        upgradesAllowed = false;
    }

    // Get the state of the token upgrade.
    function getUpgradeState() public view returns(UpgradeState) {
        if (!canUpgrade()) return UpgradeState.NotAllowed;
        else if (address(tokenUpgrader) == address(0)) return UpgradeState.Waiting;
        else if (totalUpgraded == 0) return UpgradeState.ReadyToUpgrade;
        else return UpgradeState.Upgrading;
    }

    // To be overriden to add functionality
    function canUpgrade() public view returns(bool) {
        return upgradesAllowed;
    }
}
