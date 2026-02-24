"use client";

import { useState } from "react";
import { generateMnemonic, validateMnemonic } from "bip39";
import { Wallet, Download, Sparkles, ShieldAlert, Lock } from "lucide-react";
import "@/types";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import ChainSection from "./ChainSelection";
import deriveAccounts from "@/lib/deriveAccounts";

type Mode = "choose" | "gen-show" | "gen-verify" | "import" | "success";

export default function WalletContent() {
    const [mnemonic, setMnemonic] = useState("");
    const [words, setWords] = useState<string[]>([]);
    const [mode, setMode] = useState<Mode>("choose");
    const [verifyInput, setVerifyInput] = useState<string[]>([]);
    const [importInput, setImportInput] = useState("");
    const [error, setError] = useState("");
    const [accounts, setAccounts] = useState<WalletAccounts | null>(null);
    const [activeChain, setActiveChain] = useState<"solana" | "ethereum">("solana");

    // ── Generate ────────────────────────────────────────────────────────────
    function handleGenerate() {
        const generated = generateMnemonic();
        const split = generated.split(" ");
        setMnemonic(generated);
        setWords(split);
        setVerifyInput(new Array(split.length).fill(""));
        setMode("gen-show");
        setError("");
    }

    function handleVerify() {
        if (verifyInput.join(" ").trim() === mnemonic) {
            setAccounts(deriveAccounts(mnemonic));
            setMode("success");
            setError("");
        } else {
            setError("Seed phrase doesn't match. Please check each word.");
        }
    }

    function updateVerifyInput(i: number, val: string) {
        const up = [...verifyInput];
        up[i] = val.trim();
        setVerifyInput(up);
    }

    // ── Import ──────────────────────────────────────────────────────────────
    function handleImport() {
        const trimmed = importInput.trim();
        if (!trimmed) { setError("Please paste your seed phrase."); return; }
        if (!validateMnemonic(trimmed)) { setError("Invalid seed phrase — check your words and spacing."); return; }
        setMnemonic(trimmed);
        setAccounts(deriveAccounts(trimmed));
        setMode("success");
        setError("");
    }

    // ── Reset ───────────────────────────────────────────────────────────────
    function handleReset() {
        setMode("choose");
        setMnemonic("");
        setWords([]);
        setVerifyInput([]);
        setImportInput("");
        setAccounts(null);
        setError("");
    }

    const wordCount = importInput.trim().split(/\s+/).filter(Boolean).length;

    return (
        <main className="mx-auto min-h-[calc(100dvh-8rem)] max-w-2xl px-4 py-10">

            {/* ── Pre-success ─────────────────────────────────────────────── */}
            {mode !== "success" && (
                <div className="space-y-4">
                    <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                                    <Wallet className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">
                                        {mode === "choose" && "Web3 Wallet"}
                                        {mode === "gen-show" && "Your Seed Phrase"}
                                        {mode === "gen-verify" && "Verify Seed Phrase"}
                                        {mode === "import" && "Import Existing Wallet"}
                                    </CardTitle>
                                    <CardDescription>
                                        {mode === "choose" && "Generate a fresh wallet or import via seed phrase"}
                                        {mode === "gen-show" && "Write down all 12 words in order — never share them"}
                                        {mode === "gen-verify" && "Re-enter your seed phrase to confirm you saved it"}
                                        {mode === "import" && "Your phrase is processed locally and never leaves your browser"}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5">

                            {/* ─ CHOOSE ─────────────────────────────────── */}
                            {mode === "choose" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleGenerate}
                                        className="group flex flex-col items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/8 p-6 text-center transition-all hover:bg-violet-500/15 hover:border-violet-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/30 group-hover:bg-violet-500/30 transition-colors">
                                            <Sparkles className="h-5 w-5 text-violet-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">New Wallet</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">Generate a fresh seed phrase</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setMode("import"); setError(""); }}
                                        className="group flex flex-col items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/8 p-6 text-center transition-all hover:bg-sky-500/15 hover:border-sky-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-500/30 group-hover:bg-sky-500/30 transition-colors">
                                            <Download className="h-5 w-5 text-sky-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Import Wallet</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">Use an existing seed phrase</p>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* ─ GEN: SHOW ──────────────────────────────── */}
                            {mode === "gen-show" && (
                                <>
                                    <Alert className="border-amber-500/30 bg-amber-500/8 text-amber-300">
                                        <ShieldAlert className="h-4 w-4 text-amber-400" />
                                        <AlertDescription className="text-xs">
                                            Write down these 12 words in order. Anyone with your seed phrase has full access to your wallets.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="grid grid-cols-3 gap-2">
                                        {words.map((word, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/50 px-3 py-2"
                                            >
                                                <span className="w-4 shrink-0 text-[10px] text-muted-foreground">{i + 1}.</span>
                                                <span className="font-mono text-sm text-foreground">{word}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() => setMode("gen-verify")}
                                    >
                                        I&apos;ve saved my phrase →
                                    </Button>
                                </>
                            )}

                            {/* ─ GEN: VERIFY ────────────────────────────── */}
                            {mode === "gen-verify" && (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Re-enter each word in the correct order to confirm.
                                    </p>

                                    <div className="grid grid-cols-3 gap-2">
                                        {verifyInput.map((value, i) => (
                                            <Input
                                                key={i}
                                                placeholder={`${i + 1}`}
                                                value={value}
                                                onChange={e => updateVerifyInput(i, e.target.value)}
                                                className="font-mono text-xs"
                                            />
                                        ))}
                                    </div>

                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription className="text-xs">{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setMode("gen-show")}>
                                            ← Back
                                        </Button>
                                        <Button className="flex-[2]" onClick={handleVerify}>
                                            Verify &amp; Create Wallet
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* ─ IMPORT ─────────────────────────────────── */}
                            {mode === "import" && (
                                <>
                                    <Alert className="border-sky-500/30 bg-sky-500/8 text-sky-300">
                                        <Lock className="h-4 w-4 text-sky-400" />
                                        <AlertDescription className="text-xs">
                                            Your seed phrase is processed entirely in your browser. Nothing is sent to any server.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                            Recovery Phrase (12 or 24 words)
                                        </label>
                                        <textarea
                                            value={importInput}
                                            onChange={e => { setImportInput(e.target.value); setError(""); }}
                                            placeholder="word1 word2 word3 …"
                                            rows={4}
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="none"
                                            className="w-full resize-none rounded-md border border-input bg-input/50 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                                        />
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">{wordCount} / 12 or 24 words</p>
                                            <Badge
                                                variant={wordCount === 12 || wordCount === 24 ? "default" : "secondary"}
                                                className="text-[10px]"
                                            >
                                                {wordCount === 12 || wordCount === 24 ? "✓ Valid length" : "Enter phrase"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription className="text-xs">{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={() => { setMode("choose"); setError(""); }}>
                                            ← Back
                                        </Button>
                                        <Button className="flex-[2]" onClick={handleImport}>
                                            Import Wallet
                                        </Button>
                                    </div>
                                </>
                            )}

                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── SUCCESS ─────────────────────────────────────────────────── */}
            {mode === "success" && accounts && (
                <div className="space-y-6">

                    {/* Page header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-foreground">Your Wallet</h1>
                                <p className="text-xs text-muted-foreground">4 accounts derived from your seed phrase</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleReset}>
                            + New / Import
                        </Button>
                    </div>

                    {/* Warning */}
                    <Alert className="border-amber-500/30 bg-amber-500/8 text-amber-300">
                        <ShieldAlert className="h-4 w-4 text-amber-400" />
                        <AlertDescription className="text-xs">
                            Keep your private keys safe. Never share them. Anyone with access to a private key controls that account permanently.
                        </AlertDescription>
                    </Alert>

                    {/* Chain tabs — shadcn Tabs */}
                    <Tabs
                        value={activeChain}
                        onValueChange={(v) => setActiveChain(v as "solana" | "ethereum")}
                    >
                        <TabsList className="w-fit">
                            <TabsTrigger value="solana" className="gap-1.5">
                                <span>◎</span> Solana
                            </TabsTrigger>
                            <TabsTrigger value="ethereum" className="gap-1.5">
                                <span>Ξ</span> Ethereum
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="solana" className="mt-5">
                            <ChainSection accounts={accounts.solana} chain="solana" />
                        </TabsContent>
                        <TabsContent value="ethereum" className="mt-5">
                            <ChainSection accounts={accounts.ethereum} chain="ethereum" />
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </main>
    );
}