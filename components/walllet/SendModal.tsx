"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, ExternalLink, AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";
import "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

// ── Solana ──────────────────────────────────────────────────────────────────
import {
    Keypair, PublicKey, SystemProgram,
    Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction, createTransferInstruction,
    getMint, getAccount,
} from "@solana/spl-token";

// ── Ethereum ────────────────────────────────────────────────────────────────
import { Wallet, Contract, parseEther, parseUnits } from "ethers";
import { useNetwork } from "./NetworkProvider";
import { SOLANA_NETWORKS, ETHEREUM_NETWORKS } from "@/lib/networks";

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function transfer(address to, uint256 amount) returns (bool)",
];

// ── Token catalogues ─────────────────────────────────────────────────────────
const KNOWN_SOL_TOKENS = [
    { id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", name: "USD Coin", decimals: 6 },
    { id: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT", name: "Tether USD", decimals: 6 },
    { id: "So11111111111111111111111111111111111111112", symbol: "wSOL", name: "Wrapped SOL", decimals: 9 },
    { id: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", symbol: "mSOL", name: "Marinade SOL", decimals: 9 },
    { id: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", symbol: "JUP", name: "Jupiter", decimals: 6 },
];

const KNOWN_ETH_TOKENS = [
    { id: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", decimals: 6 },
    { id: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD", decimals: 6 },
    { id: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
    { id: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", name: "Wrapped BTC", decimals: 8 },
];

interface TokenOption { id: string; symbol: string; name: string; decimals: number; isNative: boolean; }
type TxStatus = "idle" | "loading" | "success" | "error";

interface Props { account: AccountInfo; chain: "solana" | "ethereum"; onClose: () => void; }

// ── Component ────────────────────────────────────────────────────────────────
export default function SendModal({ account, chain, onClose }: Props) {
    const { solanaConnection, ethereumProvider, solanaNetwork, ethereumNetwork } = useNetwork();
    const isSolana = chain === "solana";

    const baseTokens: TokenOption[] = isSolana
        ? [{ id: "native", symbol: "SOL", name: "Solana", decimals: 9, isNative: true }, ...KNOWN_SOL_TOKENS.map(t => ({ ...t, isNative: false }))]
        : [{ id: "native", symbol: "ETH", name: "Ethereum", decimals: 18, isNative: true }, ...KNOWN_ETH_TOKENS.map(t => ({ ...t, isNative: false }))];

    const [selectedToken, setSelectedToken] = useState<TokenOption>(baseTokens[0]);
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [customAddr, setCustomAddr] = useState("");
    const [customInfo, setCustomInfo] = useState<TokenOption | null>(null);
    const [customLooking, setCustomLooking] = useState(false);
    const [customErr, setCustomErr] = useState("");
    const [showCustom, setShowCustom] = useState(false);
    const [status, setStatus] = useState<TxStatus>("idle");
    const [txHash, setTxHash] = useState("");
    const [txError, setTxError] = useState("");

    useEffect(() => {
        setSelectedToken(baseTokens[0]);
        setShowCustom(false);
        setCustomAddr("");
        setCustomInfo(null);
        setCustomErr("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chain]);

    // ── Custom token lookup ──────────────────────────────────────────────────
    const lookupCustomToken = useCallback(async () => {
        const addr = customAddr.trim();
        if (!addr) return;
        setCustomLooking(true); setCustomErr(""); setCustomInfo(null);
        try {
            if (isSolana) {
                const mintPk = new PublicKey(addr);
                const mintInfo = await getMint(solanaConnection, mintPk);
                const known = KNOWN_SOL_TOKENS.find(t => t.id === addr);
                setCustomInfo({ id: addr, symbol: known?.symbol ?? addr.slice(0, 4) + "…" + addr.slice(-4), name: known?.name ?? "SPL Token", decimals: mintInfo.decimals, isNative: false });
            } else {
                const contract = new Contract(addr, ERC20_ABI, ethereumProvider);
                const [sym, name, dec]: [string, string, bigint] = await Promise.all([contract.symbol(), contract.name(), contract.decimals()]);
                setCustomInfo({ id: addr, symbol: sym, name, decimals: Number(dec), isNative: false });
            }
        } catch {
            setCustomErr(isSolana ? "Not a valid Solana mint address." : "Not a valid ERC-20 contract address.");
        } finally {
            setCustomLooking(false);
        }
    }, [customAddr, ethereumProvider, isSolana, solanaConnection]);

    // ── Send ─────────────────────────────────────────────────────────────────
    async function handleSend() {
        setTxError("");
        if (!recipient.trim()) { setTxError("Enter a recipient address."); return; }
        const numAmt = parseFloat(amount);
        if (!amount || isNaN(numAmt) || numAmt <= 0) { setTxError("Enter a valid amount."); return; }
        setStatus("loading");
        try {
            if (isSolana) await sendSolana();
            else await sendEthereum();
            setStatus("success");
        } catch (e: unknown) {
            setTxError(e instanceof Error ? e.message : "Transaction failed.");
            setStatus("error");
        }
    }

    async function sendSolana() {
        const keypair = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(account.privateKey, "base64")));
        const recipientPk = new PublicKey(recipient.trim());
        const tx = new Transaction();
        if (selectedToken.isNative) {
            tx.add(SystemProgram.transfer({ fromPubkey: keypair.publicKey, toPubkey: recipientPk, lamports: Math.round(parseFloat(amount) * LAMPORTS_PER_SOL) }));
        } else {
            const mintPk = new PublicKey(selectedToken.id);
            const senderATA = getAssociatedTokenAddressSync(mintPk, keypair.publicKey);
            const recipientATA = getAssociatedTokenAddressSync(mintPk, recipientPk);
            try { await getAccount(solanaConnection, recipientATA); }
            catch { tx.add(createAssociatedTokenAccountInstruction(keypair.publicKey, recipientATA, recipientPk, mintPk)); }
            tx.add(createTransferInstruction(senderATA, recipientATA, keypair.publicKey, BigInt(Math.round(parseFloat(amount) * 10 ** selectedToken.decimals)), [], TOKEN_PROGRAM_ID));
        }
        setTxHash(await sendAndConfirmTransaction(solanaConnection, tx, [keypair]));
    }

    async function sendEthereum() {
        const wallet = new Wallet(account.privateKey, ethereumProvider);
        if (selectedToken.isNative) {
            const tx = await wallet.sendTransaction({ to: recipient.trim(), value: parseEther(amount) });
            const r = await tx.wait(); setTxHash(r?.hash ?? tx.hash);
        } else {
            const contract = new Contract(selectedToken.id, ERC20_ABI, wallet);
            const tx = await contract.transfer(recipient.trim(), parseUnits(amount, selectedToken.decimals));
            const r = await tx.wait(); setTxHash(r?.hash ?? tx.hash);
        }
    }

    const explorerUrl = isSolana
        ? `${SOLANA_NETWORKS[solanaNetwork].explorerUrl}/tx/${txHash}`
        : `${ETHEREUM_NETWORKS[ethereumNetwork].explorerUrl}/tx/${txHash}`;

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md max-h-[92dvh] overflow-y-auto border-border/60 bg-card/95 backdrop-blur-md">
                <DialogHeader>
                    <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ring-1 ${isSolana ? "bg-violet-500/10 dark:bg-violet-500/15 ring-violet-500/30" : "bg-sky-500/10 dark:bg-sky-500/15 ring-sky-500/30"}`}>
                            <Send className={`h-4 w-4 ${isSolana ? "text-violet-600 dark:text-violet-400" : "text-sky-600 dark:text-sky-400"}`} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm">Send Tokens</DialogTitle>
                            <DialogDescription className="text-xs">
                                {isSolana ? "◎ Solana" : "Ξ Ethereum"} · Account {account.index + 1}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* ── SUCCESS ─────────────────────────────────────────────── */}
                {status === "success" && (
                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
                            <CheckCircle2 className="h-8 w-8 text-green-400" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground">Transaction sent!</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                <span className="font-mono text-foreground">{amount} {selectedToken.symbol}</span>
                                {" → "}
                                <span className="font-mono">{recipient.slice(0, 6)}…{recipient.slice(-4)}</span>
                            </p>
                        </div>
                        {txHash && (
                            <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
                                View on {isSolana ? "Solscan" : "Etherscan"} <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                        <Button className="w-full" onClick={onClose}>Done</Button>
                    </div>
                )}

                {/* ── FORM ────────────────────────────────────────────────── */}
                {status !== "success" && (
                    <div className="space-y-4 pt-2">

                        {/* From */}
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">From</p>
                            <code className="block truncate rounded-md border border-border/60 bg-muted/40 px-3 py-2 font-mono text-xs text-foreground">
                                {account.address}
                            </code>
                        </div>

                        <Separator className="opacity-30" />

                        {/* Token picker */}
                        <div className="space-y-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Token</p>

                            <div className="flex flex-wrap gap-1.5">
                                {baseTokens.map(tok => (
                                    <button
                                        key={tok.id}
                                        onClick={() => { setSelectedToken(tok); setShowCustom(false); }}
                                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedToken.id === tok.id && !showCustom
                                            ? (isSolana ? "border-violet-500/50 bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200" : "border-sky-500/50 bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-200")
                                            : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"}`}
                                    >
                                        {tok.symbol}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowCustom(v => !v)}
                                    className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${showCustom
                                        ? (isSolana ? "border-violet-500/50 bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200" : "border-sky-500/50 bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-200")
                                        : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"}`}
                                >
                                    <Search className="h-3 w-3" /> Custom
                                </button>
                            </div>

                            {/* Custom token panel */}
                            {showCustom && (
                                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground">
                                        {isSolana ? "SPL mint address" : "ERC-20 contract address (0x…)"}
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            value={customAddr}
                                            onChange={e => { setCustomAddr(e.target.value); setCustomInfo(null); setCustomErr(""); }}
                                            placeholder={isSolana ? "EPjFWdd5…" : "0xA0b869…"}
                                            className="font-mono text-xs"
                                            spellCheck={false}
                                        />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={lookupCustomToken}
                                            disabled={customLooking || !customAddr.trim()}
                                        >
                                            {customLooking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Look up"}
                                        </Button>
                                    </div>
                                    {customErr && (
                                        <p className="flex items-center gap-1 text-xs text-destructive">
                                            <AlertCircle className="h-3 w-3" /> {customErr}
                                        </p>
                                    )}
                                    {customInfo && (
                                        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                                            <div>
                                                <p className="text-xs font-bold text-foreground">
                                                    {customInfo.symbol}
                                                    <Badge variant="secondary" className="ml-2 text-[10px]">{customInfo.decimals}d</Badge>
                                                </p>
                                                <p className="text-xs text-muted-foreground">{customInfo.name}</p>
                                            </div>
                                            <Button size="sm" onClick={() => { setSelectedToken(customInfo); setShowCustom(false); setCustomAddr(""); setCustomInfo(null); }}>
                                                Use
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Active token info */}
                            {!showCustom && (
                                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                                    <span className="text-xs text-muted-foreground">Sending:</span>
                                    <span className="text-xs font-semibold text-foreground">{selectedToken.symbol}</span>
                                    <span className="text-xs text-muted-foreground/50">—</span>
                                    <span className="truncate font-mono text-xs text-muted-foreground max-w-[150px]">
                                        {selectedToken.isNative ? selectedToken.name : `${selectedToken.id.slice(0, 10)}…`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Recipient */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Recipient Address
                            </label>
                            <Input
                                value={recipient}
                                onChange={e => setRecipient(e.target.value)}
                                placeholder={isSolana ? "Solana address (base58)…" : "0x… Ethereum address"}
                                className="font-mono text-xs"
                                spellCheck={false}
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Amount
                            </label>
                            <div className="relative">
                                <Input
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    type="number"
                                    min="0"
                                    step="any"
                                    className="pr-14 font-mono"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                    {selectedToken.symbol}
                                </span>
                            </div>
                        </div>

                        {/* Warning */}
                        <Alert className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                            <AlertDescription className="text-xs">
                                ⚠️ Transactions are <strong>irreversible</strong>. Double-check the address and amount.
                            </AlertDescription>
                        </Alert>

                        {/* TX Error */}
                        {(txError || status === "error") && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    {txError || "Transaction failed. Check your balance."}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* CTA */}
                        <Button className="w-full" onClick={handleSend} disabled={status === "loading"}>
                            {status === "loading"
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Broadcasting…</>
                                : <><Send className="mr-2 h-4 w-4" /> Send {selectedToken.symbol}</>
                            }
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
