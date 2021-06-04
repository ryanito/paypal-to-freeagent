# Introduction

The script will take a CSV file (generated with PayPal reports) and upload the transactions to the FreeAgent bank account(s) you specify in `.env`.

I created this script for two reasons:

- As a workaround for FreeAgent's built-in de-duplication (to prevent missing transactions)
- To better support multi-currency bank accounts (one upload for all currencies)

FreeAgent's built-in de-duplication uses three key pieces of information - Date, Amount and Description. If these are identical on more than one transaction, FreeAgent will view this as a potential duplicate. However, this can cause missing transactions in FreeAgent bank accounts where de-duplication is removing **different** transactions that have the same Date, Amount and Description.

This script uses the transaction ID to create unique descriptions that won't be de-duplicated by FreeAgent.

FreeAgent does not fully support multi-currency bank accounts (at the time of writing), so they recommend that you add a separate bank account for each currency that you hold (see "A word on PayPal" at https://www.freeagent.com/blog/multi-currency-banking-arrives/)

You can specify multiple FreeAgent bank accounts as a comma-separated string in `.env`, e.g. `FREEAGENT_BANK_ACCOUNT_ID="123,456"`. The script will loop through these accounts and import transactions that match the bank account's currency.

# Installation

1. Make sure you have `node` and `npm` installed
2. `npm install`
3. Copy `.env.example` to `.env` and populate each value.

# Usage

`node index.js [file.csv]`

![terminal](https://user-images.githubusercontent.com/7041605/120565828-d1e10e00-c405-11eb-9cb0-3b07e1524eb7.gif)

Go to your FreeAgent account and the transactions will be in the bank account(s), ready to be explained/confirmed.
