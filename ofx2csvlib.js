const ofx = require("./ofx");

function parseDate(str) {
  y = str.slice(0,4);
  m = str.slice(4,6);
  d = str.slice(6,8);
  return `${y}-${m}-${d}`;
}

let generateTableFromOfx = async function(ofxString, insertBalanceAssertion = true) {
    let quotedkeys = [];
    let lines = [];
    let records = [];

    await ofx.parse(ofxString).then(ofxData => {
          let bankAccounts = null;
          if (ofxData.OFX.BANKMSGSRSV1)
          {
              bankAccounts = ofxData.OFX.BANKMSGSRSV1.STMTTRNRS;
          }
          else if (ofxData.OFX.CREDITCARDMSGSRSV1)
          {
              bankAccounts = ofxData.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS;
          }
          else
          {
              throw "File is not a bank or credit card statement or may be formatted in an unexpected way.";
          }

          // Default set of normal columns. Some files contain more, they will end up at the end
          let keys = ['ACCTID', 'ACCTTYPE', 'TRNTYPE', 'DTPOSTED', 'TRNAMT', 'NAME', 'MEMO', 'FITID', 'CHECKNUM', 'BALAMT'];
          quotedkeys = keys.map(key => '"'+key+'"');

          if (!bankAccounts[0])
          {
            bankAccounts = [bankAccounts];
          }

          bankAccounts.forEach(bankAccount => {

            let acct = null;
            if (bankAccount.STMTRS)
            {
                acct = bankAccount.STMTRS;
            }
            else if (bankAccount.CCSTMTRS.BANKTRANLIST)
            {
                acct = bankAccount.CCSTMTRS;
            }

            let list = acct.BANKTRANLIST;
            let acctinfo = null;
            if (acct.BANKACCTFROM)
            {
                acctinfo = acct.BANKACCTFROM;
            }
            else if (acct.CCACCTFROM)
            {
                acctinfo = acct.CCACCTFROM;
            }

            let acctId = null;
            let acctType = null;
        	if (acctinfo.ACCTID)
            {
                acctId = acctinfo.ACCTID;
            }
            else
            {
                acctId = "unknown";
            }
        	if (acctinfo.ACCTTYPE)
            {
                acctType = acctinfo.ACCTTYPE;
            }
            else
            {
                acctType = "unknown";
            }


            if (list) {
              // Convert to array if only one entry
              if(!list.STMTTRN[0]) {
                list.STMTTRN = [list.STMTTRN];
              }

              // Process keys
              Object.values(list.STMTTRN).forEach((t) => {

                // Not all transactions contain the same keys, we want our CSV
                // to have the same values in the same columns so we start logging
                // new keys (at set positions) as we come across them
                Object.keys(t).forEach(k => {
                  if(typeof(t[k]) == "string" && keys.indexOf(k) === -1) {
                    keys.push(k);
                    quotedkeys.push("\""+k.replace("\"", "\"\"")+"\"");
                  }
                });
              });

              // Process data
              Object.values(list.STMTTRN).forEach((t) => {

                // Change date format to be more human readable and SQL-ready
                t.DTPOSTED = parseDate(t.DTPOSTED);
              
                t.ACCTID = acctId;
                t.ACCTTYPE = acctType;

                // This means memo is redundant. Reduce spam
                if (t.NAME && t.MEMO && t.NAME == t.MEMO)
                {
                    t.MEMO = "";
                }

                // Push at the correct location
                let line = [];
                keys.forEach(key => {
                  let val = "";
                  if (t[key])
                  {
                    val = t[key];
                  }
                  line.push("\""+val.replace("\"", "\"\"")+"\"");
                });

                lines.push(line.join(","));
                records.push(line);
              });
            }

            if (insertBalanceAssertion && acct.LEDGERBAL)
            {
                let line = [];
                keys.forEach(key => {
                  let val = "";
                  if (key == "NAME")
                  {
                    val = "Balance assertion";
                  }
                  else if (key == "DTPOSTED")
                  {
                    val = parseDate(acct.LEDGERBAL.DTASOF);
                  }
                  else if (key == "BALAMT")
                  {
                    val = acct.LEDGERBAL.BALAMT;
                  }
                  else if (key == "ACCTID")
                  {
                    val = acctId;
                  }
                  else if (key == "ACCTTYPE")
                  {
                    val = acctType;
                  }
                  else if (key == "TRNAMT")
                  {
                    val = "0.00";
                  }
                  line.push("\""+val.replace("\"", "\"\"")+"\"");
                });

                lines.push(line.join(","));
                records.push(line);
            }
          });

    });
  return {lines, records, keys: quotedkeys};
};

window.generateTableFromOfx = generateTableFromOfx;
