"use client";

import "@/types";
import AccountCard from "./AccountCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ChainSection({
    accounts,
    chain,
}: {
    accounts: AccountInfo[];
    chain: "solana" | "ethereum";
}) {
    const isSolana = chain === "solana";

    return (
        <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-base ring-1 ${isSolana ? "bg-violet-500/15 ring-violet-500/30" : "bg-sky-500/15 ring-sky-500/30"}`}>
                    {isSolana ? "◎" : "Ξ"}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                            {isSolana ? "Solana" : "Ethereum"} Accounts
                        </h3>
                        <Badge variant="secondary" className="text-[10px]">
                            {accounts.length}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {isSolana ? "ED25519 · BIP44 coin 501" : "secp256k1 · BIP44 coin 60"}
                    </p>
                </div>
            </div>

            <Separator className="opacity-30" />

            {/* Account cards */}
            <div className="space-y-3">
                {accounts.map(acc => (
                    <AccountCard key={acc.index} account={acc} chain={chain} />
                ))}
            </div>
        </div>
    );
}
