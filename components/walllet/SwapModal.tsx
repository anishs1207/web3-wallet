"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDown, ExternalLink, AlertCircle, CheckCircle2, Loader2, Repeat } from "lucide-react";
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

import { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { useNetwork } from "./NetworkProvider";
import { SOLANA_NETWORKS } from "@/lib/networks";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const KNOWN_SOL_TOKENS = [
    { id: SOL_MINT, symbol: "SOL", name: "Solana", decimals: 9 },
    { id: USDC_MINT, symbol: "USDC", name: "USD Coin", decimals: 6 },
    { id: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT", name: "Tether USD", decimals: 6 },
    { id: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", symbol: "JUP", name: "Jupiter", decimals: 6 },
    { id: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", symbol: "mSOL", name: "Marinade SOL", decimals: 9 },
];

interface TokenOption { id: string; symbol: string; name: string; decimals: number; }
type Status = "idle" | "quoting" | "swapping" | "success" | "error";

interface Props { account: AccountInfo; onClose: () => void; }

export default function SwapModal({ account, onClose }: Props) {
    const { solanaConnection, solanaNetwork } = useNetwork();
    const isMainnet = solanaNetwork === "mainnet-beta";

    const [fromToken, setFromToken] = useState<TokenOption>(KNOWN_SOL_TOKENS[0]);
    const [toToken, setToToken] = useState<TokenOption>(KNOWN_SOL_TOKENS[1]);
    const [amount, setAmount] = useState("");
    const [quoteResponse, setQuoteResponse] = useState<any>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");
    const [txHash, setTxHash] = useState("");

    const fetchQuote = useCallback(async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setQuoteResponse(null);
            return;
        }

        setStatus("quoting");
        setError("");
        try {
            const rawAmount = Math.floor(parseFloat(amount) * Math.pow(10, fromToken.decimals));
            const url = `https://quote-api.jup.ag/v6/quote?inputMint=${fromToken.id}&outputMint=${toToken.id}&amount=${rawAmount}&slippageBps=50`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setQuoteResponse(data);
            setStatus("idle");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch quote");
            setStatus("error");
        }
    }, [amount, fromToken, toToken]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (amount && parseFloat(amount) > 0) fetchQuote();
        }, 500);
        return () => clearTimeout(timer);
    }, [amount, fromToken, toToken, fetchQuote]);

    async function handleSwap() {
        if (!quoteResponse) return;
        setStatus("swapping");
        setError("");

        try {
            // 1. Get swap transaction
            const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: account.address,
                    wrapAndUnwrapSol: true,
                }),
            });
            const { swapTransaction } = await swapRes.json();

            // 2. Deserialize and sign
            const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            const keypair = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(account.privateKey, "base64")));
            transaction.sign([keypair]);

            // 3. Execute
            const rawTx = transaction.serialize();
            const txid = await solanaConnection.sendRawTransaction(rawTx, {
                skipPreflight: true,
                maxRetries: 2,
            });

            setTxHash(txid);

            // Wait for confirmation
            const latestBlockHash = await solanaConnection.getLatestBlockhash();
            await solanaConnection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: txid,
            });

            setStatus("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Swap failed");
            setStatus("error");
        }
    }

    function switchTokens() {
        setFromToken(toToken);
        setToToken(fromToken);
        setAmount("");
        setQuoteResponse(null);
    }

    const outAmount = quoteResponse
        ? (parseInt(quoteResponse.outAmount) / Math.pow(10, toToken.decimals)).toFixed(6)
        : "0.00";

    const explorerUrl = `${SOLANA_NETWORKS[solanaNetwork].explorerUrl}/tx/${txHash}`;

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-md">
                <DialogHeader>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl ring-1 bg-violet-500/10 dark:bg-violet-500/15 ring-violet-500/30">
                            <Repeat className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm">Jupiter Swap</DialogTitle>
                            <DialogDescription className="text-xs">
                                Swap tokens instantly on Solana
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {!isMainnet && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            Jupiter API only supports <strong>Mainnet</strong>. Please switch network to Mainnet to use swaps.
                        </AlertDescription>
                    </Alert>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
                            <CheckCircle2 className="h-8 w-8 text-green-400" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground">Swap Successful!</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                <span className="font-mono text-foreground">{amount} {fromToken.symbol}</span>
                                {" → "}
                                <span className="font-mono text-foreground">{outAmount} {toToken.symbol}</span>
                            </p>
                        </div>
                        {txHash && (
                            <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
                                View on Solscan <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                        <Button className="w-full" onClick={onClose}>Done</Button>
                    </div>
                )}

                {status !== "success" && (
                    <div className="space-y-4 pt-2">
                        {/* FROM */}
                        <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">You Pay</span>
                                <div className="flex gap-1">
                                    {KNOWN_SOL_TOKENS.slice(0, 3).map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setFromToken(t)}
                                            className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${fromToken.id === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}
                                        >
                                            {t.symbol}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    type="number"
                                    className="border-none bg-transparent p-0 text-xl font-bold focus-visible:ring-0"
                                />
                                <Badge variant="outline" className="h-7 px-3 py-1 font-bold">
                                    {fromToken.symbol}
                                </Badge>
                            </div>
                        </div>

                        <div className="relative flex justify-center -my-3 z-10">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 rounded-full p-0 bg-background"
                                onClick={switchTokens}
                            >
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* TO */}
                        <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">You Receive (Est.)</span>
                                <div className="flex gap-1">
                                    {KNOWN_SOL_TOKENS.slice(0, 3).map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setToToken(t)}
                                            className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${toToken.id === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}
                                        >
                                            {t.symbol}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 text-xl font-bold py-1">
                                    {status === "quoting" ? "..." : outAmount}
                                </div>
                                <Badge variant="outline" className="h-7 px-3 py-1 font-bold">
                                    {toToken.symbol}
                                </Badge>
                            </div>
                        </div>

                        {quoteResponse && (
                            <div className="px-1 space-y-1">
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Price Impact</span>
                                    <span className={parseFloat(quoteResponse.priceImpactPct) > 1 ? "text-destructive" : "text-green-500"}>
                                        {parseFloat(quoteResponse.priceImpactPct).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Minimum Received</span>
                                    <span>{(parseInt(quoteResponse.otherAmountThreshold) / Math.pow(10, toToken.decimals)).toFixed(6)} {toToken.symbol}</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            className="w-full"
                            disabled={!isMainnet || !quoteResponse || status === "swapping" || status === "quoting"}
                            onClick={handleSwap}
                        >
                            {status === "swapping" ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Swapping...</>
                            ) : status === "quoting" ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding best price...</>
                            ) : (
                                <><Repeat className="mr-2 h-4 w-4" /> Swap Tokens</>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
