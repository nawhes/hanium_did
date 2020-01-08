"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');


let poolName = 'pool1';
let poolHandle;

let stewardWallet;
let stewardWalletConfig = {'id': 'stewardWalletName'}
let stewardWalletCredentials = {'key': 'steward_key'}
let stewardDid, stewardKey;
let stewardGovernmentDid, stewardGovernmentKey;
let governmentStewardDid;

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


async function connectWithGovernment1(){
    console.log("\"Steward\" -> Create and store in Wallet DID from seed");
    let stewardDidInfo = {
        'seed': '000000000000000000000000Steward1'
    };

    [stewardDid, stewardKey] = await indy.createAndStoreMyDid(stewardWallet, stewardDidInfo);

    console.log(`\"Steward\" > Create and store in Wallet \"Steward Goverment\" DID`);
    [stewardGovernmentDid, stewardGovernmentKey] = await indy.createAndStoreMyDid(stewardWallet, {});

    console.log(`\"Steward\" > Send Nym to Ledger for \"Steward Goverment\" DID`);
    await util.sendNym(poolHandle, stewardWallet, stewardDid, stewardGovernmentDid, stewardGovernmentKey, null);

    console.log(`\"Steward\" > Send connection request to Goverment with \"Steward Goverment\" DID and nonce`);
    connectionRequest = {
        did: stewardGovernmentDid,
        nonce: 123456789
    };

	var ret = JSON.stringify(connectionRequest);
	console.log(` Request . ${ret}`);
    return ret;
}

async function connectWithGovernment1_1(anoncryptedConnectionResponse){
    console.log(`\"Steward\" > Anondecrypt connection response from \"Government\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(stewardWallet, stewardGovernmentKey, anoncryptedConnectionResponse)));

    console.log(`\"Steward\" > Authenticates \"Goverment\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    governmentStewardDid = decryptedConnectionResponse['did'];

    console.log(`\"Steward\" > Send Nym to Ledger for \"Goverment Steward\" DID`);
    await util.sendNym(poolHandle, stewardWallet, stewardDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);
}

async function connectWithGovernment2(authcryptedDidInfo){
    console.log(`\"Steward\" > Authdecrypted \"Goverment DID info\" from Goverment`);
    let [senderVerkey, authdecryptedDidInfo] =
        await indy.cryptoAuthDecrypt(stewardWallet, stewardGovernmentKey, Buffer.from(authcryptedDidInfo));

    let authdecryptedDidInfoJson = JSON.parse(Buffer.from(authdecryptedDidInfo));
    console.log(`\"Steward\" > Authenticate Goverment by comparision of Verkeys`);
    let retrievedVerkey = await indy.keyForDid(poolHandle, stewardWallet, governmentStewardDid);
    if (senderVerkey !== retrievedVerkey) {
        throw Error("Verkey is not the same");
    }

    console.log(`\"Steward\" > Send Nym to Ledger for \"Goverment DID\" with $\'TRUST_ANCHOR\' Role`);
    await util.sendNym(poolHandle, stewardWallet, stewardDid, authdecryptedDidInfoJson['did'], authdecryptedDidInfoJson['verkey'], 'TRUST_ANCHOR');
}

async function close(){
    console.log(" \"Sovrin Steward\" -> Close and Delete wallet");
    await indy.closeWallet(stewardWallet);
    await indy.deleteWallet(stewardWalletConfig, stewardWalletCredentials);
}


module.exports = {
    init,
    connectWithGovernment1,
    connectWithGovernment1_1,
    connectWithGovernment2,
    close
}
