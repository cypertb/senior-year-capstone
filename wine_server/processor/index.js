const { TransactionProcessor } = require("sawtooth-sdk/processor");

const WineHandler = require("./handler");

const transactionProcessor = new TransactionProcessor("tcp://localhost:4004");

transactionProcessor.addHandler(new WineHandler());
transactionProcessor.start();

console.log("Started Transaction Processor");