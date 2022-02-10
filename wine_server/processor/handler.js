const { TransactionHandler } = require("sawtooth-sdk/processor/handler");
const { InvalidTransaction } = require("sawtooth-sdk/processor/exceptions");

const { createHash } = require("crypto");

const _hash = (input, length) =>
	createHash("sha512")
		.update(input)
		.digest("hex")
		.toLowerCase()
		.slice(0, length);

const TP_FAMILY = "winegeo";
const TP_NAMESPACE = _hash(TP_FAMILY, 6);
const TP_VERSION = "1.0";
class Handler extends TransactionHandler {
	constructor() {
		super(TP_FAMILY, [TP_VERSION], [TP_NAMESPACE]);
	}

	apply(txn, context) {
		let payload = null;
		try {
			payload = JSON.parse(txn.payload.toString());
		} catch (err) {
			throw new InvalidTransaction("Failed to decode payload: " + err);
		}

		const action = payload.action;
		const address = `${TP_NAMESPACE}${_hash(payload.wID, 16)}${_hash(payload.bID,48)}`;

		if (action === "CREATE_BATCH") {
			return create_batch(context, payload, address).catch((error) => {
				console.log(error);
			});
		} else if (action === "UPDATE_BATCH") {
			return update_batch(context, payload, address).catch((error) => {
				console.log(error);
			});
		} else if (action === "DELETE_BATCH") {
			return delete_batch(context, address).catch((error) =>{
				console.log(error);
			})
		} else {
			throw new InvalidTransaction("Unknown action: " + action);
		}
	}
}
const create_batch = (context, payload, address) => {
	return context.getState([address]).then((state) => {
		if (state[address].length > 0) {			//if there exists any data at map state[address]
			throw "Wine Batch already exists!";
		}
		let wineBatch = create_wineBatch(payload);
		let entries = {
			[address]: Buffer.from(new String(JSON.stringify(wineBatch))),
		};
		return context.setState(entries);
	});
};
const update_batch = (context, payload, address) => {
	return context.getState([address]).then((state) => {
		console.log(state[address].length);
		if (state[address].length === 0) {
			throw "No Batch to update!";
		}
		let wineBatch = update_wineBatch(payload, state[address]);
		let entries = {
			[address]: Buffer.from(new String(JSON.stringify(wineBatch))),
		};
		return context.setState(entries);
	});
};
const delete_batch = (context, address) => {
	return context.getState([address]).then((state) => {
		console.log(state[address].length);
		if (state[address].length === 0) {
			throw "No Batch to delete!";
		}
		return context.deleteState([address]);
	});
};

const create_wineBatch = (payload) => {
	let nLAT = {
		"location": payload.location,
		"time": payload.time
	};
	let init = [];
	init.push(nLAT);
	let wineBatch = {
		wID: payload.wID,
		bID: payload.bID,
		ledger: init,
	};
	console.log(wineBatch);
	return wineBatch;
};

const update_wineBatch = (payload, state) => {	//Expects the payload and the utf-8 encoded information from state[address]
	let nLAT = {
		"location": payload.location,
		"time": payload.time
	};
	let plainState = decodeURIComponent( escape ( state ) );	//decode from utf8, antiquated
	let oldLedger = plainState.ledger;
	let newLedger = oldLedger.push(nLAT);
	let wineBatch = {
		wID: payload.wID,
		bID: payload.bID,
		ledger: newLedger,
	};
	console.log(wineBatch);
	return wineBatch;
};
/*
const create_wineBatch = (payload) => {
	let wineBatch = {

		wID: payload.wID,
		status: payload.value.status,
		batch_name: payload.value.batch_name,
		wine_name: payload.value.wine_name,
		num_bottles: payload.value.num_bottles,
		style: payload.value.style,
		alcohol: payload.value.alcohol,
		ava: payload.value.ava,
		acidity: payload.value.acidity,
		grape_variety: payload.value.grape_variety,
		harvest_loc: payload.value.harvest_loc,
		harvest_date: payload.value.harvest_date,
		bottle_date: payload.value.bottle_date,
		avg_sunshine: payload.value.avg_sunshine,
		avg_temp: payload.value.avg_temp,
		tannins: payload.value.tannins,
		comments: payload.value.comments
	};
	console.log(wineBatch);
	return wineBatch;
};
*/

module.exports = Handler;
