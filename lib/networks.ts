import { Connection } from "@solana/web3.js";
import { JsonRpcProvider } from "ethers";

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";
export type EthereumNetwork = "mainnet" | "sepolia";

export interface NetworkConfig {
    name: string;
    rpcUrl: string;
    explorerUrl: string;
}

export const SOLANA_NETWORKS: Record<SolanaNetwork, NetworkConfig> = {
    "mainnet-beta": {
        name: "Mainnet Beta",
        rpcUrl: "https://api.mainnet-beta.solana.com",
        explorerUrl: "https://solscan.io",
    },
    "devnet": {
        name: "Devnet",
        rpcUrl: "https://api.devnet.solana.com",
        explorerUrl: "https://solscan.io/?cluster=devnet",
    },
    "testnet": {
        name: "Testnet",
        rpcUrl: "https://api.testnet.solana.com",
        explorerUrl: "https://solscan.io/?cluster=testnet",
    },
};

export const ETHEREUM_NETWORKS: Record<EthereumNetwork, NetworkConfig> = {
    "mainnet": {
        name: "Ethereum Mainnet",
        rpcUrl: "https://eth.llamarpc.com",
        explorerUrl: "https://etherscan.io",
    },
    "sepolia": {
        name: "Sepolia Testnet",
        rpcUrl: "https://rpc.sepolia.org",
        explorerUrl: "https://sepolia.etherscan.io",
    },
};

export function getSolanaConnection(network: SolanaNetwork) {
    return new Connection(SOLANA_NETWORKS[network].rpcUrl, { commitment: "confirmed" });
}

export function getEthereumProvider(network: EthereumNetwork) {
    return new JsonRpcProvider(ETHEREUM_NETWORKS[network].rpcUrl);
}
