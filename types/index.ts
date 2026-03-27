interface AccountInfo {
  index: number;
  address: string;
  publicKey: string;
  privateKey: string;
  isImported?: boolean;
}

interface WalletAccounts { // eslint-disable-line @typescript-eslint/no-unused-vars
  solana: AccountInfo[];
  ethereum: AccountInfo[];
}
