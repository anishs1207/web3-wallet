"use client";

import { useState, useEffect, useCallback } from "react";
import "@/types";
import {
    Eye, EyeOff, Copy, CheckCheck,
    RefreshCw, TrendingUp, ArrowUpRight,
} from "lucide-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { formatEther, Contract } from "ethers";
import SendModal from "./SendModal";
import { useNetwork } from "./NetworkProvider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Token metadata ──────────────────────────────────────────────────────────
const SOL_TOKEN_METADATA: Record<string, { symbol: string; name: string }> = {
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: "USDC", name: "USD Coin" },
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { symbol: "USDT", name: "Tether" },
    So11111111111111111111111111111111111111112: { symbol: "wSOL", name: "Wrapped SOL" },
    mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: { symbol: "mSOL", name: "Marinade SOL" },
    JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: { symbol: "JUP", name: "Jupiter" },
};

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
];

const ETH_TOKENS = [
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", decimals: 6 },
    { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD", decimals: 6 },
];

interface TokenBalance { symbol: string; name: string; balance: string; mint?: string; address?: string; }
interface BalanceState { native: string | null; tokens: TokenBalance[]; loading: boolean; error: string | null; }

// ─── Component ───────────────────────────────────────────────────────────────
export default function AccountCard({ account, chain, onRemove }: { account: AccountInfo; chain: "solana" | "ethereum"; onRemove?: (acc: AccountInfo) => void }) {
    const { solanaConnection, ethereumProvider } = useNetwork();
    const isSolana = chain === "solana";
    const [showPrivKey, setShowPrivKey] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showSend, setShowSend] = useState(false);
    const [balance, setBalance] = useState<BalanceState>({ native: null, tokens: [], loading: false, error: null });

    async function copy(text: string, field: string) {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    }

    const fetchSolanaBalances = useCallback(async () => {
        setBalance(b => ({ ...b, loading: true, error: null }));
        try {
            const pubkey = new PublicKey(account.address);
            const lamports = await solanaConnection.getBalance(pubkey);
            const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID });
            const tokens: TokenBalance[] = [];
            for (const { account: ta } of tokenAccounts.value) {
                const parsed = ta.data.parsed?.info;
                if (!parsed) continue;
                const mint: string = parsed.mint;
                const rawAmount: number = parsed.tokenAmount?.uiAmount ?? 0;
                if (rawAmount === 0) continue;
                const meta = SOL_TOKEN_METADATA[mint];
                tokens.push({
                    symbol: meta?.symbol ?? mint.slice(0, 5) + "…",
                    name: meta?.name ?? "Unknown Token",
                    balance: rawAmount.toLocaleString(undefined, { maximumFractionDigits: 4 }),
                    mint,
                });
            }
            tokens.sort((a, b) => (!!SOL_TOKEN_METADATA[b.mint ?? ""] ? 1 : 0) - (!!SOL_TOKEN_METADATA[a.mint ?? ""] ? 1 : 0));
            setBalance({ native: (lamports / 1e9).toFixed(6), tokens, loading: false, error: null });
        } catch (err) {
            setBalance(b => ({ ...b, loading: false, error: err instanceof Error ? err.message : "RPC error" }));
        }
    }, [account.address, solanaConnection]);

    const fetchEthBalances = useCallback(async () => {
        setBalance(b => ({ ...b, loading: true, error: null }));
        try {
            const rawBal = await ethereumProvider.getBalance(account.address);
            const tokens: TokenBalance[] = [];
            for (const token of ETH_TOKENS) {
                try {
                    const contract = new Contract(token.address, ERC20_ABI, ethereumProvider);
                    const rawTokenBal: bigint = await contract.balanceOf(account.address);
                    const divisor = BigInt(10 ** token.decimals);
                    const uiAmount = Number(rawTokenBal / divisor) + Number(rawTokenBal % divisor) / (10 ** token.decimals);
                    if (uiAmount === 0) continue;
                    tokens.push({ symbol: token.symbol, name: token.name, balance: uiAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }), address: token.address });
                } catch { /* skip */ }
            }
            setBalance({ native: parseFloat(formatEther(rawBal)).toFixed(6), tokens, loading: false, error: null });
        } catch (err) {
            setBalance(b => ({ ...b, loading: false, error: err instanceof Error ? err.message : "RPC error" }));
        }
    }, [account.address, ethereumProvider]);

    const fetchBalances = useCallback(() => isSolana ? fetchSolanaBalances() : fetchEthBalances(), [isSolana, fetchSolanaBalances, fetchEthBalances]);
    useEffect(() => { fetchBalances(); }, [fetchBalances]);

    // colours
    const accent = isSolana
        ? {
            ring: "ring-violet-500/20",
            dotClass: "bg-violet-500 dark:bg-violet-400",
            badgeClass: "bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/20 dark:border-violet-500/25",
            sendBtn: "border-violet-500/20 dark:border-violet-500/30 text-violet-600 dark:text-violet-300 hover:bg-violet-500/10 dark:hover:bg-violet-500/15"
        }
        : {
            ring: "ring-sky-500/20",
            dotClass: "bg-sky-500 dark:bg-sky-400",
            badgeClass: "bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/20 dark:border-sky-500/25",
            sendBtn: "border-sky-500/20 dark:border-sky-500/30 text-sky-600 dark:text-sky-300 hover:bg-sky-500/10 dark:hover:bg-sky-500/15"
        };

    const nativeSymbol = isSolana ? "SOL" : "ETH";

    return (
        <>
            {showSend && <SendModal account={account} chain={chain} onClose={() => setShowSend(false)} />}

            <Card className={`border-border/60 bg-card/70 backdrop-blur-sm ring-1 ${accent.ring} transition-all hover:ring-2`}>
                <CardHeader className="pb-3">
                    {/* ── Top row ── */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${accent.dotClass} shadow-[0_0_6px_2px] shadow-current opacity-80`} />
                            <span className="text-sm font-semibold text-foreground">Account {account.index + 1}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {account.isImported && (
                                <Badge variant="secondary" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                    Imported
                                </Badge>
                            )}
                            <Badge variant="outline" className={`text-[10px] font-semibold px-2 ${accent.badgeClass}`}>
                                {nativeSymbol}
                            </Badge>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className={`h-7 gap-1 px-2.5 text-xs font-medium ${accent.sendBtn}`}
                                        onClick={() => setShowSend(true)}
                                    >
                                        <ArrowUpRight className="h-3 w-3" /> Send
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send {nativeSymbol} or tokens</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        onClick={fetchBalances}
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${balance.loading ? "animate-spin" : ""}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Refresh balances</TooltipContent>
                            </Tooltip>
                            {account.isImported && onRemove && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                                            onClick={() => onRemove(account)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remove imported account</TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* ── Balance panel ── */}
                    <div className="rounded-lg border border-border/50 bg-muted/40 p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Balances</span>
                        </div>

                        {balance.loading && (
                            <div className="space-y-1.5 pt-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        )}

                        {balance.error && !balance.loading && (
                            <p className="text-xs text-destructive">⚠ {balance.error}</p>
                        )}

                        {!balance.loading && balance.native !== null && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{nativeSymbol}</span>
                                    <span className="font-mono text-sm font-bold text-foreground">
                                        {balance.native}
                                        <span className="ml-1 text-[10px] font-normal text-muted-foreground">{nativeSymbol}</span>
                                    </span>
                                </div>
                                {balance.tokens.length > 0 && (
                                    <>
                                        <Separator className="opacity-30" />
                                        {balance.tokens.map(t => (
                                            <div key={t.mint ?? t.address} className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">{t.name}</span>
                                                <span className="font-mono text-xs font-semibold text-foreground">
                                                    {t.balance}
                                                    <span className="ml-1 font-normal text-muted-foreground">{t.symbol}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {balance.tokens.length === 0 && (
                                    <p className="text-[11px] text-muted-foreground/60">No token balances found</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Address ── */}
                    <KeyRow
                        label="Address"
                        value={account.address}
                        fieldKey={`addr-${account.index}`}
                        copiedField={copiedField}
                        onCopy={copy}
                    />

                    {/* ── Public Key ── */}
                    <KeyRow
                        label="Public Key"
                        value={account.publicKey}
                        fieldKey={`pub-${account.index}`}
                        copiedField={copiedField}
                        onCopy={copy}
                    />

                    {/* ── Private Key ── */}
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Private Key</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 truncate rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 font-mono text-xs text-foreground">
                                {showPrivKey ? account.privateKey : "•".repeat(32)}
                            </code>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPrivKey(v => !v)}
                                    >
                                        {showPrivKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{showPrivKey ? "Hide" : "Show"} private key</TooltipContent>
                            </Tooltip>
                            {showPrivKey && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                            onClick={() => copy(account.privateKey, `priv-${account.index}`)}
                                        >
                                            {copiedField === `priv-${account.index}`
                                                ? <CheckCheck className="h-3.5 w-3.5 text-green-400" />
                                                : <Copy className="h-3.5 w-3.5" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy private key</TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

// ── Shared key row ────────────────────────────────────────────────────────────
function KeyRow({ label, value, fieldKey, copiedField, onCopy }: {
    label: string;
    value: string;
    fieldKey: string;
    copiedField: string | null;
    onCopy: (text: string, field: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 font-mono text-xs text-foreground">
                    {value}
                </code>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => onCopy(value, fieldKey)}
                        >
                            {copiedField === fieldKey
                                ? <CheckCheck className="h-3.5 w-3.5 text-green-400" />
                                : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy {label.toLowerCase()}</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}
