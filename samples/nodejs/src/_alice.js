"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

const sender = 'alice';

let poolName = 'poolAlice', poolHandle;
let aliceWallet, aliceWalletConfig = {'id': 'aliceWallet'}, aliceWalletCredentials = {'key': 'alice_key'}

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

//Gov
let aliceGovDid, aliceGovKey, govAliceVerkey;
let govid_aliceMasterSecretId;
let govIdCredDefId, govIdCredDef, govIdCredRequestJson, govIdCredRequestMetadataJson;
async function connectWithGov1(request){
    let connectionRequest = JSON.parse(request);
    let receiver = 'Gov';

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
	
	return anoncryptedConnectionResponse;
}

async function govid_createMasterSecret(authcryptedGovIdCredOffer){
    let receiver = "Gov";

    console.log(`\"${sender}\" -> Authdecrypted \"GovID\" Credential Offer from Gov`);
    let [govAliceVerkey, authdecryptedGovIdCredOfferJson, authdecryptedGovIdCredOffer] = await util.authDecrypt(aliceWallet, aliceGovKey, authcryptedGovIdCredOffer);

    console.log(`\"${sender}\" -> Create and store \"GovID\" Master Secret in Wallet`);
    govid_aliceMasterSecretId = await indy.proverCreateMasterSecret(aliceWallet, null);

    console.log(`\"${sender}\" -> Get \"GovID\" Credential Definition from Ledger`);
    [govIdCredDefId, govIdCredDef] = await util.getCredDef(poolHandle, aliceGovDid, authdecryptedGovIdCredOffer['cred_def_id']);

    console.log(`\"${sender}\" -> Create \"GovID\" Credential Request for ${receiver}`);
    [govIdCredRequestJson, govIdCredRequestMetadataJson] = await indy.proverCreateCredentialReq(aliceWallet, aliceGovDid, authdecryptedGovIdCredOfferJson, govIdCredDef, govid_aliceMasterSecretId);

    console.log(`\"${sender}\" -> Authcrypt \"GovId\" Credential Request for ${receiver}`);
    let authcryptedGovIdCredRequest = await indy.cryptoAuthCrypt(aliceWallet, aliceGovKey, govAliceVerkey, Buffer.from(JSON.stringify(govIdCredRequestJson),'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"GovId\" Credential Request to ${receiver}`);

    return authcryptedGovIdCredRequest;
}

async function govid_storeCredential(authcryptedGovIdCredJson){
    console.log(`\"${sender}\" -> Authdecrypted \"GovId\" Credential from Gov`);
    let [, authdecryptedGovIdCredJson] = await util.authDecrypt(aliceWallet, aliceGovKey, authcryptedGovIdCredJson);

    console.log(' ##### GovIDCredJson');
    console.log(authdecryptedGovIdCredJson);
    console.log('');

    console.log(`\"${sender}\" -> Store \"GovId\" Credential from Gov`);
    await indy.proverStoreCredential(aliceWallet, null, govIdCredRequestMetadataJson,
        authdecryptedGovIdCredJson, govIdCredDef, null);
}

//Hbank
let aliceHbankDid, aliceHbankKey, hbankAliceVerkey;
let receipt_aliceMasterSecretId;
let receiptCredDefId, receiptCredDef, receiptCredRequestJson, receiptCredRequestMetadataJson;
async function connectWithHbank1(request){
    let connectionRequest = await JSON.parse(request);
    let receiver = 'Hbank';

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
	
	return anoncryptedConnectionResponse;
}

async function receipt_createProof(authcryptedReceiptProofRequestJson){
    console.log(`\"${sender}\" -> Authdecrypt \"Receipt\" Proof Request from Hbank`);
    let authdecryptedReceiptProofRequestJson;
    [hbankAliceVerkey, authdecryptedReceiptProofRequestJson] = await util.authDecrypt(aliceWallet, aliceHbankKey, authcryptedReceiptProofRequestJson);

    console.log(' ##### ReceiptProofRequestJson');
    console.log(authdecryptedReceiptProofRequestJson);
    console.log('');

    console.log(`\"${sender}\" -> Get credentials for \"Receipt\" Proof Request`);
    let searchForReceiptApplicationProofRequest = await indy.proverSearchCredentialsForProofReq(aliceWallet, authdecryptedReceiptProofRequestJson, null);

    let credentials = await indy.proverFetchCredentialsForProofReq(searchForReceiptApplicationProofRequest, 'attr1_referent', 100)
    let credForAttr1 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForReceiptApplicationProofRequest, 'attr2_referent', 100)
    let credForAttr2 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForReceiptApplicationProofRequest, 'attr3_referent', 100)
    let credForAttr3 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForReceiptApplicationProofRequest, 'attr4_referent', 100)
    let credForAttr4 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForReceiptApplicationProofRequest, 'attr5_referent', 100)
    let credForAttr5 = credentials[0]['cred_info'];

    await indy.proverCloseCredentialsSearchForProofReq(searchForReceiptApplicationProofRequest)

    let credsForReceiptApplicationProof = {};
    credsForReceiptApplicationProof[`${credForAttr1['referent']}`] = credForAttr1;
    credsForReceiptApplicationProof[`${credForAttr2['referent']}`] = credForAttr2;
    credsForReceiptApplicationProof[`${credForAttr3['referent']}`] = credForAttr3;
    credsForReceiptApplicationProof[`${credForAttr4['referent']}`] = credForAttr4;
    credsForReceiptApplicationProof[`${credForAttr5['referent']}`] = credForAttr5;

    let [schemasJson, credDefsJson, revocStatesJson] = await util.proverGetEntitiesFromLedger(poolHandle, aliceHbankDid, credsForReceiptApplicationProof, 'Alice');

    console.log(`\"${sender}\" -> Create \"Receipt\" Proof`);
    let receiptApplicationRequestedCredsJson = {
        'self_attested_attributes': {
            'attr3_referent': '7458',
            'attr4_referent': '7654',
            'attr5_referent': '50000'
        },
        'requested_attributes': {
            'attr1_referent': {'cred_id': credForAttr1['referent'], 'revealed': true},
            'attr2_referent': {'cred_id': credForAttr2['referent'], 'revealed': true},
        },
        'requested_predicates': {}
    };

    let receiptApplicationProofJson = await indy.proverCreateProof(aliceWallet, authdecryptedReceiptProofRequestJson, receiptApplicationRequestedCredsJson, govid_aliceMasterSecretId, schemasJson, credDefsJson, revocStatesJson);
    
    console.log(`\"${sender}\" -> Authcrypt \"Receipt\" Proof for Hbank`);
    let authcryptedReceiptApplicationProofJson = await indy.cryptoAuthCrypt(aliceWallet, aliceHbankKey, hbankAliceVerkey, Buffer.from(JSON.stringify(receiptApplicationProofJson),'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"Receipt\" Proof to Hbank`);
    return authcryptedReceiptApplicationProofJson;
}

async function receipt_createMasterSecret(authcryptedReceiptCredOffer){
    let receiver = "Hbank";

    console.log(`\"${sender}\" -> Authdecrypted \"Receipt\" Credential Offer from Hbank`);
    let [hbankAliceVerkey, authdecryptedReceiptCredOfferJson, authdecryptedReceiptCredOffer] = await util.authDecrypt(aliceWallet, aliceHbankKey, authcryptedReceiptCredOffer);

    console.log(`\"${sender}\" -> Create and store \"Receipt\" Master Secret in Wallet`);
    receipt_aliceMasterSecretId = await indy.proverCreateMasterSecret(aliceWallet, null);

    console.log(`\"${sender}\" -> Get \"Receipt\" Credential Definition from Ledger`);
    [receiptCredDefId, receiptCredDef] = await util.getCredDef(poolHandle, aliceGovDid, authdecryptedReceiptCredOffer['cred_def_id']);

    console.log(`\"${sender}\" -> Create \"Receipt\" Credential Request for ${receiver}`);
    [receiptCredRequestJson, receiptCredRequestMetadataJson] = await indy.proverCreateCredentialReq(aliceWallet, aliceHbankDid, authdecryptedReceiptCredOfferJson, receiptCredDef, receipt_aliceMasterSecretId);

    console.log(`\"${sender}\" -> Authcrypt \"Receipt\" Credential Request for ${receiver}`);
    let authcryptedReceiptCredRequest = await indy.cryptoAuthCrypt(aliceWallet, aliceHbankKey, hbankAliceVerkey, Buffer.from(JSON.stringify(receiptCredRequestJson),'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"Receipt\" Credential Request to ${receiver}`);

    return authcryptedReceiptCredRequest;
}

async function receipt_storeCredential(authcryptedReceiptCredJson){
    console.log(`\"${sender}\" -> Authdecrypted \"Receipt\" Credential from Hbank`);
    let [, authdecryptedReceiptCredJson] = await util.authDecrypt(aliceWallet, aliceHbankKey, authcryptedReceiptCredJson);

    console.log(`\"${sender}\" -> Store \"Receipt\" Credential from Hbank`);
    await indy.proverStoreCredential(aliceWallet, null, receiptCredRequestMetadataJson,
        authdecryptedReceiptCredJson, receiptCredDef, null);
}

//Hstore
let aliceHstoreDid, aliceHstoreKey, hstoreAliceVerkey;
let orderCredDefId, orderCredDef, orderCredRequestJson, orderCredRequestMetadataJson;
async function connectWithHstore1(request){
    let connectionRequest = await JSON.parse(request);
    let receiver = 'Hstore';

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

	return anoncryptedConnectionResponse;
}

async function order_createProof(authcryptedOrderProofRequestJson){
    console.log(`\"${sender}\" -> Authdecrypt \"Order\" Proof Request from Hstore`);
    let authdecryptedOrderProofRequestJson;
    [hstoreAliceVerkey, authdecryptedOrderProofRequestJson] = await util.authDecrypt(aliceWallet, aliceHstoreKey, authcryptedOrderProofRequestJson);

    console.log(`\"${sender}\" -> Get credentials for \"Order\" Proof Request`);
    let searchForOrderProofRequest = await indy.proverSearchCredentialsForProofReq(aliceWallet, authdecryptedOrderProofRequestJson, null);

    let credentials = await indy.proverFetchCredentialsForProofReq(searchForOrderProofRequest, 'attr3_referent', 100);
    let credForAttr1 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForOrderProofRequest, 'attr2_referent', 100)
    let credForAttr2 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForOrderProofRequest, 'attr3_referent', 100)
    let credForAttr3 = credentials[0]['cred_info'];

    await indy.proverFetchCredentialsForProofReq(searchForOrderProofRequest, 'attr4_referent', 100)
    let credForAttr4 = credentials[0]['cred_info'];

    await indy.proverCloseCredentialsSearchForProofReq(searchForOrderProofRequest)

    let credsForOrderProof = {};
    credsForOrderProof[`${credForAttr1['referent']}`] = credForAttr1;
    credsForOrderProof[`${credForAttr2['referent']}`] = credForAttr2;
    credsForOrderProof[`${credForAttr3['referent']}`] = credForAttr3;
    credsForOrderProof[`${credForAttr4['referent']}`] = credForAttr4;

    let [schemasJson, credDefsJson, revocStatesJson] = await util.proverGetEntitiesFromLedger(poolHandle, aliceHbankDid, credsForOrderProof, 'Alice');

    console.log(`\"${sender}\" -> Create \"Order\" Proof`);
    let orderApplicationRequestedCredsJson = {
        'self_attested_attributes': {
            'attr1_referent': '745',
            'attr2_referent': '123'
        },
        'requested_attributes': {
            'attr3_referent': {'cred_id': credForAttr3['referent'], 'revealed': true},
            'attr4_referent': {'cred_id': credForAttr4['referent'], 'revealed': true},
        },
        'requested_predicates': {}
    };

    let orderApplicationProofJson = await indy.proverCreateProof(aliceWallet, authdecryptedOrderProofRequestJson, orderApplicationRequestedCredsJson, receipt_aliceMasterSecretId, schemasJson, credDefsJson, revocStatesJson);
    console.log(`\"${sender}\" -> Authcrypt \"Order\" Proof for Hstore`);
    let authcryptedReceiptApplicationProofJson = await indy.cryptoAuthCrypt(aliceWallet, aliceHstoreKey, hstoreAliceVerkey, Buffer.from(JSON.stringify(orderApplicationProofJson),'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"Order\" Proof to Hstore`);
    return authcryptedReceiptApplicationProofJson;
}

async function wallet(){
    console.log(' ##### Alice\'s Wallet');
    console.log(await indy.proverGetCredentials(aliceWallet, {}));
    console.log('');
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
    govid_createMasterSecret,
    govid_storeCredential,
    receipt_createProof,
    receipt_createMasterSecret,
    receipt_storeCredential,
    order_createProof,
    wallet,
    close
}
