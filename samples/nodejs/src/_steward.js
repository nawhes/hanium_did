"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');

const sender = 'Steward';

let poolName = 'poolSteward', poolHandle;
let stewardWallet, stewardWalletConfig = {'id': 'stewardWallet'}, stewardWalletCredentials = {'key': 'stewardKey'}
let stewardDid, stewardKey;

let connectionRequest;

async function init(){
	console.log(" # steward is ready!");

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

	await indy.setProtocolVersion(2);
	poolHandle = await indy.openPoolLedger(poolName);

	console.log("\"Sovrin Steward\" -> Create wallet");

	try {
		await indy.createWallet(stewardWalletConfig, stewardWalletCredentials);
	} catch(e) {
		if(e.message !== "WalletAlreadyExistsError") {
			throw e;
		}
	}
	stewardWallet = await indy.openWallet(stewardWalletConfig, stewardWalletCredentials);
}

//Gov
let stewardGovDid, stewardGovKey, govStewardDid;
async function connectWithGov1(){
    console.log("\"Steward\" -> Create and store in Wallet DID from seed");
    let stewardDidInfo = {
        'seed': '000000000000000000000000Steward1'
    };

    [stewardDid, stewardKey] = await indy.createAndStoreMyDid(stewardWallet, stewardDidInfo);

    console.log(`\"Steward\" > Create and store in Wallet \"Steward Gov\" DID`);
    [stewardGovDid, stewardGovKey] = await indy.createAndStoreMyDid(stewardWallet, {});

    console.log(`\"Steward\" > Send Nym to Ledger for \"Steward Gov\" DID`);
    await util._sendNym(poolHandle, stewardWallet, stewardDid, stewardGovDid, stewardGovKey, null);

    console.log(`\"Steward\" > Send connection request to Gov with \"Steward Gov\" DID and nonce`);
    connectionRequest = {
        did: stewardGovDid,
        nonce: 123456789
    };

    return JSON.stringify(connectionRequest);
}

