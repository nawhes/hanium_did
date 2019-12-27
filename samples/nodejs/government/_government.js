"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

let poolHandle;    
let governmentWalletConfig = {'id': 'governmentWallet'};
let governmentWalletCredentials = {'key': 'government_key'};
let governmentWallet;
let [governmentDid, governmentKey];
let [governmentStewardDid, governmentStewardKey];
let [governmentTranscriptCredDefId, governmentTranscriptCredDefJson]

async function init(){
    let poolName = 'pool1';
    console.log(`Open Pool Ledger: ${poolName}`);

    await indy.setProtocolVersion(2)

    poolHandle = await indy.openPoolLedger(poolName);
}


async function connectWithAlice1(){
    console.log(`\"alice\" > Create and store in Wallet \"alice Government\" DID`);
    let [aliceGovernmentDid, aliceGovernmentKey] = await indy.createAndStoreMyDid(aliceWallet, {});

    console.log(`\"alice\" > Send Nym to Ledger for \"alice Government\" DID`);
    await sendNym(poolHandle, aliceWallet, aliceDid, aliceGovernmentDid, aliceGovernmentKey, null);

    console.log(`\"alice\" > Send connection request to Government with \"alice Government\" DID and nonce`);
    let connectionRequest = {
        did: aliceGovernmentDid,
        nonce: 123456789
    };

    //보냈다고 친다.
}

