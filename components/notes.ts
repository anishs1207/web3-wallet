import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import nacl from "tweetnacl";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";

/*
STEPS:
1. Generate a random seed phrase for themselves
2. create multiple solana wallets(ETH wallets also maybe)
3. let the user see theier solan abalnce
4. let the user see their USDC/other token balances

User Wallet
   ├── Send SOL → Solana RPC only
   ├── Check balances → Solana RPC only
   └── Swap tokens → Jupiter API + Solana RPC

BONUS
1. User can send SOL to someone else => make it work

2. User can swap their SOL for some other token (USDC)

Good example - 
https://github.com/keshav-exe/projekt-kosh
https://wallet-kosh.vercel.app/

*/

// generates a 12 word mnemonic
// 1. Generate a random seed phrase for themselves
const mnemonic = generateMnemonic();

console.log("Generated Menemonic", mnemonic);

const seed = mnemonicToSeedSync(mnemonic);

// these are the accounts here
// for all the solana accounts (accoint-1,2,3 etc created here)
for (let i = 0; i < 4; i++) {
    // this is the derivation path
    const path = `m/44'/501'/${i}'/0'`;

    // dervidedSeed for the given solana account here
    const derivedSeed = derivePath(path, seed.toString("hex")).key;

    // derive the private key & pblic key fro the given accouns ghere done
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed);

    // print it
    console.log("Public key", Keypair.fromSecretKey(secret.secretKey).publicKey.toBase58());
    // make it base57 see there
    console.log("Private Key", Buffer.from(secret.secretKey).toString("base64"));
}

// for the eth wallet generated here
for (let i = 0; i < 4; i++) {
    const path = `m/44'/60'/${i}/0'`;
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed);
}


// find the accounts here

const connection = new Connection("https://api.mainnet-beta.solana.com");

const mnemonic = "your seed phrase here";

const seed = mnemonicToSeedSync(mnemonic);

async function findAccounts() {

    for (let i = 0; i < 20; i++) {

        const path = `m/44'/501'/${i}'/0'`;

        const derivedSeed = derivePath(path, seed.toString("hex")).key;

        const secret = nacl.sign.keyPair.fromSeed(derivedSeed);

        const keypair = Keypair.fromSecretKey(secret.secretKey);

        const pubkey = keypair.publicKey;

        const balance = await connection.getBalance(pubkey);

        console.log("Account", i);
        console.log("Address:", pubkey.toBase58());
        console.log("Balance:", balance / 1e9, "SOL");
        console.log("-----------");
    }
}

findAccounts();

// and for the eth accoutnshere:
import { mnemonicToSeedSync } from "bip39";
import { HDNodeWallet } from "ethers";

const mnemonic = "your mnemonic here";

for (let i = 0; i < 4; i++) {

    const path = `m/44'/60'/0'/0/${i}`;

    const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path);

    console.log("Account", i);
    console.log("Address:", wallet.address);
    console.log("Private key:", wallet.privateKey);
    console.log("--------------");
}

// user to check the balance here:

import { Keypair, Connection } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");

// your base64 private key
const privateKeyBase64 = "YOUR_PRIVATE_KEY_HERE";

// convert to Uint8Array
const secretKey = Uint8Array.from(
    Buffer.from(privateKeyBase64, "base64")
);

// create keypair
const keypair = Keypair.fromSecretKey(secretKey);

// get public address
const address = keypair.publicKey.toBase58();

console.log("Address:", address);

// get balance
const balanceLamports = await connection.getBalance(keypair.publicKey);

const balanceSOL = balanceLamports / 1e9;

console.log("Balance:", balanceSOL, "SOL");

import { Wallet, JsonRpcProvider, formatEther } from "ethers";

const provider = new JsonRpcProvider(
    "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
);

// private key
const privateKey = "0xYOUR_PRIVATE_KEY";

// create wallet
const wallet = new Wallet(privateKey, provider);

console.log("Address:", wallet.address);

// get balance
const balanceWei = await provider.getBalance(wallet.address);

console.log("Balance:", formatEther(balanceWei), "ETH");

// Wallet Address
//     ├── SOL balance(native)
//     ├── Token Account → USDC balance
//     ├── Token Account → USDT balance
//     ├── Token Account → BONK balance
//     └── Token Account → others

import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const connection = new Connection("https://api.mainnet-beta.solana.com");

async function getTokenBalances(walletAddress) {

    const publicKey = new PublicKey(walletAddress);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
            programId: TOKEN_PROGRAM_ID
        }
    );

    console.log("Token balances:\n");

    tokenAccounts.value.forEach((accountInfo) => {

        const tokenData =
            accountInfo.account.data.parsed.info;

        const mint = tokenData.mint;

        const balance =
            tokenData.tokenAmount.uiAmount;

        const decimals =
            tokenData.tokenAmount.decimals;

        console.log("Token Mint:", mint);
        console.log("Balance:", balance);
        console.log("Decimals:", decimals);
        console.log("--------------------");

    });
}

getTokenBalances("USER_PUBLIC_KEY_HERE");

import {
    Connection,
    Keypair,
    PublicKey
} from "@solana/web3.js";

import {
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";

const connection =
    new Connection("https://api.mainnet-beta.solana.com");

async function getWalletBalances(privateKeyBase64) {

    const secretKey = Uint8Array.from(
        Buffer.from(privateKeyBase64, "base64")
    );

    const keypair =
        Keypair.fromSecretKey(secretKey);

    const publicKey =
        keypair.publicKey;

    console.log("Wallet:", publicKey.toBase58());

    // SOL balance
    const solBalance =
        await connection.getBalance(publicKey);

    console.log("SOL:", solBalance / 1e9);

    // Token balances
    const tokens =
        await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_PROGRAM_ID }
        );

    tokens.value.forEach((t) => {

        const info =
            t.account.data.parsed.info;

        console.log(
            "Token:",
            info.mint
        );

        console.log(
            "Balance:",
            info.tokenAmount.uiAmount
        );

    });
}