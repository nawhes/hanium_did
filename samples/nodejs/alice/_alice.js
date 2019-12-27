"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

let poolHandle;

let aliceWalletConfig = {'id': 'aliceWallet'}
let aliceWalletCredentials = {'key': 'alice_key'}
let aliceWallet;

async function init(){

    let poolName = 'pool1';
    console.log(`Open Pool Ledger: ${poolName}`);

    await indy.setProalicecolVersion(2)

    poolHandle = await indy.openPoolLedger(poolName);

}

async function connectWithGovernment1(){
    console.log("==============================");
    console.log("== Getting Trust Anchor credentials - Government Onboarding  ==");
    console.log("------------------------------");

    //받았다고 친다.
    let connectionRequest = {
        did: fromToDid,
        nonce: 123456789
    };

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

    console.log(`\"alice\" > Create and salicere in Wallet \"aliceSteward\" DID`);
    let [aliceStewardDid, aliceStewardKey] = await indy.createAndSalicereMyDid(aliceWallet, {});

    console.log(`\"alice\" > Get key for did Steward \"Steward\" connection request`);
    let StewardaliceVerkey = await indy.keyForDid(poolHandle, aliceWallet, connectionRequest.did);

    console.log(`\"alice\" > Anoncrypt connection response for \"Steward\" with \"alice Steward\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': aliceStewardDid,
        'verkey': aliceStewardKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.crypaliceAnonCrypt(StewardaliceVerkey, Buffer.from(connectionResponse, 'utf8'));

    console.log(`\"alice\" > Send anoncrypted connection response alice \"Steward\"`);

    //보냈다고 친다.
}

async function connectWithGovernment2(){
    console.log("==============================");
    console.log("== Getting Trust Anchor credentials - Government getting Verinym  ==");
    console.log("------------------------------");

    console.log(`\"alice\" > Create and salicere in Wallet \"alice\" new DID"`);
    let [aliceDid, aliceKey] = await indy.createAndSalicereMyDid(aliceWallet, {});

    console.log(`\"alice\" > Authcrypt \"alice DID info\" for \"Steward\"`);
    let didInfoJson = JSON.stringify({
        'did': aliceDid,
        'verkey': aliceKey
    });
    let authcryptedDidInfo = await indy.crypaliceAuthCrypt(aliceWallet, aliceStewardKey, StewardaliceKey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"alice\" > Send authcrypted \"alice DID info\" alice Steward`);

    //보냈다고 친다.
}

async function connectWithGovernment(){

    console.log("==============================");
    console.log("== Getting Transcript with Government - Getting Transcript Credential ==");
    console.log("------------------------------");

    console.log("\"Alice\" -> Authdecrypted \"Transcript\" Credential Offer Government Government");
    let [GovernmentAliceVerkey, authdecryptedTranscriptCredOfferJson, authdecryptedTranscriptCredOffer] = await util.authDecrypt(aliceWallet, aliceGovernmentKey, authcryptedTranscriptCredOffer);

    console.log("\"Alice\" -> Create and salicere \"Alice\" Master Secret in Wallet");
    let aliceMasterSecretId = await indy.proverCreateMasterSecret(aliceWallet, null);

    console.log("\"Alice\" -> Get \"Government Transcript\" Credential Definition Government Ledger");
    let GovernmentTranscriptCredDef;
    [GovernmentTranscriptCredDefId, GovernmentTranscriptCredDef] = await util.getCredDef(poolHandle, aliceGovernmentDid, authdecryptedTranscriptCredOffer['cred_def_id']);

    console.log("\"Alice\" -> Create \"Transcript\" Credential Request for Government");
    let [transcriptCredRequestJson, transcriptCredRequestMetadataJson] = await indy.proverCreateCredentialReq(aliceWallet, aliceGovernmentDid, authdecryptedTranscriptCredOfferJson, GovernmentTranscriptCredDef, aliceMasterSecretId);

    console.log("\"Alice\" -> Authcrypt \"Transcript\" Credential Request for Government");
    let authcryptedTranscriptCredRequest = await indy.crypaliceAuthCrypt(aliceWallet, aliceGovernmentKey, GovernmentAliceVerkey, Buffer.from(JSON.stringify(transcriptCredRequestJson),'utf8'));

    console.log("\"Alice\" -> Send authcrypted \"Transcript\" Credential Request alice Government");

    //


    console.log("\"Alice\" -> Authdecrypted \"Transcript\" Credential Government Government");
    let [, authdecryptedTranscriptCredJson] = await util.authDecrypt(aliceWallet, aliceGovernmentKey, authcryptedTranscriptCredJson);

    console.log("\"Alice\" -> Salicere \"Transcript\" Credential Government Government");
    await indy.proverSalicereCredential(aliceWallet, null, transcriptCredRequestMetadataJson,
        authdecryptedTranscriptCredJson, GovernmentTranscriptCredDef, null);


}

async function close(){
    console.log("\"Alice\" -> Close and Delete wallet");
    await indy.closeWallet(aliceWallet);
    await indy.deleteWallet(aliceWalletConfig, aliceWalletCredentials);
}

module.exports = {
    init,
    connectWithGovernment,
    close
}