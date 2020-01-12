"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

const sender = 'Hbank';
let receiver;

let poolName = 'poolHbank';
let poolHandle;

let hbankWallet;
let hbankWalletConfig = {'id': 'hbankWallet'};
let hbankWalletCredentials = {'key': 'hbankKey'};
let hbankDid, hbankKey;
let hbankGovDid, hbankGovKey;
let govHbankVerkey, aliceHbankVerkey;

let hbankAliceDid, hbankAliceKey, aliceHbankDid;

let connectionRequest;

let receiptCredDefId, receiptCredDefJson, receiptCredOfferJson;

async function init(){
    console.log(` # ${sender} is ready!`);
    
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

   if (!hbankWallet) {
        console.log(`\"${sender}\" > Create wallet"`);
        try {
            await indy.createWallet(hbankWalletConfig, hbankWalletCredentials)
        } catch(e) {
            if(e.message !== "WalletAlreadyExistsError") {
                throw e;
            }
        }
        hbankWallet = await indy.openWallet(hbankWalletConfig, hbankWalletCredentials);
    }
}


async function connectWithGov1(request){
	let connectionRequest = JSON.parse(request);
    receiver = 'Gov';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [hbankGovDid, hbankGovKey] = await indy.createAndStoreMyDid(hbankWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    govHbankVerkey = await indy.keyForDid(poolHandle, hbankWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': hbankGovDid,
        'verkey': hbankGovKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(govHbankVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	console.log(` Response. ${anoncryptedConnectionResponse}`);
	
	return anoncryptedConnectionResponse;
}

async function connectWithGov2(){
    receiver = 'Gov';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender}\" new DID"`);
    [hbankDid, hbankKey] = await indy.createAndStoreMyDid(hbankWallet, {});

    console.log(`\"${sender}\" > Authcrypt \"${sender} DID info\" for \"${receiver}\"`);
    let didInfoJson = JSON.stringify({
        'did': hbankDid,
        'verkey': hbankKey
    });
    let authcryptedDidInfo = await indy.cryptoAuthCrypt(hbankWallet, hbankGovKey, govHbankVerkey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"${sender}\" > Send authcrypted \"${sender} DID info\" to "${receiver}"`);

	return authcryptedDidInfo;
}

async function hbankSchema(){
    console.log(`\"${sender}\" -> Create \"Receipt\" Schema`);
    let [receiptSchemaId, receiptSchema] = await indy.issuerCreateSchema(hbankDid, 'Receipt', '0.1', ['first_name', 'last_name']);
            
    console.log(`\"${sender}\" -> Send \"Receipt\" Schema to Ledger`);
    await util.sendSchema(poolHandle, hbankWallet, hbankDid, receiptSchema);

    console.log(`\"${sender}\" -> Get \"Receipt\" Schema from Ledger`);
    [, receiptSchema] = await util.getSchema(poolHandle, hbankDid, receiptSchemaId);

    console.log(`\"${sender}\" -> Create and store in Wallet \"Hbank Receipt\" Credential Definition`);
    [receiptCredDefId, receiptCredDefJson] = await indy.issuerCreateAndStoreCredentialDef(hbankWallet, hbankDid, receiptSchema, 'TAG1', 'CL', '{"support_revocation": false}');

    console.log(`\"${sender}\" -> Send  \"Hbank Receipt\" Credential Definition to Ledger`);
    await util.sendCredDef(poolHandle, hbankWallet, hbankDid, receiptCredDefJson);
}

async function connectWithAlice1(){
    receiver = 'Alice';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [hbankAliceDid, hbankAliceKey] = await indy.createAndStoreMyDid(hbankWallet, {});

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${sender} ${receiver}\" DID`);
    await util.sendNym(poolHandle, hbankWallet, hbankDid, hbankAliceDid, hbankAliceKey, null);

    console.log(`\"${sender}\" > Send connection request to Alice with \"${sender} ${receiver}\" DID and nonce`);
    connectionRequest = {
        did: hbankAliceDid,
        nonce: 123456789
    };

    let ret = JSON.stringify(connectionRequest);
    console.log(` Request . ${ret}`);
    return ret;
}

async function connectWithAlice1_1(anoncryptedConnectionResponse){
    receiver = 'Alice';

    console.log(`\"${sender}\" > Anondecrypt connection response from \"${receiver}\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(hbankWallet, hbankAliceKey, anoncryptedConnectionResponse)));

    console.log(`\"${sender}\" > Authenticates \"${receiver}\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    aliceHbankDid = decryptedConnectionResponse['did'];

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${receiver} ${sender}\" DID`);
    await util.sendNym(poolHandle, hbankWallet, hbankDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}

async function close(){
    console.log(`\"${sender}\" -> Close and Delete wallet`);
    await indy.closeWallet(hbankWallet);
    await indy.deleteWallet(hbankWalletConfig, hbankWalletCredentials);
}