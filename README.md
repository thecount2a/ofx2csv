# ofx2csv

This node JS script will convert an OFX/QFX file into a CSV file to be processed by other tools that only process CSV. It will also support multi-account OFX/QFX files and will include a column in the output CSV that indicates which account number each transaction originates from.

This package depends on one nodeJS package which can be installed like this:
```
npm i xml2js
```

The script can be invoked like this:

```
node ofx2csv.js OFXorQFXFILENAME > output.csv
```

This script adds an extra CSV line per-account which contains a value in the "BALAMT" column which can be used for automatically checking the current balance of an account to make sure no transactions have been duplicated or missed. If you don't want that behavior, feel free to change the line in ofx2csv.js which says: let insertBalanceAssertion = true;
