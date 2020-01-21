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
let hbankStewardDid, hbankStewardKey;
let stewardHbankVerkey, aliceHbankVerkey;

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


async function connectWithSteward1(request){
	let connectionRequest = JSON.parse(request);
    receiver = 'Steward';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [hbankStewardDid, hbankStewardKey] = await indy.createAndStoreMyDid(hbankWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    stewardHbankVerkey = await indy.keyForDid(poolHandle, hbankWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': hbankStewardDid,
        'verkey': hbankStewardKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(stewardHbankVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	// console.log(` Response. ${anoncryptedConnectionResponse}`);
	
	return anoncryptedConnectionResponse;
}

async function connectWithSteward2(){
    receiver = 'Steward';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender}\" new DID"`);
    [hbankDid, hbankKey] = await indy.createAndStoreMyDid(hbankWallet, {});

    console.log(`\"${sender}\" > Authcrypt \"${sender} DID info\" for \"${receiver}\"`);
    let didInfoJson = JSON.stringify({
        'did': hbankDid,
        'verkey': hbankKey
    });
    let authcryptedDidInfo = await indy.cryptoAuthCrypt(hbankWallet, hbankStewardKey, stewardHbankVerkey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"${sender}\" > Send authcrypted \"${sender} DID info\" to "${receiver}"`);

	return authcryptedDidInfo;
}

let govIdCredDef;
async function getSchemaId(schemaId){
    govIdCredDef = schemaId;
}

async function hbankSchema(){
    console.log(`\"${sender}\" -> Create \"Receipt\" Schema`);
    let [receiptSchemaId, receiptSchema] = await indy.issuerCreateSchema(hbankDid, 'Receipt', '0.1', 
        ['from_account', 'dest_account', 'amount']);

    console.log(`\"${sender}\" -> Send \"Receipt\" Schema to Ledger`);
    await util.sendSchema(poolHandle, hbankWallet, hbankDid, receiptSchema);

    console.log(`\"${sender}\" -> Get \"Receipt\" Schema from Ledger`);
    [, receiptSchema] = await util.getSchema(poolHandle, hbankDid, receiptSchemaId);

    console.log(`\"${sender}\" -> Create and store in Wallet \"Hbank Receipt\" Credential Definition`);
    [receiptCredDefId, receiptCredDefJson] = await indy.issuerCreateAndStoreCredentialDef(hbankWallet, hbankDid, receiptSchema, 'TAG1', 'CL', '{"support_revocation": false}');

    console.log(`\"${sender}\" -> Send  \"Hbank Receipt\" Credential Definition to Ledger`);
    await util.sendCredDef(poolHandle, hbankWallet, hbankDid, receiptCredDefJson);
    return receiptCredDefId;
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
    // console.log(` Request . ${ret}`);
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

let receiptProofRequestJson;
async function createProofRequest(){
    let nonce = await indy.generateNonce();
    receiptProofRequestJson = {
        'nonce': nonce,
        'name': 'Receipt-Application',
        'version': '0.1',
        'requested_attributes':{
            'attr1_referent': {
                'name': 'first_name',
                'restrictions': [{'cred_def_id': govIdCredDef}]
            },
            'attr2_referent': {
                'name': 'last_name',
                'restrictions': [{'cred_def_id': govIdCredDef}]
            },
            'attr3_referent': {
                'name': 'from_account'
            },
            'attr4_referent': {
                'name': 'dest_account'
            },
            'attr5_referent': {
                'name': 'amount'
            }
        },
        "requested_predicates": {}
    };
    console.log(receiptProofRequestJson);
    console.log(`\"${sender}\" -> Get key for Alice did`);
    aliceHbankVerkey = await indy.keyForDid(poolHandle, hbankWallet, aliceHbankDid);

    console.log(`\"${sender}\" -> Authcrypt \"Receipt-Application\" Proof Request for Alice`);
    let authcryptedReceiptProofRequestJson = await indy.cryptoAuthCrypt(hbankWallet, hbankAliceKey, aliceHbankVerkey, Buffer.from(JSON.stringify(receiptProofRequestJson), 'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"Receipt-Application\" Proof Request to Alice`);
    return authcryptedReceiptProofRequestJson;
}

async function verifyProof(authcryptedReceiptApplicationProofJson){
    let decryptedReceiptApplicationProofJson, decryptedReceiptApplicationProof;
    [, decryptedReceiptApplicationProofJson, decryptedReceiptApplicationProof] = await util.authDecrypt(hbankWallet, hbankAliceKey, authcryptedReceiptApplicationProofJson);

    let schemasJson, credDefsJson, revocRefDefsJson, revocRegsJson;
    [schemasJson, credDefsJson, revocRefDefsJson, revocRegsJson] = await util.verifierGetEntitiesFromLedger(poolHandle, hbankDid, decryptedReceiptApplicationProof['identifiers'], 'Hbank');

    console.log("\"@@\" -> Verify \"@@\" Proof from Alice");
    assert('Alice' === decryptedReceiptApplicationProof['requested_proof']['revealed_attrs']['attr1_referent']['raw']);
    assert('Garcia' === decryptedReceiptApplicationProof['requested_proof']['revealed_attrs']['attr2_referent']['raw']);
    
    assert('7458' === decryptedReceiptApplicationProof['requested_proof']['self_attested_attrs']['attr3_referent']);
    assert('7654' === decryptedReceiptApplicationProof['requested_proof']['self_attested_attrs']['attr4_referent']);
    assert('50000' === decryptedReceiptApplicationProof['requested_proof']['self_attested_attrs']['attr5_referent']);

    assert(await indy.verifierVerifyProof(receiptProofRequestJson, decryptedReceiptApplicationProofJson, schemasJson, credDefsJson, revocRefDefsJson, revocRegsJson));
}

async function createCredentialOffer(){
    console.log(`\"${sender}\" -> Create \"Receipt\" Credential Offer for Alice`);
    receiptCredOfferJson = await indy.issuerCreateCredentialOffer(hbankWallet, receiptCredDefId);
    
    console.log(`\"${sender}\" -> Get key for Alice did`);
    aliceHbankVerkey = await indy.keyForDid(poolHandle, hbankWallet, aliceHbankDid);

    console.log(`\"${sender}\" -> Authcrypt \"Receipt\" Credential Offer for Alice`);
    let authcryptedReceiptCredOffer = await indy.cryptoAuthCrypt(hbankWallet, hbankAliceKey, aliceHbankVerkey, Buffer.from(JSON.stringify(receiptCredOfferJson), 'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"Receipt\" Credential Offer to Alice`);
    // console.log(` Offer . ${authcryptedReceiptCredOffer}`);
    return authcryptedReceiptCredOffer;
}

async function createCredential(authcryptedReceiptCredRequest){
    receiver = "Alice";

    console.log(`\"${sender}\" -> Authdecrypt \"Receipt\" Credential Request from ${receiver}`);
    let authdecryptedReceiptCredRequestJson;
    [aliceHbankVerkey, authdecryptedReceiptCredRequestJson] = await util.authDecrypt(hbankWallet, hbankAliceKey, authcryptedReceiptCredRequest);

    console.log(`\"${sender}\" -> Create \"Receipt\" Credential for ${receiver}`);
    // note that encoding is not standardized by Indy except that 32-bit integers are encoded as themselves. IS-786
    let receiptCredValues = {
        "from_account": {"raw": "7458", "encoded": "7458"},
        "dest_account": {"raw": "7654", "encoded": "7654"},
        "amount": {"raw": "50000", "encoded": "50000"}
    };

    let [receiptCredJson] = await indy.issuerCreateCredential(hbankWallet, receiptCredOfferJson, authdecryptedReceiptCredRequestJson, receiptCredValues, null, -1);

    console.log(`\"${sender}\" -> Authcrypt \"Receipt\" Credential for ${receiver}`);
    let authcryptedReceiptCredJson = await indy.cryptoAuthCrypt(hbankWallet, hbankAliceKey, aliceHbankVerkey, Buffer.from(JSON.stringify(receiptCredJson),'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"Receipt\" Credential to ${receiver}`);

    return authcryptedReceiptCredJson;
}


async function close(){
    console.log(`\"${sender}\" -> Close and Delete wallet`);
    await indy.closeWallet(hbankWallet);
    await indy.deleteWallet(hbankWalletConfig, hbankWalletCredentials);
}


module.exports = {
    init,
    hbankSchema,
    connectWithSteward1,
    connectWithSteward2,
    connectWithAlice1,
    connectWithAlice1_1,
    getSchemaId,
    createProofRequest,
    verifyProof,
    createCredentialOffer,
    createCredential,
    close
}
