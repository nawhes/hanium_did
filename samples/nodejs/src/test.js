const express = require('express');
const app = express();
const port = 8000;

const steward = require('./_steward');
const alice = require('./_alice');
const gov = require('./_gov');
const hbank = require('./_hbank');
const hstore = require('./_hstore');

const readline = require('readline');

function test(){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
	return new Promise( (resolve, reject) => {
		rl.question(' ## What do you want? ', (answer) => {
			rl.close();
			resolve(answer);
		});
	});
	
}

async function main(){
	let ans;
	while(1){
		ans = await test();
		let request, response;
		switch(ans){
			case 'init':
				await steward.init();
				await gov.init();
				await hbank.init();
				await hstore.init();
				await alice.init();
			// 	break;
			// case 'onboarding':
				request = await steward.connectWithGov1();
				response = await gov.connectWithSteward1(request);
				await steward.connectWithGov1_1(response);
				request = await gov.connectWithSteward2();
				await steward.connectWithGov2(request);
				
				request = await steward.connectWithHbank1();
				response = await hbank.connectWithSteward1(request);
				await steward.connectWithHbank1_1(response);
				request = await hbank.connectWithSteward2();
				await steward.connectWithHbank2(request);

				request = await steward.connectWithHstore1();
				response = await hstore.connectWithSteward1(request);
				await steward.connectWithHstore1_1(response);
				request = await hstore.connectWithSteward2();
				await steward.connectWithHstore2(request);
			// 	break;
			// case 'schema':
				response = await gov.govSchema();
				await hbank.getSchemaId(response);
				await hbank.hbankSchema();
				await hstore.hstoreSchema();
				break;
			case 'govid':
				request = await gov.connectWithAlice1();
				response = await alice.connectWithGov1(request);
				await gov.connectWithAlice1_1(response);
				request = await gov.createCredentialOffer();
				response = await alice.createMasterSecret(request);
				response = await gov.createCredential(response);
				await alice.storeCredential(response);
				break;
			case 'receipt':
				request = await hbank.connectWithAlice1();
				response = await alice.connectWithHbank1(request);
				await hbank.connectWithAlice1_1(response);
				request = await hbank.createProofRequest();
				response = await alice.createProof(request);
				await hbank.verifyProof(response);
				break;
			// case 'order':
			// 	request = await hstore.connectWithAlice1();
			// 	response = await alice.connectWithGov1(request);
			// 	await hstore.connectWithAlice1_1(response);
			// 	request = await hstore.createCredentialOffer();
			// 	response = await alice.createMasterSecret(request);
			// 	response = await hstore.createCredential(response);
			// 	await alice.storeCredential(response);
			// 	break;
			case 'close':
				await steward.close();
				await gov.close();
				await hbank.close();
				await hstore.close();
				await alice.close();
				break;
		}
	}
}

main();
