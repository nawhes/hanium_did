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
		switch(ans){
			case 'init':
				await steward.init();
				await alice.init();
				await government.init();
				break;
			case 'onboarding':
				let request;
				request = await steward.connectWithGovernment1();
				let response, governmentStewardDid;
				response = await government.connectWithSteward1(request);
				await steward.connectWithGovernment1_1(response);
				request = await government.connectWithSteward2();
				await steward.connectWithGovernment2(request);

				break;
			case 'schema':
				await government.governmentSchema();
			case 'getverinym':

				break;
			case 'close':
				await steward.close();
				await alice.close();
				await government.close();
			default:
				return;
		}
	}
}

main();
