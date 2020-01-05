const express = require('express');
const app = express();
const port = 8000;

const steward = require('./_steward');
const alice = require('./_alice');
const government = require('./_government');

app.get('/', (req, res) => res.send('Hello World!'));
app.get('/init', async (req, res) => {
	await init();
	res.send('PASS!');
    }
);

app.get('/test/', async (req, res) => {
	let test;
	test = await steward.connectWithGovernment1();
	console.log(test);
	res.send(test);
    }
);

app.listen(port, () => console.log(`Listening on port ${port}!`));

async function init(){
    await steward.init();
    await alice.init();
    await government.init();
    console.log("init complete");
    return;
}
