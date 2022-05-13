const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require("mongoose");
require("dotenv").config(); 
const app = express();
var jwt = require('jsonwebtoken');
var ethUtil = require('ethereumjs-util');
const port = process.env.PORT;
const student =  require("./models/student");
const game = require('./models/game')
const passport = require("./passportww")
const auth = require("./auth")
var CryptoJS = require("crypto-js");
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = "dragon curve evidence stick weather scan walnut sell jelly spawn forget snap"
let infuraurl = "https://mainnet.infura.io/v3/f6b121503f2e4990b5819a1b967160cb"
const addfress = "0xE8060BB1365453ae63FDDe9D45031A8B8800f731"
// Where we will keep books
let books = [];
const web3 = new Web3(new Web3.providers.HttpProvider(infuraurl));



mongoose.connect(
    process.env.MONGODB_URL, 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
);
app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/:wallet_address/nonce', async (req, res) => {
    let wallet = req.params.wallet_address.toLowerCase()
    let participate = await student.findOne({address:wallet})
   
    if(!participate){
        participate = {} 
        participate.address = wallet;
        console.log(participate.address);
        participate.gamespart = [];
        participate = new student({
            ...participate
        })
    }
    participate.nonce = makeid(5)
   
    console.log(participate.address)
    await participate.save()
    res.json({"nonce":participate.nonce})


    
});


app.post('/getencrypted', (req,res) => {
    var encrypted = CryptoJS.AES.encrypt(req.body.encrypt, process.env.JWT_SECRET);
    res.json({enc:encrypted.toString()})
})

app.post('/getdecrypt',(req,res) => {
    var decrypted = CryptoJS.AES.decrypt(req.body.encrypt, process.env.JWT_SECRET);
    res.json({dec:decrypted.toString(CryptoJS.enc.Utf8)})
})

app.post('/startgame',async (req,res) => {
    let games = {}
    games.price = req.body.price
    games.gameid = req.body.gameid
    games.encryptsecret = req.body.secret
    games.winnner = ""
    games.start = req.body.start
    games = new game({
        ...games
    })
    console.log(games.gameid)
    await games.save()
    res.json({success:true})
})


app.post("/participate",auth,async (req,res) => {
    let participate = await student.findOne({address:req.user.address});
    let games = await game.findOne({"gameid":req.body.gameid})
    if(participate){
        participate.gamespart.push(req.body.gameid)
        await participate.save()
        res.json({success:true})
    }   


})

app.get("/myparticipation",auth,async (req,res) => {
    let participate = await student.findOne({address:req.user.address});
    if (participate){
        let games = await game.find({"gameid":{ $in: participate.gamespart}});
       
        res.json({data:games})
    }
        
    
})

app.post("/getgamedetail",async(req,res) =>{
    var ans = []
 
        let games = await game.find({"gameid":{ $in: req.body.games}});
       
       res.json({data:games})
        
       
    }
    
)
app.get("/getallgamedetail",async(req,res) =>{
    var ans = []
 
        let games = await game.find();
       
       res.json({data:games})
        
       
    }
    
)


app.post("/claimprize",async (req,res) => {
    console.log('here')
    let games = await game.findOne({"gameid":req.body.gameid});
    if(games){
    games.winnner = req.body.address
    message = req.body.gameid+req.body.address
    const hashedMessage = Web3.utils.sha3(message);
    console.log(process.env.privatekey)
    const signature = await web3.eth.accounts.sign(hashedMessage, process.env.privatekey)
    console.log(signature)
    res.json({r:signature.r,s:signature.s,v:signature.v,hashedmessage:hashedMessage})
    }
  

})

// Process signed message
app.post('/:user/signature', (req, res) => {
    // Get user from db
    student.findOne({address: req.params.user.toLowerCase()}, (err, user) => {
        if (err) {
            res.send(err);
        }
        if (user) {
            
            const msg = user.nonce;
            console.log(user.nonce);
            // Convert msg to hex string
            const msgHex = ethUtil.bufferToHex(Buffer.from(msg));

            // Check if signature is valid
            const msgBuffer = ethUtil.toBuffer(msgHex);
            const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
            console.log(msgHash.toString());
            const signatureBuffer = ethUtil.toBuffer(req.body.signature);
            const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
            const publicKey = ethUtil.ecrecover(
                msgHash,
                signatureParams.v,
                signatureParams.r,
                signatureParams.s
            );
            const addresBuffer = ethUtil.publicToAddress(publicKey);
            const address = ethUtil.bufferToHex(addresBuffer);
            console.log(address)
            // Check if address matches
            if (address.toLowerCase() === req.params.user.toLowerCase()) {
                // Change user nonce
                user.nonce = makeid(5)
                user.save((err) => {
                    if (err) {
                        res.send(err);
                    }
                });
                // Set jwt token
                const token = jwt.sign({
                    _id: user._id,
                    address: user.address
                }, process.env.JWT_SECRET, {expiresIn: '6h'});
                res.status(200).json({
                    success: true,
                    token: `Bearer ${token}`,
                    user: user,
                    msg: "You are now logged in."
                });
            } else {
                // User is not authenticated
                res.status(401).send('Invalid credentials');
            }
        } else {
            res.send('User does not exist');
        }
    });
});

app.get('/authenticated/test',auth, (req, res) => {
    console.log('Authentication successful');
    res.json({
        message: 'Successfully authenticated',
        user: req.user
    });
});

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}
app.listen(port, () => console.log(`Hello world app listening on port ${port}!`));