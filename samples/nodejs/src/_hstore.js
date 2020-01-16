"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

const sender = 'Hstore';
let receiver;

let poolName = 'poolHstore';
let poolHandle;

let hstoreWallet;
let hstoreWalletConfig = {'id': 'hstoreWallet'};
let hstoreWalletCredentials = {'key': 'hstoreKey'};
let hstoreDid, hstoreKey;
let hstoreGovDid, hstoreGovKey;
let govHstoreVerkey, aliceHstoreVerkey;

let hstoreAliceDid, hstoreAliceKey, aliceHstoreDid;

let connectionRequest;

let orderCredDefId, orderCredDefJson, orderCredOfferJson;

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

   if (!hstoreWallet) {
        console.log(`\"${sender}\" > Create wallet"`);
        try {
            await indy.createWallet(hstoreWalletConfig, hstoreWalletCredentials)
        } catch(e) {
            if(e.message !== "WalletAlreadyExistsError") {
                throw e;
            }
        }
        hstoreWallet = await indy.openWallet(hstoreWalletConfig, hstoreWalletCredentials);
    }
}


async function connectWithGov1(request){
	let connectionRequest = JSON.parse(request);
    receiver = 'Gov';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [hstoreGovDid, hstoreGovKey] = await indy.createAndStoreMyDid(hstoreWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    govHstoreVerkey = await indy.keyForDid(poolHandle, hstoreWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': hstoreGovDid,
        'verkey': hstoreGovKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(govHstoreVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	console.log(` Response. ${anoncryptedConnectionResponse}`);
	
	return anoncryptedConnectionResponse;
}

async function connectWithGov2(){
    receiver = 'Gov';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender}\" new DID"`);
    [hstoreDid, hstoreKey] = await indy.createAndStoreMyDid(hstoreWallet, {});

    console.log(`\"${sender}\" > Authcrypt \"${sender} DID info\" for \"${receiver}\"`);
    let didInfoJson = JSON.stringify({
        'did': hstoreDid,
        'verkey': hstoreKey
    });
    let authcryptedDidInfo = await indy.cryptoAuthCrypt(hstoreWallet, hstoreGovKey, govHstoreVerkey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"${sender}\" > Send authcrypted \"${sender} DID info\" to "${receiver}"`);

	return authcryptedDidInfo;
}

async function hstoreSchema(){
    console.log(`\"${sender}\" -> Create \"Order\" Schema`);
    let [orderSchemaId, orderSchema] = await indy.issuerCreateSchema(hstoreDid, 'Order', '0.1', ['first_name', 'last_name']);
            
    console.log(`\"${sender}\" -> Send \"Order\" Schema to Ledger`);
    await util.sendSchema(poolHandle, hstoreWallet, hstoreDid, orderSchema);

    console.log(`\"${sender}\" -> Get \"Order\" Schema from Ledger`);
    [, orderSchema] = await util.getSchema(poolHandle, hstoreDid, orderSchemaId);

    console.log(`\"${sender}\" -> Create and store in Wallet \"Hstore Order\" Credential Definition`);
    [orderCredDefId, orderCredDefJson] = await indy.issuerCreateAndStoreCredentialDef(hstoreWallet, hstoreDid, orderSchema, 'TAG1', 'CL', '{"support_revocation": false}');

    console.log(`\"${sender}\" -> Send  \"Hstore Order\" Credential Definition to Ledger`);
    await util.sendCredDef(poolHandle, hstoreWallet, hstoreDid, orderCredDefJson);
}

async function connectWithAlice1(){
    receiver = 'Alice';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [hstoreAliceDid, hstoreAliceKey] = await indy.createAndStoreMyDid(hstoreWallet, {});

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${sender} ${receiver}\" DID`);
    await util.sendNym(poolHandle, hstoreWallet, hstoreDid, hstoreAliceDid, hstoreAliceKey, null);

    console.log(`\"${sender}\" > Send connection request to Alice with \"${sender} ${receiver}\" DID and nonce`);
    connectionRequest = {
        did: hstoreAliceDid,
        nonce: 123456789
    };

    let ret = JSON.stringify(connectionRequest);
    console.log(` Request . ${ret}`);
    return ret;
}

async function connectWithAlice1_1(anoncryptedConnectionResponse){
    receiver = 'Alice';

    console.log(`\"${sender}\" > Anondecrypt connection response from \"${receiver}\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(hstoreWallet, hstoreAliceKey, anoncryptedConnectionResponse)));

    console.log(`\"${sender}\" > Authenticates \"${receiver}\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    aliceHstoreDid = decryptedConnectionResponse['did'];

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${receiver} ${sender}\" DID`);
    await util.sendNym(poolHandle, hstoreWallet, hstoreDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}

async function close(){
    console.log(`\"${sender}\" -> Close and Delete wallet`);
    await indy.closeWallet(hstoreWallet);
    await indy.deleteWallet(hstoreWalletConfig, hstoreWalletCredentials);
}

module.exports = {
    init,
    hstoreSchema,
    connectWithGov1,
    connectWithGov2,
    connectWithAlice1,
    connectWithAlice1_1,
    // createProofRequest,
    // verifyProof,
    close
}
