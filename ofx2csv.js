const ofx2csv = require("./ofx2csvlib");
const fs = require("fs");
const process = require("process");


fs.readFile(process.argv[2], "utf8", async function(err, ofxString) {
  let insertBalanceAssertion = true;

  const table = await ofx2csv.generateTableFromOfx(ofxString, insertBalanceAssertion);

  console.log(table.quotedkeys.join(","));
  console.log(table.lines.join("\n"));
});
