"use client";

import { useNetwork } from "./NetworkProvider";
import { SOLANA_NETWORKS, ETHEREUM_NETWORKS, SolanaNetwork, EthereumNetwork } from "@/lib/networks";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, ChevronDown } from "lucide-react";

export default function NetworkSwitcher({ chain }: { chain: "solana" | "ethereum" }) {
    const { solanaNetwork, setSolanaNetwork, ethereumNetwork, setEthereumNetwork } = useNetwork();
    const isSolana = chain === "solana";

    const currentNetworkName = isSolana
        ? SOLANA_NETWORKS[solanaNetwork].name
        : ETHEREUM_NETWORKS[ethereumNetwork].name;

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-muted/50 border-border/60 text-xs font-medium hover:bg-muted/80">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span>{currentNetworkName}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    {isSolana
                        ? Object.entries(SOLANA_NETWORKS).map(([id, net]) => (
                            <DropdownMenuItem
                                key={id}
                                onClick={() => setSolanaNetwork(id as SolanaNetwork)}
                                className={`text-xs ${solanaNetwork === id ? "bg-primary/10 text-primary" : ""}`}
                            >
                                {net.name}
                            </DropdownMenuItem>
                        ))
                        : Object.entries(ETHEREUM_NETWORKS).map(([id, net]) => (
                            <DropdownMenuItem
                                key={id}
                                onClick={() => setEthereumNetwork(id as EthereumNetwork)}
                                className={`text-xs ${ethereumNetwork === id ? "bg-primary/10 text-primary" : ""}`}
                            >
                                {net.name}
                            </DropdownMenuItem>
                        ))
                    }
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
