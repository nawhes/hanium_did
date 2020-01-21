"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

const sender = 'Hstore';

let poolName = 'poolHstore', poolHandle;
let hstoreWallet, hstoreWalletConfig = {'id': 'hstoreWallet'}, hstoreWalletCredentials = {'key': 'hstoreKey'};
let hstoreDid, hstoreKey;

let connectionRequest;

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

//Steward
let hstoreStewardDid, hstoreStewardKey, stewardHstoreVerkey;
async function connectWithSteward1(request){
	let connectionRequest = JSON.parse(request);
    let receiver = 'Steward';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [hstoreStewardDid, hstoreStewardKey] = await indy.createAndStoreMyDid(hstoreWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    stewardHstoreVerkey = await indy.keyForDid(poolHandle, hstoreWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': hstoreStewardDid,
        'verkey': hstoreStewardKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(stewardHstoreVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	
	return anoncryptedConnectionResponse;
}

async function connectWithSteward2(){
    let receiver = 'Steward';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender}\" new DID"`);
    [hstoreDid, hstoreKey] = await indy.createAndStoreMyDid(hstoreWallet, {});

    console.log(`\"${sender}\" > Authcrypt \"${sender} DID info\" for \"${receiver}\"`);
    let didInfoJson = JSON.stringify({
        'did': hstoreDid,
        'verkey': hstoreKey
    });
    let authcryptedDidInfo = await indy.cryptoAuthCrypt(hstoreWallet, hstoreStewardKey, stewardHstoreVerkey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"${sender}\" > Send authcrypted \"${sender} DID info\" to "${receiver}"`);

	return authcryptedDidInfo;
}

//Schema
// let orderCredDefId, orderCredDefJson, orderCredOfferJson;
// async function hstoreSchema(){
//     console.log(`\"${sender}\" -> Create \"Order\" Schema`);
//     let [orderSchemaId, orderSchema] = await indy.issuerCreateSchema(hstoreDid, 'Order', '0.1', ['first_name', 'last_name']);
            
//     console.log(`\"${sender}\" -> Send \"Order\" Schema to Ledger`);
//     await util.sendSchema(poolHandle, hstoreWallet, hstoreDid, orderSchema);

//     console.log(`\"${sender}\" -> Get \"Order\" Schema from Ledger`);
//     [, orderSchema] = await util.getSchema(poolHandle, hstoreDid, orderSchemaId);

//     console.log(`\"${sender}\" -> Create and store in Wallet \"Hstore Order\" Credential Definition`);
//     [orderCredDefId, orderCredDefJson] = await indy.issuerCreateAndStoreCredentialDef(hstoreWallet, hstoreDid, orderSchema, 'TAG1', 'CL', '{"support_revocation": false}');

//     console.log(`\"${sender}\" -> Send  \"Hstore Order\" Credential Definition to Ledger`);
//     await util.sendCredDef(poolHandle, hstoreWallet, hstoreDid, orderCredDefJson);
// }

let receiptCredDef;
async function getSchemaId(schemaId){
    receiptCredDef = schemaId;
}

//Alice
let hstoreAliceDid, hstoreAliceKey, aliceHstoreDid, aliceHstoreVerkey;
async function connectWithAlice1(){
    let receiver = 'Alice';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [hstoreAliceDid, hstoreAliceKey] = await indy.createAndStoreMyDid(hstoreWallet, {});

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${sender} ${receiver}\" DID`);
    await util.sendNym(poolHandle, hstoreWallet, hstoreDid, hstoreAliceDid, hstoreAliceKey, null);

    console.log(`\"${sender}\" > Send connection request to Alice with \"${sender} ${receiver}\" DID and nonce`);
    connectionRequest = {
        did: hstoreAliceDid,
        nonce: 123456789
    };

    return JSON.stringify(connectionRequest);
}

async function connectWithAlice1_1(anoncryptedConnectionResponse){
    let receiver = 'Alice';

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

let orderProofRequestJson;
async function createProofRequest(){
    let nonce = await indy.generateNonce();
    orderProofRequestJson = {
        'nonce': nonce,
        'name': 'Order-Application',
        'version': '0.1',
        'requested_attributes': {
            'attr1_referent': {
                'name': 'production'
            },
            'attr2_referent': {
                'name': 'dest_address'
            },
            'attr3_referent': {
                'name': 'from_account',
                'restrictions': [{'cred_def_id': receiptCredDef}]
            },
            'attr4_referent': {
                'name': 'dest_account',
                'restrictions': [{'cred_def_id': receiptCredDef}]
            }
       },
        "requested_predicates": {}
    };
    console.log(orderProofRequestJson);
    console.log(`\"${sender}\" -> Get key for Alice did`);
    aliceHstoreVerkey = await indy.keyForDid(poolHandle, hstoreWallet, aliceHstoreDid);

    console.log(`\"${sender}\" -> Authcrypt \"Order-Application\" Proof Request for Alice`);
    let authcryptedOrderProofRequestJson = await indy.cryptoAuthCrypt(hstoreWallet, hstoreAliceKey, aliceHstoreVerkey, Buffer.from(JSON.stringify(orderProofRequestJson), 'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"Order-Application\" Proof Request to Alice`);
    return authcryptedOrderProofRequestJson;
}

async function verifyProof(authcryptedOrderApplicationProofJson){
    let decryptedOrderApplicationProofJson, decryptedOrderApplicationProof;
    [, decryptedOrderApplicationProofJson, decryptedOrderApplicationProof] = await util.authDecrypt(hstoreWallet, hstoreAliceKey, authcryptedOrderApplicationProofJson);

    let schemasJson, credDefsJson, revocRefDefsJson, revocRegsJson;
    [schemasJson, credDefsJson, revocRefDefsJson, revocRegsJson] = await util.verifierGetEntitiesFromLedger(poolHandle, hstoreDid, decryptedOrderApplicationProof['identifiers'], 'Hstore');

    console.log(`\"${sender}\" -> Verify \"Order\" Proof from Alice`);
    assert('745' === decryptedOrderApplicationProof['requested_proof']['self_attested_attrs']['attr1_referent']);
    assert('123' === decryptedOrderApplicationProof['requested_proof']['self_attested_attrs']['attr2_referent']);
    
    assert('7458' === decryptedOrderApplicationProof['requested_proof']['revealed_attrs']['attr3_referent']['raw']);
    assert('7654' === decryptedOrderApplicationProof['requested_proof']['revealed_attrs']['attr4_referent']['raw']);
    
    let result = await indy.verifierVerifyProof(orderProofRequestJson, decryptedOrderApplicationProofJson, schemasJson, credDefsJson, revocRefDefsJson, revocRegsJson) 
    assert(result);
    console.log(result);
}

async function close(){
    console.log(`\"${sender}\" -> Close and Delete wallet`);
    await indy.closeWallet(hstoreWallet);
    await indy.deleteWallet(hstoreWalletConfig, hstoreWalletCredentials);
}

module.exports = {
    init,
    // hstoreSchema,
    getSchemaId,
    connectWithSteward1,
    connectWithSteward2,
    connectWithAlice1,
    connectWithAlice1_1,
    createProofRequest,
    verifyProof,
    close
}
