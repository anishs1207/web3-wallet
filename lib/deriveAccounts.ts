import nacl from "tweetnacl";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { HDNodeWallet } from "ethers";
import { mnemonicToSeedSync } from "bip39";

export default function deriveAccounts(mnemonic: string): WalletAccounts {
  const seed = mnemonicToSeedSync(mnemonic);

  // Solana (ed25519, BIP44 coin type 501)
  const solanaAccounts: AccountInfo[] = [];
  for (let i = 0; i < 4; i++) {
    const path = `m/44'/501'/${i}'/0'`;
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed);
    const solKeypair = Keypair.fromSecretKey(keyPair.secretKey);
    solanaAccounts.push({
      index: i,
      address: solKeypair.publicKey.toBase58(),
      publicKey: solKeypair.publicKey.toBase58(),
      privateKey: Buffer.from(keyPair.secretKey).toString("base64"),
    });
  }

  // Ethereum (secp256k1, BIP44 coin type 60)
  const ethereumAccounts: AccountInfo[] = [];
  for (let i = 0; i < 4; i++) {
    const path = `m/44'/60'/0'/0/${i}`;
    const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path);
    ethereumAccounts.push({
      index: i,
      address: wallet.address,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
    });
  }

  return { solana: solanaAccounts, ethereum: ethereumAccounts };
}
