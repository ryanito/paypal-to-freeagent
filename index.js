require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const csv = require('@fast-csv/parse');
const prompts = require('prompts');

const {
    FREEAGENT_CLIENT_ID,
    FREEAGENT_CLIENT_SECRET,
    FREEAGENT_REFRESH_TOKEN,
    FREEAGENT_BANK_ACCOUNT_ID,
} = process.env;

// The CSV file
const file = process.argv[2];

if (!file || !file.toLowerCase().endsWith(".csv")) {
    console.log("Exiting...");
    process.exit(1);
}

// Prompt confirmation message
let message;

FREEAGENT_BANK_ACCOUNT_ID.split(",").forEach(function (bankAccount) {
    go(bankAccount).catch(error => {
        console.error(error);
    });
});

async function go(bankAccount) {

    const accessToken = (await (await fetch(`https://api.freeagent.com/v2/token_endpoint`, {
        headers: {
            "Authorization": `Basic ${Buffer.from(`${FREEAGENT_CLIENT_ID}:${FREEAGENT_CLIENT_SECRET}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(FREEAGENT_REFRESH_TOKEN)}`,
    })).json()).access_token;

    const res1 = await fetch(`https://api.freeagent.com/v2/bank_accounts/${bankAccount}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        }
    });

    const acc = await res1.json();
    let currency = acc.bank_account.currency;

    let statement = [];

    fs.createReadStream(file)
        .pipe(csv.parse({headers: true}))
        .transform(data => ({
            dated_on: `${data.Date.split("/")[2]}-${data.Date.split("/")[1]}-${data.Date.split("/")[0]}`,
            description: `${data.Type}` + (data.Name ? (data.Name !== "PayPal" ? (data.Net < 0 ? ` to ${data.Name}` : ` from ${data.Name}`) : '') : '') + ` (${data['Transaction ID']})`,
            amount: data.Net.replace(',', ''),
            fitid: data['Transaction ID'],
            transaction_type: data['Balance Impact'].toUpperCase(),
            currency: data.Currency
        }))
        .on('error', error => console.error(error))
        .on('data', row => {
            // Filter by currency of FA account
            if (row.currency == currency) {
                delete row.currency;
                statement.push(row)
            }
        })
        .on('end', count => { // Done!

            if (!message) {
                message = `Found ${statement.length} ${currency} transactions from ${statement[0].dated_on} to ${statement[statement.length - 1].dated_on}. Ready to upload?`;
            } else {
                message = message.slice(0, -18) + ` and ${statement.length} ${currency} transactions from ${statement[0].dated_on} to ${statement[statement.length - 1].dated_on}. Ready to upload?`;
            }

            const question = {
                type: 'confirm',
                name: 'confirmed',
                message: message,
            };

            (async () => {
                const response = await prompts(question);
                if (response.confirmed) { // Upload!

                    const res1 = await fetch(`https://api.freeagent.com/v2/bank_transactions/statement?bank_account=${bankAccount}`, {
                        headers: {
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        method: "POST",
                        body: JSON.stringify({ statement: statement }),
                    });

                    if (res1.ok) {
                        console.log(`${statement.length} ${currency} transactions uploaded.`);
                    } else {
                        console.log(await res2.json());
                    }

                } else {
                    console.log("Exiting...");
                    process.exit(1);
                }
            })();
        });

}
