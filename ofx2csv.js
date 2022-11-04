const ofx2csv = require("./ofx2csvlib");
const fs = require("fs");
const process = require("process");


fs.readFile(process.argv[2], "utf8", async function(err, ofxString) {
  const table = await ofx2csv.generateTableFromOfx(ofxString);

  console.log(table.keys.join(","));
  console.log(table.lines.join("\n"));
});
