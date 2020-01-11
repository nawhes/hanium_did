const express = require('express');
const app = express();
const port = 8000;

const steward = require('./_steward');
const alice = require('./_alice');
const government = require('./_government');

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
				await alice.init();
				await government.init();
				break;
			case 'onboarding':
				request = await steward.connectWithGovernment1();
				response = await government.connectWithSteward1(request);
				await steward.connectWithGovernment1_1(response);
				request = await government.connectWithSteward2();
				await steward.connectWithGovernment2(request);

				request = await government.connectWithAlice1();
				response = await alice.connectWithGovernment1(request);
				await government.connectWithAlice1_1(response);
				break;
			case 'schema':
				await government.governmentSchema();
				break;
			case 'run':
				request = await government.createCredentialOffer();
				response = await alice.createMasterSecret(request);
				response = await government.createCredential(response);
				await alice.storeCredential(response);
				break;
			case 'close':
				await steward.close();
				await alice.close();
				await government.close();
		}
	}
}

main();
