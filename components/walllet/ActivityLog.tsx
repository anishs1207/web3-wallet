"use client";

import { useState, useEffect, useCallback } from "react";
import { History, ExternalLink, ArrowDownLeft, ArrowUpRight, Loader2, Info } from "lucide-react";
import { useNetwork } from "./NetworkProvider";
import { SOLANA_NETWORKS, ETHEREUM_NETWORKS } from "@/lib/networks";
import { Button } from "@/components/ui/button";

interface Transaction {
    hash: string;
    type: "send" | "receive" | "unknown";
    amount?: string;
    symbol?: string;
    timestamp: number;
    success: boolean;
    from: string;
    to: string;
}

interface Props {
    address: string;
    chain: "solana" | "ethereum";
}

export default function ActivityLog({ address, chain }: Props) {
    const { solanaConnection, solanaNetwork, ethereumNetwork } = useNetwork();
    const [txs, setTxs] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            if (chain === "solana") {
                const sigs = await solanaConnection.getSignaturesForAddress(new (await import("@solana/web3.js")).PublicKey(address), { limit: 10 });
                const parsedTxs: Transaction[] = sigs.map(s => ({
                    hash: s.signature,
                    type: "unknown", // Details would require getParsedTransaction which is expensive/slow
                    timestamp: (s.blockTime ?? 0) * 1000,
                    success: s.err === null,
                    from: "...",
                    to: "...",
                }));
                setTxs(parsedTxs);
            } else {
                // For Ethereum, we'd ideally use an indexer. Placeholder logic for now.
                setTxs([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [address, chain, solanaConnection]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const explorerBase = chain === "solana"
        ? SOLANA_NETWORKS[solanaNetwork].explorerUrl
        : ETHEREUM_NETWORKS[ethereumNetwork].explorerUrl;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <History className="h-3 w-3" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest">Recent Activity</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={fetchHistory} disabled={loading}>
                    <Loader2 className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {loading && txs.length === 0 && (
                    <div className="py-8 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto opacity-20" />
                    </div>
                )}

                {!loading && txs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/50 border border-dashed border-border/50 rounded-lg">
                        <Info className="h-5 w-5 mb-1 opacity-20" />
                        <p className="text-[10px]">No recent transactions found</p>
                    </div>
                )}

                {txs.map(tx => (
                    <div key={tx.hash} className="flex items-center justify-between rounded-lg border border-border/40 bg-card/40 p-2.5 transition-colors hover:border-primary/30">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${tx.success ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
                                {tx.type === "receive" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-foreground">
                                    {tx.type === "unknown" ? "Transaction" : tx.type === "send" ? "Sent" : "Received"}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-mono">
                                    {new Date(tx.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                </p>
                            </div>
                        </div>
                        <a href={`${explorerBase}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
