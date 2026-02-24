interface AccountInfo {
  index: number;
  address: string;
  publicKey: string;
  privateKey: string;
}

interface WalletAccounts {
  solana: AccountInfo[];
  ethereum: AccountInfo[];
}
