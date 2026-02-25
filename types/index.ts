interface AccountInfo {
  index: number;
  address: string;
  publicKey: string;
  privateKey: string;
  isImported?: boolean;
}

interface WalletAccounts {
  solana: AccountInfo[];
  ethereum: AccountInfo[];
}
