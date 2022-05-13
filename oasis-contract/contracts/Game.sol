import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


contract NFT is ERC721URIStorage {

    uint256 public counter = 0;
    struct  gamedetail {
        string gameid;
        uint256 entry;
        string secret;
        uint256 tokenid;
        address owner;
        address winner;
        bool isover;
        address[] participants;
        mapping(address=>bool) part; 
    }

    
    mapping(string => gamedetail) public games;
 address public owner;
 constructor(
        string memory symbol,
        string memory name) public ERC721(name, symbol){
        owner = tx.origin;
    }

    function creategame(string memory secret,string memory gameid,uint256 entry) public {
        
        gamedetail storage game = games[gameid];
        game.gameid = gameid;
        game.secret = secret;
        game.entry = entry;
        game.owner = tx.origin;
        game.tokenid = counter;
        counter++;
    }

    function participate(string memory gameid) public payable{
        require(games[gameid].entry <= msg.value,"not enough for entry");
        require(games[gameid].isover == false);
        gamedetail storage game = games[gameid];
        require(game.part[tx.origin] == false,"already participated");
        game.participants.push(tx.origin);
        game.part[tx.origin] = true;
    }



    function claimPrize(bytes32 _hashedMessage, uint8 _v, bytes32 _r, bytes32 _s,string memory gameid,address winner) public returns (bool) {
        
        
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        require(_hashedMessage == keccak256(abi.encodePacked(gameid,toString(abi.encodePacked(winner)))),"not working");
        bytes32 prefixedHashMessage = keccak256(abi.encodePacked(prefix, _hashedMessage));
        address signer = ecrecover(prefixedHashMessage, _v, _r, _s);
        require(signer == owner,"not the same bitch");
      
        gamedetail storage game = games[gameid];
        game.isover = true;
        game.winner = winner;
        _mint(winner,game.tokenid);
        _setTokenURI(game.tokenid,game.secret);
        return true;
    }
    function toString(bytes memory data) public pure returns(string memory) {
    bytes memory alphabet = "0123456789abcdef";

    bytes memory str = new bytes(2 + data.length * 2);
    str[0] = "0";
    str[1] = "x";
    for (uint i = 0; i < data.length; i++) {
        str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
        str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
    }
    return string(str);
}



}