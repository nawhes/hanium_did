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

let aliceGovernmentDid, aliceGovernmentKey;
let governmentAliceVerkey;

let GovernmentTranscriptCredDefId, GovernmentTranscriptCredDef, transcriptCredRequestMetadataJson;
let connectionRequest;

async function init(){
    console.log(' # alice is ready!');
    
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

async function connectWithGovernment1(request){
    connectionRequest = JSON.parse(request);
    receiver = 'government';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [aliceGovernmentDid, aliceGovernmentKey] = await indy.createAndStoreMyDid(aliceWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    governmentAliceVerkey = await indy.keyForDid(poolHandle, aliceWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': aliceGovernmentDid,
        'verkey': aliceGovernmentKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(governmentAliceVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	console.log(` Response. ${anoncryptedConnectionResponse}`);
	
	return anoncryptedConnectionResponse;
}

async function createMasterSecret(authcryptedTranscriptCredOffer){
    receiver = "government";

    console.log(`\"${sender}\" -> Authdecrypted \"Transcript\" Credential Offer Government Government`);
    let [governmentAliceVerkey, authdecryptedTranscriptCredOfferJson, authdecryptedTranscriptCredOffer] = await util.authDecrypt(aliceWallet, aliceGovernmentKey, authcryptedTranscriptCredOffer);

    console.log(`\"${sender}\" -> Create and store \"${sender}\" Master Secret in Wallet`);
    let aliceMasterSecretId = await indy.proverCreateMasterSecret(aliceWallet, null);

    console.log(`\"${sender}\" -> Get \"Government Transcript\" Credential Definition from Ledger`);
    [GovernmentTranscriptCredDefId, GovernmentTranscriptCredDef] = await util.getCredDef(poolHandle, aliceGovernmentDid, authdecryptedTranscriptCredOffer['cred_def_id']);

    console.log(`\"${sender}\" -> Create \"Transcript\" Credential Request for ${receiver}`);
    let [transcriptCredRequestJson, transcriptCredRequestMetadataJson] = await indy.proverCreateCredentialReq(aliceWallet, aliceGovernmentDid, authdecryptedTranscriptCredOfferJson, GovernmentTranscriptCredDef, aliceMasterSecretId);

    console.log(`\"${sender}\" -> Authcrypt \"Transcript\" Credential Request for ${receiver}`);
    let authcryptedTranscriptCredRequest = await indy.cryptoAuthCrypt(aliceWallet, aliceGovernmentKey, governmentAliceVerkey, Buffer.from(JSON.stringify(transcriptCredRequestJson),'utf8'));

    console.log(`\"${sender}\" -> Send authcrypted \"Transcript\" Credential Request to ${receiver}`);
    console.log(` Request . ${authcryptedTranscriptCredRequest}`);
    return authcryptedTranscriptCredRequest;
}

async function storeCredential(authcryptedTranscriptCredJson){
    console.log(`\"${sender}\" -> Authdecrypted \"Transcript\" Credential from Government`);
    let [, authdecryptedTranscriptCredJson] = await util.authDecrypt(aliceWallet, aliceGovernmentKey, authcryptedTranscriptCredJson);

    console.log(`\"${sender}\" -> Store \"Transcript\" Credential from Government`);
    await indy.proverStoreCredential(aliceWallet, null, transcriptCredRequestMetadataJson,
        authdecryptedTranscriptCredJson, GovernmentTranscriptCredDef, null);


}

async function close(){
    console.log(`\"${alice}\" -> Close and Delete wallet`);
    await indy.closeWallet(aliceWallet);
    await indy.deleteWallet(aliceWalletConfig, aliceWalletCredentials);
}

module.exports = {
    init,
    connectWithGovernment1,
    createMasterSecret,
    storeCredential,
    close
}
