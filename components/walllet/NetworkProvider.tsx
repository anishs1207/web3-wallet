"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import {
    SolanaNetwork,
    EthereumNetwork,
    getSolanaConnection,
    getEthereumProvider
} from "@/lib/networks";
import { Connection } from "@solana/web3.js";
import { JsonRpcProvider } from "ethers";

interface NetworkContextType {
    solanaNetwork: SolanaNetwork;
    setSolanaNetwork: (net: SolanaNetwork) => void;
    ethereumNetwork: EthereumNetwork;
    setEthereumNetwork: (net: EthereumNetwork) => void;
    solanaConnection: Connection;
    ethereumProvider: JsonRpcProvider;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [solanaNetwork, setSolanaNetwork] = useState<SolanaNetwork>("mainnet-beta");
    const [ethereumNetwork, setEthereumNetwork] = useState<EthereumNetwork>("mainnet");

    const solanaConnection = useMemo(() => getSolanaConnection(solanaNetwork), [solanaNetwork]);
    const ethereumProvider = useMemo(() => getEthereumProvider(ethereumNetwork), [ethereumNetwork]);

    const value = {
        solanaNetwork,
        setSolanaNetwork,
        ethereumNetwork,
        setEthereumNetwork,
        solanaConnection,
        ethereumProvider
    };

    return (
        <NetworkContext.Provider value={value}>
            {children}
        </NetworkContext.Provider>
    );
}

export function useNetwork() {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error("useNetwork must be used within a NetworkProvider");
    }
    return context;
}
