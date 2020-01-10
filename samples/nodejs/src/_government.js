"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

const sender = 'government';
let receiver;

let poolName = 'pool3';
let poolHandle;

let governmentWallet;
let governmentWalletConfig = {'id': 'governmentWallet'};
let governmentWalletCredentials = {'key': 'government_key'};
let governmentDid, governmentKey;
let governmentStewardDid, governmentStewardKey;
let stewardGovernmentVerkey, aliceGovernmentVerkey;

let governmentAliceDid, governmentAliceKey, aliceGovernmentDid;

let connectionRequest;

let governmentTranscriptCredDefId, governmentTranscriptCredDefJson;

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

   if (!governmentWallet) {
        console.log(`\"${sender}\" > Create wallet"`);
        try {
            await indy.createWallet(governmentWalletConfig, governmentWalletCredentials)
        } catch(e) {
            if(e.message !== "WalletAlreadyExistsError") {
                throw e;
            }
        }
        governmentWallet = await indy.openWallet(governmentWalletConfig, governmentWalletCredentials);
    }
}


async function connectWithSteward1(request){
	let connectionRequest = JSON.parse(request);
    receiver = 'steward';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [governmentStewardDid, governmentStewardKey] = await indy.createAndStoreMyDid(governmentWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    stewardGovernmentVerkey = await indy.keyForDid(poolHandle, governmentWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': governmentStewardDid,
        'verkey': governmentStewardKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(stewardGovernmentVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	console.log(` Response. ${anoncryptedConnectionResponse}`);
	
	return anoncryptedConnectionResponse;
}

async function connectWithSteward2(){
    receiver = 'steward';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender}\" new DID"`);
    [governmentDid, governmentKey] = await indy.createAndStoreMyDid(governmentWallet, {});

    console.log(`\"${sender}\" > Authcrypt \"${sender} DID info\" for \"${receiver}\"`);
    let didInfoJson = JSON.stringify({
        'did': governmentDid,
        'verkey': governmentKey
    });
    let authcryptedDidInfo = await indy.cryptoAuthCrypt(governmentWallet, governmentStewardKey, stewardGovernmentVerkey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"${sender}\" > Send authcrypted \"${sender} DID info\" to "${receiver}"`);

	return authcryptedDidInfo;
}

async function connectWithAlice1(){
    receiver = 'alice';
/*
    console.log(`\"${sender}\" -> Create and store in Wallet DID from seed`);
    let governmentDidInfo = {
        'seed': '000000000000000000000000Government1'
    };

    [governmentDid, governmentKey] = await indy.createAndStoreMyDid(governmentWallet, governmentDidInfo)
*/
    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [governmentAliceDid, governmentAliceKey] = await indy.createAndStoreMyDid(governmentWallet, {});

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${sender} ${receiver}\" DID`);
    await util.sendNym(poolHandle, governmentWallet, governmentDid, governmentAliceDid, governmentAliceKey, null);

    console.log(`\"${sender}\" > Send connection request to Alice with \"${sender} ${receiver}\" DID and nonce`);
    connectionRequest = {
        did: governmentAliceDid,
        nonce: 123456789
    };

    let ret = JSON.stringify(connectionRequest);
    console.log(` Request . ${ret}`);
    return ret;
}

async function connectWithAlice1_1(anoncryptedConnectionResponse){
    receiver = 'alice';

    console.log(`\"${sender}\" > Anondecrypt connection response from \"${receiver}\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(governmentWallet, governmentAliceKey, anoncryptedConnectionResponse)));

    console.log(`\"${sender}\" > Authenticates \"${receiver}\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    aliceGovernmentDid = decryptedConnectionResponse['did'];

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${receiver} ${sender}\" DID`);
    await util.sendNym(poolHandle, governmentWallet, governmentDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}

// async function connectWithAlice2(authcryptedDidInfo){
//     console.log(`\"government\" > Authdecrypted \"Alice DID info\" from Alice`);
//     let [senderVerkey, authdecryptedDidInfo] =
//         await indy.cryptoAuthDecrypt(governmentWallet, governmentAliceKey, Buffer.from(authcryptedDidInfo));

//     let authdecryptedDidInfoJson = JSON.parse(Buffer.from(authdecryptedDidInfo));
//     console.log(`\"government\" > Authenticate Alice by comparision of Verkeys`);
//     let retrievedVerkey = await indy.keyForDid(poolHandle, governmentWallet, aliceGovernmentDid);
//     if (senderVerkey !== retrievedVerkey) {
//         throw Error("Verkey is not the same");
//     }

//     console.log(`\"alice\" > Send Nym to Ledger for \"Government DID\" with ${role} Role`);
//     await util.sendNym(poolHandle, governmentWallet, governmentDid, authdecryptedDidInfoJson['did'], authdecryptedDidInfoJson['verkey'], null);
// }


async function governmentSchema(){
    console.log(`\"${sender}\" -> Create \"Transcript\" Schema`);
    let [transcriptSchemaId, transcriptSchema] = await indy.issuerCreateSchema(governmentDid, 'Transcript', '1.2',
        ['first_name', 'last_name', 'degree', 'status',
            'year', 'average', 'ssn']);
    console.log(`\"${sender}\" -> Send \"Transcript\" Schema to Ledger`);
    await util.sendSchema(poolHandle, governmentWallet, governmentDid, transcriptSchema);

    console.log(`\"${sender}\" -> Get \"Transcript\" Schema from Ledger`);
    [, transcriptSchema] = await util.getSchema(poolHandle, governmentDid, transcriptSchemaId);

    console.log(`\"${sender}\" -> Create and store in Wallet \"Government Transcript\" Credential Definition`);
    [governmentTranscriptCredDefId, governmentTranscriptCredDefJson] = await indy.issuerCreateAndStoreCredentialDef(governmentWallet, governmentDid, transcriptSchema, 'TAG1', 'CL', '{"support_revocation": false}');

    console.log(`\"${sender}\" -> Send  \"Government Transcript\" Credential Definition to Ledger`);
    await util.sendCredDef(poolHandle, governmentWallet, governmentDid, governmentTranscriptCredDefJson);
}

async function createCredentialOffer(){
     console.log(`\"${sender}\" -> Create \"Transcript\" Credential Offer for Alice`);
     let transcriptCredOfferJson = await indy.issuerCreateCredentialOffer(governmentWallet, governmentTranscriptCredDefId);
     
     console.log(`\"${sender}\" -> Get key for Alice did`);
     aliceGovernmentVerkey = await indy.keyForDid(poolHandle, governmentWallet, aliceGovernmentDid);

     console.log(`\"${sender}\" -> Authcrypt \"Transcript\" Credential Offer for Alice`);
     let authcryptedTranscriptCredOffer = await indy.cryptoAuthCrypt(governmentWallet, governmentAliceKey, aliceGovernmentVerkey, Buffer.from(JSON.stringify(transcriptCredOfferJson), 'utf8'));

     console.log("\"Government\" -> Send authcrypted \"Transcript\" Credential Offer to Alice");
     console.log(` Offer . ${authcryptedTranscriptCredOffer}`);
     return authcryptedTranscriptCredOffer;
}

async function createCredential(authcryptedTanscriptCredRequest){
     receiver = "alice";

     console.log(`\"${sender}\" -> Authdecrypt \"Transcript\" Credential Request from ${receiver}`);
     let authdecryptedTranscriptCredRequestJson;
     [aliceGovernmentVerkey, authdecryptedTranscriptCredRequestJson] = await util.authDecrypt(governmentWallet, governmentAliceKey, authcryptedTranscriptCredRequest);

     console.log(`\"${sender}\" -> Create \"Transcript\" Credential for ${receiver}`);
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

     console.log(`\"${sender}\" -> Authcrypt \"Transcript\" Credential for ${receiver}`);
     let authcryptedTranscriptCredJson = await indy.cryptoAuthCrypt(governmentWallet, governmentAliceKey, aliceGovernmentVerkey, Buffer.from(JSON.stringify(transcriptCredJson),'utf8'));

     console.log(`\"${sender}\" -> Send authcrypted \"Transcript\" Credential to ${receiver}`);
     console.log(` TranscriptCredential . ${authcryptedTranscriptCredJson}`);

     return authcryptedTranscriptCredJson;
}

async function close(){
    console.log(`\"${sender}\" -> Close and Delete wallet`);
    await indy.closeWallet(governmentWallet);
    await indy.deleteWallet(governmentWalletConfig, governmentWalletCredentials);
}

module.exports = {
    init,
    connectWithSteward1,
    connectWithSteward2,
    governmentSchema,
    connectWithAlice1,
    connectWithAlice1_1,
    createCredentialOffer,
    createCredential,
    close
}
