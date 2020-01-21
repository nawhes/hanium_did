"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

const sender = 'Gov';

let poolName = 'poolGov', poolHandle;
let govWallet, govWalletConfig = {'id': 'govWallet'}, govWalletCredentials = {'key': 'govKey'};
let govDid, govKey;

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

   if (!govWallet) {
        console.log(`\"${sender}\" > Create wallet"`);
        try {
            await indy.createWallet(govWalletConfig, govWalletCredentials)
        } catch(e) {
            if(e.message !== "WalletAlreadyExistsError") {
                throw e;
            }
        }
        govWallet = await indy.openWallet(govWalletConfig, govWalletCredentials);
    }
}

//Steward
let govStewardDid, govStewardKey, stewardGovVerkey;
async function connectWithSteward1(request){
    connectionRequest = JSON.parse(request);
    let receiver = 'Steward';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [govStewardDid, govStewardKey] = await indy.createAndStoreMyDid(govWallet, {});

    console.log(`\"${sender}\" > Get key for did from \"${receiver}\" connection request`);
    stewardGovVerkey = await indy.keyForDid(poolHandle, govWallet, connectionRequest.did);

    console.log(`\"${sender}\" > Anoncrypt connection response for \"${receiver}\" with \"${sender} ${receiver}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': govStewardDid,
        'verkey': govStewardKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(stewardGovVerkey, Buffer.from(connectionResponse, 'utf8'));
    console.log(`\"${sender}\" > Send anoncrypted connection response to \"${receiver}\"`);
	
    return anoncryptedConnectionResponse;
}

async function connectWithSteward2(){
    let receiver = 'Steward';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender}\" new DID"`);
    [govDid, govKey] = await indy.createAndStoreMyDid(govWallet, {});

    console.log(`\"${sender}\" > Authcrypt \"${sender} DID info\" for \"${receiver}\"`);
    let didInfoJson = JSON.stringify({
        'did': govDid,
        'verkey': govKey
    });
    let authcryptedDidInfo = await indy.cryptoAuthCrypt(govWallet, govStewardKey, stewardGovVerkey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"${sender}\" > Send authcrypted \"${sender} DID info\" to "${receiver}"`);

    return authcryptedDidInfo;
}

//Schema
let govIdCredDefId, govIdCredDefJson, govIdCredOfferJson;
async function govSchema(){
    console.log(`\"${sender}\" -> Create \"GovId\" Schema`);
    let [govIdSchemaId, govIdSchema] = await indy.issuerCreateSchema(govDid, 'GovId', '0.1',
        ['first_name', 'last_name']);
            
    console.log(`\"${sender}\" -> Send \"GovId\" Schema to Ledger`);
    await util._sendSchema(poolHandle, govWallet, govDid, govIdSchema);

    console.log(`\"${sender}\" -> Get \"GovId\" Schema from Ledger`);
    [, govIdSchema] = await util.getSchema(poolHandle, govDid, govIdSchemaId);

    console.log(`\"${sender}\" -> Create and store in Wallet \"GovId\" Credential Definition`);
    [govIdCredDefId, govIdCredDefJson] = await indy.issuerCreateAndStoreCredentialDef(govWallet, govDid, govIdSchema, 'TAG1', 'CL', '{"support_revocation": false}');

    console.log(`\"${sender}\" -> Send  \"GovId\" Credential Definition to Ledger`);
    await util._sendCredDef(poolHandle, govWallet, govDid, govIdCredDefJson);

    return govIdCredDefId;
}

//Alice
let govAliceDid, govAliceKey, aliceGovDid, aliceGovVerkey;
async function connectWithAlice1(){
    let receiver = 'Alice';

    console.log(`\"${sender}\" > Create and store in Wallet \"${sender} ${receiver}\" DID`);
    [govAliceDid, govAliceKey] = await indy.createAndStoreMyDid(govWallet, {});

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${sender} ${receiver}\" DID`);
    await util.sendNym(poolHandle, govWallet, govDid, govAliceDid, govAliceKey, null);

    console.log(`\"${sender}\" > Send connection request to Alice with \"${sender} ${receiver}\" DID and nonce`);
    connectionRequest = {
        did: govAliceDid,
        nonce: 123456789
    };

    return JSON.stringify(connectionRequest);
}

async function connectWithAlice1_1(anoncryptedConnectionResponse){
    let receiver = 'Alice';

    console.log(`\"${sender}\" > Anondecrypt connection response from \"${receiver}\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(govWallet, govAliceKey, anoncryptedConnectionResponse)));

    console.log(`\"${sender}\" > Authenticates \"${receiver}\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    aliceGovDid = decryptedConnectionResponse['did'];

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${receiver} ${sender}\" DID`);
    await util.sendNym(poolHandle, govWallet, govDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}


async function createCredentialOffer(){
     console.log(`\"${sender}\" -> Create \"GovId\" Credential Offer for Alice`);
     govIdCredOfferJson = await indy.issuerCreateCredentialOffer(govWallet, govIdCredDefId);
     
     console.log(`\"${sender}\" -> Get key for Alice did`);
     aliceGovVerkey = await indy.keyForDid(poolHandle, govWallet, aliceGovDid);

     console.log(`\"${sender}\" -> Authcrypt \"GovId\" Credential Offer for Alice`);
     let authcryptedGovIdCredOffer = await indy.cryptoAuthCrypt(govWallet, govAliceKey, aliceGovVerkey, Buffer.from(JSON.stringify(govIdCredOfferJson), 'utf8'));

     console.log(`\"${sender}\" -> Send authcrypted \"GovId\" Credential Offer to Alice`);

     return authcryptedGovIdCredOffer;
}

async function createCredential(authcryptedGovIdCredRequest){
     let receiver = "Alice";

     console.log(`\"${sender}\" -> Authdecrypt \"GovId\" Credential Request from ${receiver}`);
     let authdecryptedGovIdCredRequestJson;
     [aliceGovVerkey, authdecryptedGovIdCredRequestJson] = await util.authDecrypt(govWallet, govAliceKey, authcryptedGovIdCredRequest);

     console.log(`\"${sender}\" -> Create \"GovId\" Credential for ${receiver}`);
     // note that encoding is not standardized by Indy except that 32-bit integers are encoded as themselves. IS-786
     let govIdCredValues = {
         "first_name": {"raw": "Alice", "encoded": "1667853377"},
         "last_name": {"raw": "Garcia", "encoded": "1668440391"}
     };

     let [govIdCredJson] = await indy.issuerCreateCredential(govWallet, govIdCredOfferJson, authdecryptedGovIdCredRequestJson, govIdCredValues, null, -1);

     console.log(`\"${sender}\" -> Authcrypt \"GovId\" Credential for ${receiver}`);
     let authcryptedGovIdCredJson = await indy.cryptoAuthCrypt(govWallet, govAliceKey, aliceGovVerkey, Buffer.from(JSON.stringify(govIdCredJson),'utf8'));

     console.log(`\"${sender}\" -> Send authcrypted \"GovId\" Credential to ${receiver}`);

     return authcryptedGovIdCredJson;
}

async function close(){
    console.log(`\"${sender}\" -> Close and Delete wallet`);
    await indy.closeWallet(govWallet);
    await indy.deleteWallet(govWalletConfig, govWalletCredentials);
}

module.exports = {
    init,
    connectWithSteward1,
    connectWithSteward2,
    govSchema,
    connectWithAlice1,
    connectWithAlice1_1,
    createCredentialOffer,
    createCredential,
    close
}
