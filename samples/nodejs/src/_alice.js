"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

const sender = 'alice';
let receiver;

let poolName = 'pool2';
let poolHandle;

let aliceWallet;
let aliceWalletConfig = {'id': 'aliceWallet'}
let aliceWalletCredentials = {'key': 'alice_key'}
let aliceMasterSecretId;

let aliceGovDid, aliceGovKey, govAliceVerkey;
let aliceHbankDid, aliceHbankKey, hbankAliceVerkey;
let aliceHstoreDid, aliceHstoreKey, hstoreAliceVerkey;

let govIdCredDefId, govIdCredDef, govIdCredRequestJson, govIdCredRequestMetadataJson;
let receiptCredDefId, receiptCredDef, receiptCredRequestMetadataJson;
let orderCredDefId, orderCredDef, orderCredRequestMetadataJson;

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

    if (!aliceWallet) {
        console.log(`\"alice\" > Create wallet"`);
        try {
            await indy.createWallet(aliceWalletConfig, aliceWalletCredentials)
        } catch(e) {
            if(e.message !== "WalletAlreadyExistsError") {
                throw e;
            }
        }
        aliceWallet = await indy.openWallet(aliceWalletConfig, aliceWalletCredentials);
    }
}

async function connectWithGov1(request){
    connectionRequest = JSON.parse(request);
    receiver = 'Gov';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [aliceGovDid, aliceGovKey] = await indy.createAndStoreMyDid(aliceWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    govAliceVerkey = await indy.keyForDid(poolHandle, aliceWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': aliceGovDid,
        'verkey': aliceGovKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(govAliceVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	console.log(` Response. ${anoncryptedConnectionResponse}`);
	
	return anoncryptedConnectionResponse;
}

async function connectWithHbank1(request){
    connectionRequest = JSON.parse(request);
    receiver = 'Hbank';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [aliceHbankDid, aliceHbankKey] = await indy.createAndStoreMyDid(aliceWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    hbankAliceVerkey = await indy.keyForDid(poolHandle, aliceWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': aliceHbankDid,
        'verkey': aliceHbankKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(hbankAliceVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	console.log(` Response. ${anoncryptedConnectionResponse}`);
	
	return anoncryptedConnectionResponse;
}

async function connectWithHstore1(request){
    connectionRequest = JSON.parse(request);
    receiver = 'Hstore';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [aliceHstoreDid, aliceHstoreKey] = await indy.createAndStoreMyDid(aliceWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    hstoreAliceVerkey = await indy.keyForDid(poolHandle, aliceWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': aliceHstoreDid,
        'verkey': aliceHstoreKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(hstoreAliceVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	console.log(` Response. ${anoncryptedConnectionResponse}`);
	
	return anoncryptedConnectionResponse;
}

async function createMasterSecret(authcryptedGovIdCredOffer){
    receiver = "Gov";

    console.log(`\"${sender}\" -> Authdecrypted \"GovID\" Credential Offer from Gov`);
    let [govAliceVerkey, authdecryptedGovIdCredOfferJson, authdecryptedGovIdCredOffer] = await util.authDecrypt(aliceWallet, aliceGovKey, authcryptedGovIdCredOffer);

    console.log(`\"${sender}\" -> Create and store \"${sender}\" Master Secret in Wallet`);
    aliceMasterSecretId = await indy.proverCreateMasterSecret(aliceWallet, null);

    console.log(`\"${sender}\" -> Get \"GovID\" Credential Definition from Ledger`);
    [govIdCredDefId, govIdCredDef] = await util.getCredDef(poolHandle, aliceGovDid, authdecryptedGovIdCredOffer['cred_def_id']);

    console.log(`\"${sender}\" -> Create \"GovID\" Credential Request for ${receiver}`);
    [govIdCredRequestJson, govIdCredRequestMetadataJson] = await indy.proverCreateCredentialReq(aliceWallet, aliceGovDid, authdecryptedGovIdCredOfferJson, govIdCredDef, aliceMasterSecretId);

    console.log(`\"${sender}\" -> Authcrypt \"GovId\" Credential Request for ${receiver}`);
    let authcryptedGovIdCredRequest = await indy.cryptoAuthCrypt(aliceWallet, aliceGovKey, govAliceVerkey, Buffer.from(JSON.stringify(govIdCredRequestJson),'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"GovId\" Credential Request to ${receiver}`);
    console.log(` Request . ${authcryptedGovIdCredRequest}`);
    return authcryptedGovIdCredRequest;
}

async function storeCredential(authcryptedGovIdCredJson){
    console.log(`\"${sender}\" -> Authdecrypted \"GovId\" Credential from Gov`);
    let [, authdecryptedGovIdCredJson] = await util.authDecrypt(aliceWallet, aliceGovKey, authcryptedGovIdCredJson);

    console.log(`\"${sender}\" -> Store \"GovI\" Credential from Gov`);
    await indy.proverStoreCredential(aliceWallet, null, govIdCredRequestMetadataJson,
        authdecryptedGovIdCredJson, govIdCredDef, null);
}

async function createProof(authcryptedReceiptProofRequestJson){
    console.log("\"@@\" -> Authdecrypt \"@@\" Proof Request from @@");
    let [, authdecryptedReceiptProofRequestJson] = await authDecrypt(aliceWallet, aliceHbankKey, authcryptedReceiptProofRequestJson);

    console.log("\"@@\" -> Get credentials for \"@@\" Proof Request");
    let searchForReceiptApplicationProofRequest = await indy.proverSearchCredentialsForProofReq(aliceWallet, authdecryptedReceiptProofRequestJson, null)

    let credentials = await indy.proverFetchCredentialsForProofReq(searchForReceiptApplicationProofRequest, 'attr1_referent', 100)
    let credForAttr1 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForReceiptApplicationProofRequest, 'attr2_referent', 100)
    let credForAttr2 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForReceiptApplicationProofRequest, 'attr3_referent', 100)
    let credForAttr3 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForReceiptApplicationProofRequest, 'attr4_referent', 100)
    let credForAttr4 = credentials[0]['cred_info'];

    await indy.proverCloseCredentialsSearchForProofReq(searchForReceiptApplicationProofRequest)

    let credsForReceiptApplicationProof = {};
    credsForReceiptApplicationProof[`${credForAttr1['referent']}`] = credForAttr1;
    credsForReceiptApplicationProof[`${credForAttr2['referent']}`] = credForAttr2;
    credsForReceiptApplicationProof[`${credForAttr3['referent']}`] = credForAttr3;
    credsForReceiptApplicationProof[`${credForAttr4['referent']}`] = credForAttr4;

    let [schemasJson, credDefsJson, revocStatesJson] = await util.proverGetEntitiesFromLedger(poolHandle, aliceHbankDid, credsForReceiptApplicationProof, 'Alice');

    console.log("\"Alice\" -> Create \"Job-Application\" Proof");
    let receiptApplicationRequestedCredsJson = {
        'self_attested_attributes': {
            'attr3_referent': '7458',
            'attr4_referent': '7654'
        },
        'requested_attributes': {
            'attr1_referent': {'cred_id': credForAttr1['referent'], 'revealed': true},
            'attr2_referent': {'cred_id': credForAttr2['referent'], 'revealed': true},
        }
    };

    let receiptApplicationProofJson = await indy.proverCreateProof(aliceWallet, authdecryptedReceiptProofRequestJson, receiptApplicationRequestedCredsJson, aliceMasterSecretId, schemasJson, credDefsJson, revocStatesJson);
    console.log("\"@@\" -> Authcrypt \"@@\" Proof for @@");
    let authcryptedReceiptApplicationProofJson = await indy.cryptoAuthCrypt(aliceWallet, aliceHbankKey, hbankAliceVerkey, Buffer.from(JSON.stringify(receiptApplicationProofJson),'utf8'));

    console.log("\"@@\" -> Send authcrypted \"@@\" Proof to @@");
    return authcryptedReceiptApplicationProofJson;
}

async function close(){
    console.log(`\"${sender}\" -> Close and Delete wallet`);
    await indy.closeWallet(aliceWallet);
    await indy.deleteWallet(aliceWalletConfig, aliceWalletCredentials);
}

module.exports = {
    init,
    connectWithGov1,
    connectWithHbank1,
    connectWithHstore1,
    createProof,
    createMasterSecret,
    storeCredential,
    close
}