async function connectWithAlice1_1(){
    //받았다고 친다.
    let connectionResponse = JSON.stringify({
        'did': aliceStewardDid,
        'verkey': aliceStewardKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.crypaliceAnonCrypt(StewardaliceVerkey, Buffer.from(connectionResponse, 'utf8'));

    console.log(`\"alice\" > Anondecrypt connection response from \"Government\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(aliceWallet, aliceGovernmentKey, anoncryptedConnectionResponse)));

    console.log(`\"alice\" > Authenticates \"Government\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    console.log(`\"alice\" > Send Nym to Ledger for \"Government alice\" DID`);
    await sendNym(poolHandle, aliceWallet, aliceDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}

async function connectWithAlice2(){
    //받았다고 친다.
    console.log(`\"alice\" > Authcrypt \"alice DID info\" for \"Steward\"`);
    let didInfoJson = JSON.stringify({
        'did': aliceDid,
        'verkey': aliceKey
    });
    let authcryptedDidInfo = await indy.crypaliceAuthCrypt(aliceWallet, aliceStewardKey, StewardaliceKey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"alice\" > Authdecrypted \"Government DID info\" from Government`);
    let [senderVerkey, authdecryptedDidInfo] =
        await indy.cryptoAuthDecrypt(aliceWallet, aliceGovernmentKey, Buffer.from(authcryptedDidInfo));

    let authdecryptedDidInfoJson = JSON.parse(Buffer.from(authdecryptedDidInfo));
    console.log(`\"alice\" > Authenticate Government by comparision of Verkeys`);
    let retrievedVerkey = await indy.keyForDid(poolHandle, aliceWallet, governmentAlcieDid);
    if (senderVerkey !== retrievedVerkey) {
        throw Error("Verkey is not the same");
    }

    console.log(`\"alice\" > Send Nym to Ledger for \"Government DID\" with ${role} Role`);
    await sendNym(poolHandle, aliceWallet, aliceDid, authdecryptedDidInfoJson['did'], authdecryptedDidInfoJson['verkey'], role);
}



async function connectWithSteward1(){

    console.log("==============================");
    console.log("== Getting Trust Anchor credentials - Government Onboarding  ==");
    console.log("------------------------------");

    //받았다고 친다.
    let connectionRequest = {
        did: stewardGovernmentDid,
        nonce: 123456789
    };

    if (!governmentWallet) {
        console.log(`\"Government\" > Create wallet"`);
        try {
            await indy.createWallet(governmentWalletConfig, governmentWalletCredentials)
        } catch(e) {
            if(e.message !== "WalletAlreadyExistsError") {
                throw e;
            }
        }
        governmentWallet = await indy.openWallet(governmentWalletConfig, governmentWalletCredentials);
    }

    console.log(`\"Government\" > Create and store in Wallet \"Government Steward\" DID`);
    [governmentStewardDid, governmentStewardKey] = await indy.createAndStoreMyDid(governmentWallet, {});

    console.log(`\"Government\" > Get key for did from \"Steward\" connection request`);
    let stewardGovernmentVerkey = await indy.keyForDid(poolHandle, governmentWallet, connectionRequest.did);

    console.log(`\"Government\" > Anoncrypt connection response for \"Steward\" with \"Government Steward\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': governmentStewardDid,
        'verkey': governmentStewardKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(stewardGovernmentVerkey, Buffer.from(connectionResponse, 'utf8'));

    console.log(`\"Government\" > Send anoncrypted connection response to \"Steward\"`);

    //보냈다고 친다.
}

async function connectWithSteward2(){
    console.log("==============================");
    console.log("== Getting Trust Anchor credentials - Government getting Verinym  ==");
    console.log("------------------------------");

    console.log(`\"Government\" > Create and store in Wallet \"Government\" new DID"`);
    [governmentDid, governmentKey] = await indy.createAndStoreMyDid(governmentWallet, {});

    console.log(`\"Government\" > Authcrypt \"Government DID info\" for \"Steward\"`);
    let didInfoJson = JSON.stringify({
        'did': governmentDid,
        'verkey': governmentKey
    });
    let authcryptedDidInfo = await indy.cryptoAuthCrypt(governmentWallet, governmentStewardKey, stewardGovernmentKey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"Government\" > Send authcrypted \"Government DID info\" to Steward`);

    //보냈다고 친다.
}

async function governmentSchema(){

    console.log("==============================");
    console.log("=== Credential Schemas Setup ==");
    console.log("------------------------------");


    console.log("\"Government\" -> Create \"Transcript\" Schema");
    let [transcriptSchemaId, transcriptSchema] = await indy.issuerCreateSchema(governmentDid, 'Transcript', '1.2',
        ['first_name', 'last_name', 'degree', 'status',
            'year', 'average', 'ssn']);
    console.log("\"Government\" -> Send \"Transcript\" Schema to Ledger");
    await util.sendSchema(poolHandle, governmentWallet, governmentDid, transcriptSchema);

    console.log("==============================");
    console.log("=== Government Credential Definition Setup ==");
    console.log("------------------------------");

    console.log("\"Government\" -> Get \"Transcript\" Schema from Ledger");
    [, transcriptSchema] = await util.getSchema(poolHandle, governmentDid, transcriptSchemaId);

    console.log("\"Government\" -> Create and store in Wallet \"Government Transcript\" Credential Definition");
    [governmentTranscriptCredDefId, governmentTranscriptCredDefJson] = await indy.issuerCreateAndStoreCredentialDef(governmentWallet, governmentDid, transcriptSchema, 'TAG1', 'CL', '{"support_revocation": false}');

    console.log("\"Government\" -> Send  \"Government Transcript\" Credential Definition to Ledger");
    await util.sendCredDef(poolHandle, governmentWallet, governmentDid, governmentTranscriptCredDefJson);
}

async function connectWithAlice(){
    console.log("==============================");
    console.log("=== Getting Transcript with Government ==");
    console.log("==============================");
    console.log("== Getting Transcript with Government - Onboarding ==");
    console.log("------------------------------");

    console.log(`\"Government\" > Create and store in Wallet \"Government Alice\" DID`);
    let [governmentAliceDid, governmentAliceKey] = await indy.createAndStoreMyDid(governmentWallet, {});

    console.log(`\"Government\" > Send Nym to Ledger for \"Government Alice\" DID`);
    await sendNym(poolHandle, governmentWallet, governmentDid, governmentAliceDid, governmentAliceKey, null);

    console.log(`\"Government\" > Send connection request to Alice with \"Government Alice\" DID and nonce`);
    let connectionRequest = {
        did: governmentAliceDid,
        nonce: 123456789
    };

    //

    console.log(`\"Government\" > Anondecrypt connection response from \"Alice\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(governmentWallet, governmentAliceKey, anoncryptedConnectionResponse)));

    console.log(`\"Government\" > Authenticates \"Alice\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    console.log(`\"Government\" > Send Nym to Ledger for \"Alice Government\" DID`);
    await sendNym(poolHandle, governmentWallet, governmentDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);



    console.log("==============================");
    console.log("== Getting Transcript with Government - Getting Transcript Credential ==");
    console.log("------------------------------");

    console.log("\"Government\" -> Create \"Transcript\" Credential Offer for Alice");
    let transcriptCredOfferJson = await indy.issuerCreateCredentialOffer(governmentWallet, governmentTranscriptCredDefId);

    console.log("\"Government\" -> Get key for Alice did");
    let aliceGovernmentVerkey = await indy.keyForDid(poolHandle, governmentWallet, governmentAliceConnectionResponse['did']);

    console.log("\"Government\" -> Authcrypt \"Transcript\" Credential Offer for Alice");
    let authcryptedTranscriptCredOffer = await indy.cryptoAuthCrypt(governmentWallet, governmentAliceKey, aliceGovernmentVerkey, Buffer.from(JSON.stringify(transcriptCredOfferJson),'utf8'));

    console.log("\"Government\" -> Send authcrypted \"Transcript\" Credential Offer to Alice");


    ////


    console.log("\"Government\" -> Authdecrypt \"Transcript\" Credential Request from Alice");
    let authdecryptedTranscriptCredRequestJson;
    [aliceGovernmentVerkey, authdecryptedTranscriptCredRequestJson] = await util.authDecrypt(governmentWallet, governmentAliceKey, authcryptedTranscriptCredRequest);

    console.log("\"Government\" -> Create \"Transcript\" Credential for Alice");
    // note that encoding is not standardized by Indy except that 32-bit integers are encoded as themselves. IS-786
    let transcriptCredValues = {
        "first_name": {"raw": "Alice", "encoded": "1139481716457488690172217916278103335"},
        "last_name": {"raw": "Garcia", "encoded": "5321642780241790123587902456789123452"},
        "degree": {"raw": "Bachelor of Science, Marketing", "encoded": "12434523576212321"},
        "status": {"raw": "graduated", "encoded": "2213454313412354"},
        "ssn": {"raw": "123-45-6789", "encoded": "3124141231422543541"},
        "year": {"raw": "2015", "encoded": "2015"},
        "average": {"raw": "5", "encoded": "5"}
    };

    let [transcriptCredJson] = await indy.issuerCreateCredential(governmentWallet, transcriptCredOfferJson, authdecryptedTranscriptCredRequestJson, transcriptCredValues, null, -1);

    console.log("\"Government\" -> Authcrypt \"Transcript\" Credential for Alice");
    let authcryptedTranscriptCredJson = await indy.cryptoAuthCrypt(governmentWallet, governmentAliceKey, aliceGovernmentVerkey, Buffer.from(JSON.stringify(transcriptCredJson),'utf8'));

    console.log("\"Government\" -> Send authcrypted \"Transcript\" Credential to Alice");


}

async function close(){
    console.log("\"Government\" -> Close and Delete wallet");
    await indy.closeWallet(governmentWallet);
    await indy.deleteWallet(governmentWalletConfig, governmentWalletCredentials);
}

module.exports = {
    init,
    connectWithSteward1,
    connectWithSteward2,
    governmentSchema,
    connectWithAlice,
    close
}