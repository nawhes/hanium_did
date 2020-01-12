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
				break;
			case 'onboarding':
				request = await steward.connectWithGov1();
				response = await gov.connectWithSteward1(request);
				await steward.connectWithGov1_1(response);
				request = await gov.connectWithSteward2();
				await steward.connectWithGov2(request);
				
				request = await gov.connectWithHbank1();
				response = await hbank.connectWithGov1(request);
				await gov.connectWithHbank1_1(response);
				request = await hbank.connectWithGov2();
				await gov.connectWithHbank2(request);

				request = await gov.connectWithHstore1();
				response = await hstore.connectWithGov1(request);
				await gov.connectWithHstore1_1(response);
				request = await hstore.connectWithGov2();
				await gov.connectWithHstore2(request);
				break;
			case 'schema':
				await gov.govSchema();
				await hbank.hbankSchema();
				await hsotre.hstoreSchema();
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
				response = await alice.connectWithGov1(request);
				await hbank.connectWithAlice1_1(response);
				request = await hbank.createCredentialOffer();
				response = await alice.createMasterSecret(request);
				response = await hbank.createCredential(response);
				await alice.storeCredential(response);
				break;
			case 'order':
				request = await hstore.connectWithAlice1();
				response = await alice.connectWithGov1(request);
				await hstore.connectWithAlice1_1(response);
				request = await hstore.createCredentialOffer();
				response = await alice.createMasterSecret(request);
				response = await hstore.createCredential(response);
				await alice.storeCredential(response);
				break;
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
