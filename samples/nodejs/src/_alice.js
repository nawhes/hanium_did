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

    console.log(`\"${sender}\" -> Authdecrypted \"Transcript\" Credential Offer from Gov`);
    let [govAliceVerkey, authdecryptedTranscriptCredOfferJson, authdecryptedGovIdCredOffer] = await util.authDecrypt(aliceWallet, aliceGovKey, authcryptedGovIdCredOffer);

    console.log(`\"${sender}\" -> Create and store \"${sender}\" Master Secret in Wallet`);
    let aliceMasterSecretId = await indy.proverCreateMasterSecret(aliceWallet, null);

    console.log(`\"${sender}\" -> Get \"Gov Transcript\" Credential Definition from Ledger`);
    [govIdCredDefId, govIdCredDef] = await util.getCredDef(poolHandle, aliceGovDid, authdecryptedGovIdCredOffer['cred_def_id']);

    console.log(`\"${sender}\" -> Create \"Transcript\" Credential Request for ${receiver}`);
    [govIdCredRequestJson, govIdCredRequestMetadataJson] = await indy.proverCreateCredentialReq(aliceWallet, aliceGovDid, authdecryptedTranscriptCredOfferJson, govIdCredDef, aliceMasterSecretId);

    console.log(`\"${sender}\" -> Authcrypt \"Transcript\" Credential Request for ${receiver}`);
    let authcryptedGovIdCredRequest = await indy.cryptoAuthCrypt(aliceWallet, aliceGovKey, govAliceVerkey, Buffer.from(JSON.stringify(govIdCredRequestJson),'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"Transcript\" Credential Request to ${receiver}`);
    console.log(` Request . ${authcryptedGovIdCredRequest}`);
    return authcryptedGovIdCredRequest;
}

async function storeCredential(authcryptedGovIdCredJson){
    console.log(`\"${sender}\" -> Authdecrypted \"GovId\" Credential from Gov`);
    let [, authdecryptedGovIdCredJson] = await util.authDecrypt(aliceWallet, aliceGovKey, authcryptedGovIdCredJson);

    console.log(`\"${sender}\" -> Store \"Transcript\" Credential from Gov`);
    await indy.proverStoreCredential(aliceWallet, null, govIdCredRequestMetadataJson,
        authdecryptedGovIdCredJson, govIdCredDef, null);
}

async function close(){
    console.log(`\"${sender}\" -> Close and Delete wallet`);
    await indy.closeWallet(aliceWallet);
    await indy.deleteWallet(aliceWalletConfig, aliceWalletCredentials);
}

module.exports = {
    init,
    connectWithGov1,
    createMasterSecret,
    storeCredential,
    close
}
