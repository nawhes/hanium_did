"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');


let poolHandle;
let stewardWalletConfig = {'id': 'stewardWalletName'}
let stewardWalletCredentials = {'key': 'steward_key'}
let stewardWallet;
let [stewardDid, stewardKey];


async function init(){

    console.log("gettingStarted.js -> started");

    let poolName = 'pool1';
    console.log(`Open Pool Ledger: ${poolName}`);
    let poolGenesisTxnPath = await util.getPoolGenesisTxnPath(poolName);
    let poolConfig = {
        "genesis_txn": poolGenesisTxnPath
    };
    try {
        await indy.createPoolLedgerConfig(poolName, poolConfig);
    } catch(e) {
        if(e.message !== "PoolLedgerConfigAlreadyExistsError") {
            throw e;
        }
    }

    await indy.setProtocolVersion(2)

    poolHandle = await indy.openPoolLedger(poolName);

    console.log("==============================");
    console.log("=== Getting Trust Anchor credentials for Faber, Acme, Thrift and Government  ==");
    console.log("------------------------------");

    console.log("\"Sovrin Steward\" -> Create wallet");

    try {
        await indy.createWallet(stewardWalletConfig, stewardWalletCredentials)
    } catch(e) {
        if(e.message !== "WalletAlreadyExistsError") {
            throw e;
        }
    }

    stewardWallet = await indy.openWallet(stewardWalletConfig, stewardWalletCredentials);

    console.log("\"Sovrin Steward\" -> Create and store in Wallet DID from seed");
    let stewardDidInfo = {
        'seed': '000000000000000000000000Steward1'
    };

    [stewardDid, stewardKey] = await indy.createAndStoreMyDid(stewardWallet, stewardDidInfo);

}

async function connectWithGovernment1(){
    console.log("==============================");
    console.log("== Getting Trust Anchor credentials - Government Onboarding  ==");
    console.log("------------------------------");


    console.log(`\"Steward\" > Create and store in Wallet \"Steward Goverment\" DID`);
    let [stewardGovernmentDid, stewardGovernmentKey] = await indy.createAndStoreMyDid(stewardWallet, {});

    console.log(`\"Steward\" > Send Nym to Ledger for \"Steward Goverment\" DID`);
    await sendNym(poolHandle, stewardWallet, stewardDid, stewardGovernmentDid, stewardGovernmentKey, null);

    console.log(`\"Steward\" > Send connection request to Goverment with \"Steward Goverment\" DID and nonce`);
    let connectionRequest = {
        did: stewardGovernmentDid,
        nonce: 123456789
    };

    //보냈다고 친다.
}

async function connectWithGovernment1_1(){
    //받았다고 친다.
    let connectionResponse = JSON.stringify({
        'did': governmentStewardDid,
        'verkey': governmentStewardKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(stewardGovernmentVerkey, Buffer.from(connectionResponse, 'utf8'));


    console.log(`\"Steward\" > Anondecrypt connection response from \"Goverment\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(stewardWallet, stewardGovernmentKey, anoncryptedConnectionResponse)));

    console.log(`\"Steward\" > Authenticates \"Goverment\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    console.log(`\"Steward\" > Send Nym to Ledger for \"Goverment Steward\" DID`);
    await sendNym(poolHandle, stewardWallet, stewardDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}

async function connectWithGovernment2(){
    console.log("==============================");
    console.log("== Getting Trust Anchor credentials - Government getting Verinym  ==");
    console.log("------------------------------");

    //받았다고 친다.
    let [governmentDid, governmentKey] = await indy.createAndStoreMyDid(governmentWallet, {});
    let didInfoJson = JSON.stringify({
        'did': governmentDid,
        'verkey': governmentKey
    });
    let authcryptedDidInfo = await indy.cryptoAuthCrypt(governmentWallet, governmentStewardKey, stewardGovernmentKey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"Steward\" > Authdecrypted \"Goverment DID info\" from Goverment`);
    let [senderVerkey, authdecryptedDidInfo] =
        await indy.cryptoAuthDecrypt(stewardWallet, stewardGovernmentKey, Buffer.from(authcryptedDidInfo));

    let authdecryptedDidInfoJson = JSON.parse(Buffer.from(authdecryptedDidInfo));
    console.log(`\"Steward\" > Authenticate Goverment by comparision of Verkeys`);
    let retrievedVerkey = await indy.keyForDid(poolHandle, stewardWallet, governmentStewardDid);
    if (senderVerkey !== retrievedVerkey) {
        throw Error("Verkey is not the same");
    }

    console.log(`\"Steward\" > Send Nym to Ledger for \"Goverment DID\" with ${role} Role`);
    await sendNym(poolHandle, stewardWallet, stewardDid, authdecryptedDidInfoJson['did'], authdecryptedDidInfoJson['verkey'], role);
}

async function close(){
    console.log(" \"Sovrin Steward\" -> Close and Delete wallet");
    await indy.closeWallet(stewardWallet);
    await indy.deleteWallet(stewardWalletConfig, stewardWalletCredentials);
}


module.exports = {
    init,
    connectWithGovernment1,
    connectWithGovernment1_1,
    connectWithGovernment2,
    close
}