async function connectWithGov1_1(anoncryptedConnectionResponse){
    console.log(`\"Steward\" > Anondecrypt connection response from \"Gov\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(stewardWallet, stewardGovKey, anoncryptedConnectionResponse)));

    console.log(`\"Steward\" > Authenticates \"Gov\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    govStewardDid = decryptedConnectionResponse['did'];

    console.log(`\"Steward\" > Send Nym to Ledger for \"Gov Steward\" DID`);
    await util._sendNym(poolHandle, stewardWallet, stewardDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}

async function connectWithGov2(authcryptedDidInfo){
    console.log(`\"Steward\" > Authdecrypted \"Gov DID info\" from Gov`);
    let [senderVerkey, authdecryptedDidInfo] =
        await indy.cryptoAuthDecrypt(stewardWallet, stewardGovKey, Buffer.from(authcryptedDidInfo));

    let authdecryptedDidInfoJson = JSON.parse(Buffer.from(authdecryptedDidInfo));
    console.log(`\"Steward\" > Authenticate Gov by comparision of Verkeys`);
    let retrievedVerkey = await indy.keyForDid(poolHandle, stewardWallet, govStewardDid);
    if (senderVerkey !== retrievedVerkey) {
        throw Error("Verkey is not the same");
    }

    console.log(`\"Steward\" > Send Nym to Ledger for \"Gov DID\" with $\'TRUST_ANCHOR\' Role`);
    await util._sendNym(poolHandle, stewardWallet, stewardDid, authdecryptedDidInfoJson['did'], authdecryptedDidInfoJson['verkey'], 'TRUST_ANCHOR');
}


//Hstore
let stewardHstoreDid, stewardHstoreKey, hstoreStewardDid;
async function connectWithHstore1(){
    let receiver = 'Hstore';
    console.log(`\"${sender}\" > Create and store in Wallet \"${receiver} ${sender}\" DID`);
    [stewardHstoreDid, stewardHstoreKey] = await indy.createAndStoreMyDid(stewardWallet, {});

    console.log(`\"${sender}\" > Send Nym to Ledger for \"Hstore Steward\" DID`);
    await util.sendNym(poolHandle, stewardWallet, stewardDid, stewardHstoreDid, stewardHstoreKey, null);

    console.log(`\"${sender}\" > Send connection request to Steward with \"Hstore Steward\" DID and nonce`);
    connectionRequest = {
        did: stewardHstoreDid,
        nonce: 123456789
    };

    return JSON.stringify(connectionRequest);
}

async function connectWithHstore1_1(anoncryptedConnectionResponse){
    let receiver = 'Hstore';
    console.log(`\"${sender}\" > Anondecrypt connection response from \"${receiver}\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(stewardWallet, stewardHstoreKey, anoncryptedConnectionResponse)));

    console.log(`\"${sender}\" > Authenticates \"${receiver}\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    hstoreStewardDid = decryptedConnectionResponse['did'];

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${receiver} ${sender}\" DID`);
    await util.sendNym(poolHandle, stewardWallet, stewardDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}

async function connectWithHstore2(authcryptedDidInfo){
    let receiver = 'Hstore';
    console.log(`\"${sender}\" > Authdecrypted \"${receiver} DID info\" from ${receiver}`);
    let [senderVerkey, authdecryptedDidInfo] =
        await indy.cryptoAuthDecrypt(stewardWallet, stewardHstoreKey, Buffer.from(authcryptedDidInfo));

    let authdecryptedDidInfoJson = JSON.parse(Buffer.from(authdecryptedDidInfo));
    console.log(`\"${sender}\" > Authenticate Gov by comparision of Verkeys`);
    let retrievedVerkey = await indy.keyForDid(poolHandle, stewardWallet, hstoreStewardDid);
    if (senderVerkey !== retrievedVerkey) {
        throw Error("Verkey is not the same");
    }

    console.log(`\"${sender}\" > Send Nym to Ledger for \"Hstore DID\" with $\'TRUST_ANCHOR\' Role`);
    await util.sendNym(poolHandle, stewardWallet, stewardDid, authdecryptedDidInfoJson['did'], authdecryptedDidInfoJson['verkey'], 'TRUST_ANCHOR');
}

//Hbank
let stewardHbankDid, stewardHbankKey, hbankStewardDid;
async function connectWithHbank1(){
    let receiver = 'Hbank';
    console.log(`\"${sender}\" > Create and store in Wallet \"${receiver} ${sender}\" DID`);
    [stewardHbankDid, stewardHbankKey] = await indy.createAndStoreMyDid(stewardWallet, {});

    console.log(`\"${sender}\" > Send Nym to Ledger for \"Hbank Steward\" DID`);
    await util.sendNym(poolHandle, stewardWallet, stewardDid, stewardHbankDid, stewardHbankKey, null);

    console.log(`\"${sender}\" > Send connection request to Steward with \"Hbank Steward\" DID and nonce`);
    connectionRequest = {
        did: stewardHbankDid,
        nonce: 123456789
    };

    return JSON.stringify(connectionRequest);
}

async function connectWithHbank1_1(anoncryptedConnectionResponse){
    let receiver = 'Hbank';
    console.log(`\"${sender}\" > Anondecrypt connection response from \"${receiver}\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(stewardWallet, stewardHbankKey, anoncryptedConnectionResponse)));

    console.log(`\"${sender}\" > Authenticates \"${receiver}\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    hbankStewardDid = decryptedConnectionResponse['did'];

    console.log(`\"${sender}\" > Send Nym to Ledger for \"${receiver} ${sender}\" DID`);
    await util.sendNym(poolHandle, stewardWallet, stewardDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}

async function connectWithHbank2(authcryptedDidInfo){
    let receiver = 'Hbank';
    console.log(`\"${sender}\" > Authdecrypted \"${receiver} DID info\" from ${receiver}`);
    let [senderVerkey, authdecryptedDidInfo] =
        await indy.cryptoAuthDecrypt(stewardWallet, stewardHbankKey, Buffer.from(authcryptedDidInfo));

    let authdecryptedDidInfoJson = JSON.parse(Buffer.from(authdecryptedDidInfo));
    console.log(`\"${sender}\" > Authenticate Steward by comparision of Verkeys`);
    let retrievedVerkey = await indy.keyForDid(poolHandle, stewardWallet, hbankStewardDid);
    if (senderVerkey !== retrievedVerkey) {
        throw Error("Verkey is not the same");
    }

    console.log(`\"${sender}\" > Send Nym to Ledger for \"Hbank DID\" with $\'TRUST_ANCHOR\' Role`);
    await util.sendNym(poolHandle, stewardWallet, stewardDid, authdecryptedDidInfoJson['did'], authdecryptedDidInfoJson['verkey'], 'TRUST_ANCHOR');
}


async function close(){
    console.log(`\"Steward\" -> Close and Delete wallet`);
    await indy.closeWallet(stewardWallet);
    await indy.deleteWallet(stewardWalletConfig, stewardWalletCredentials);
}

module.exports = {
    init,
    connectWithGov1,
    connectWithGov1_1,
    connectWithGov2,
    connectWithHbank1,
    connectWithHbank1_1,
    connectWithHbank2,
    connectWithHstore1,
    connectWithHstore1_1,
    connectWithHstore2,
    close
}
