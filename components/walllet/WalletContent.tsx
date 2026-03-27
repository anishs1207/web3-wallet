"use client";

import { useState, useEffect } from "react";
import { generateMnemonic, validateMnemonic } from "bip39";
import { Wallet, Download, Sparkles, ShieldAlert, Lock, Plus, Key, Book, CreditCard } from "lucide-react";
// @ts-expect-error: bs58 might not have types in some environments or configurations
import bs58 from "bs58";
import { ethers } from "ethers";
import { Keypair } from "@solana/web3.js";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ChainSection from "./ChainSelection";
import deriveAccounts from "@/lib/deriveAccounts";
import AddressBookModal from "./AddressBookModal";
import FiatOnRampModal from "./FiatOnRampModal";

type Mode = "choose" | "gen-show" | "gen-verify" | "import" | "success";

export default function WalletContent() {
    const [mnemonic, setMnemonic] = useState("");
    const [words, setWords] = useState<string[]>([]);
    const [mode, setMode] = useState<Mode>("choose");
    const [verifyInput, setVerifyInput] = useState<string[]>([]);
    const [importLength, setImportLength] = useState<12 | 24>(12);
    const [importWords, setImportWords] = useState<string[]>(new Array(12).fill(""));
    const [error, setError] = useState("");
    const [accounts, setAccounts] = useState<WalletAccounts | null>(null);
    const [importedAccounts, setImportedAccounts] = useState<WalletAccounts>({ solana: [], ethereum: [] });
    const [activeChain, setActiveChain] = useState<"solana" | "ethereum">("solana");
    const [keyInput, setKeyInput] = useState("");
    const [showKeyImport, setShowKeyImport] = useState(false);
    const [showAddressBook, setShowAddressBook] = useState(false);
    const [showFiatOnRamp, setShowFiatOnRamp] = useState(false);

    // ── Persistence ──────────────────────────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem("vaulta_imported");
        if (saved) {
            try { setImportedAccounts(JSON.parse(saved)); } catch { /* ignore */ }
        }
        const savedMnemonic = localStorage.getItem("vaulta_mnemonic");
        if (savedMnemonic) {
            setMnemonic(savedMnemonic);
            setAccounts(deriveAccounts(savedMnemonic));
            setMode("success");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("vaulta_imported", JSON.stringify(importedAccounts));
    }, [importedAccounts]);

    useEffect(() => {
        if (mnemonic) localStorage.setItem("vaulta_mnemonic", mnemonic);
        else localStorage.removeItem("vaulta_mnemonic");
    }, [mnemonic]);

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
        const mnemonicText = importWords.map(w => w.trim()).join(" ");
        const wordsArr = mnemonicText.split(/\s+/).filter(Boolean);

        if (wordsArr.length !== importLength) {
            setError(`Please enter all ${importLength} words.`);
            return;
        }

        if (!validateMnemonic(mnemonicText)) {
            setError("Invalid seed phrase — please check your words.");
            return;
        }

        setMnemonic(mnemonicText);
        setAccounts(deriveAccounts(mnemonicText));
        setMode("success");
        setError("");
    }

    function updateImportWord(i: number, val: string) {
        if (val.includes(" ")) {
            const pastedWords = val.split(/\s+/).filter(Boolean);
            const up = [...importWords];
            pastedWords.forEach((word, index) => {
                if (i + index < importLength) {
                    up[i + index] = word.toLowerCase();
                }
            });
            setImportWords(up);
            return;
        }
        const up = [...importWords];
        up[i] = val.trim().toLowerCase();
        setImportWords(up);
    }

    function changeImportLength(len: 12 | 24) {
        setImportLength(len);
        setImportWords(new Array(len).fill(""));
        setError("");
    }

    // ── Import Single Key ──────────────────────────────────────────────────
    function handleImportKey() {
        const val = keyInput.trim();
        if (!val) { setError("Please enter a private key."); return; }

        try {
            if (activeChain === "solana") {
                // Try as base58 (most common for Solana)
                let secretKey: Uint8Array;
                try {
                    secretKey = bs58.decode(val);
                } catch {
                    // Try as base64
                    try {
                        secretKey = Uint8Array.from(Buffer.from(val, "base64"));
                    } catch {
                        throw new Error("Invalid Solana private key format (use Base58 or Base64)");
                    }
                }

                if (secretKey.length !== 64) throw new Error("Invalid Solana secret key length");

                const kp = Keypair.fromSecretKey(secretKey);
                const newAcc: AccountInfo = {
                    index: importedAccounts.solana.length,
                    address: kp.publicKey.toBase58(),
                    publicKey: kp.publicKey.toBase58(),
                    privateKey: Buffer.from(secretKey).toString("base64"),
                    isImported: true,
                };

                if (importedAccounts.solana.some(a => a.address === newAcc.address)) throw new Error("Account already imported");

                setImportedAccounts(prev => ({ ...prev, solana: [...prev.solana, newAcc] }));
            } else {
                // Ethereum
                const wallet = new ethers.Wallet(val);
                const newAcc: AccountInfo = {
                    index: importedAccounts.ethereum.length,
                    address: wallet.address,
                    publicKey: wallet.signingKey.publicKey,
                    privateKey: wallet.privateKey,
                    isImported: true,
                };

                if (importedAccounts.ethereum.some(a => a.address === newAcc.address)) throw new Error("Account already imported");

                setImportedAccounts(prev => ({ ...prev, ethereum: [...prev.ethereum, newAcc] }));
            }

            setKeyInput("");
            setShowKeyImport(false);
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid private key.");
        }
    }

    function handleRemoveAccount(acc: AccountInfo) {
        if (!acc.isImported) return;
        setImportedAccounts(prev => ({
            solana: prev.solana.filter(a => a.address !== acc.address),
            ethereum: prev.ethereum.filter(a => a.address !== acc.address),
        }));
    }

    // ── Reset ───────────────────────────────────────────────────────────────
    function handleReset() {
        setMode("choose");
        setMnemonic("");
        setWords([]);
        setVerifyInput([]);
        setImportWords(new Array(12).fill(""));
        setImportLength(12);
        setAccounts(null);
        setError("");
        localStorage.removeItem("vaulta_mnemonic");
    }

    function handleClearAll() {
        handleReset();
        setImportedAccounts({ solana: [], ethereum: [] });
        localStorage.removeItem("vaulta_imported");
    }

    const wordCount = importWords.filter(w => w.trim() !== "").length;

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
                                        className="group flex flex-col items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/5 dark:bg-violet-500/8 p-6 text-center transition-all hover:bg-violet-500/10 dark:hover:bg-violet-500/15 hover:border-violet-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 dark:bg-violet-500/20 ring-1 ring-violet-500/30 group-hover:bg-violet-500/30 transition-colors">
                                            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">New Wallet</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">Generate a fresh seed phrase</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setMode("import"); setError(""); }}
                                        className="group flex flex-col items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/8 p-6 text-center transition-all hover:bg-sky-500/10 dark:hover:bg-sky-500/15 hover:border-sky-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 dark:bg-sky-500/20 ring-1 ring-sky-500/30 group-hover:bg-sky-500/30 transition-colors">
                                            <Download className="h-5 w-5 text-sky-600 dark:text-sky-300" />
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
                                    <Alert className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                                        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
                                    <Alert className="border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300">
                                        <Lock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                        <AlertDescription className="text-xs">
                                            Your seed phrase is processed entirely in your browser. Nothing is sent to any server.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                                Recovery Phrase
                                            </label>
                                            <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
                                                {[12, 24].map((len) => (
                                                    <button
                                                        key={len}
                                                        onClick={() => changeImportLength(len as 12 | 24)}
                                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${importLength === len
                                                            ? "bg-primary text-primary-foreground shadow-sm"
                                                            : "text-muted-foreground hover:text-foreground"}`}
                                                    >
                                                        {len} words
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                            {importWords.map((word, i) => (
                                                <div key={i} className="relative">
                                                    <Input
                                                        value={word}
                                                        onChange={e => updateImportWord(i, e.target.value)}
                                                        placeholder={`${i + 1}`}
                                                        className="pl-7 font-mono text-xs h-9"
                                                        spellCheck={false}
                                                        autoComplete="off"
                                                    />
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                                                        {i + 1}.
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-muted-foreground">
                                                {wordCount} / {importLength} words entered
                                            </p>
                                            {wordCount === importLength && (
                                                <Badge variant="default" className="bg-green-500/10 dark:bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 text-[10px]">
                                                    ✓ Complete
                                                </Badge>
                                            )}
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
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddressBook(true)}>
                                <Book className="h-3.5 w-3.5" /> Contacts
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-700 dark:text-green-400" onClick={() => setShowFiatOnRamp(true)}>
                                <CreditCard className="h-3.5 w-3.5" /> Buy
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleReset}>
                                + New / Import
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Are you sure? This will wipe ALL data including imported keys.")) handleClearAll(); }}>
                                Clear All
                            </Button>
                        </div>
                    </div>

                    {/* Warning */}
                    <Alert className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-xs">
                            Keep your private keys safe. Never share them. Anyone with access to a private key controls that account permanently.
                        </AlertDescription>
                    </Alert>

                    {/* Chain tabs — shadcn Tabs */}
                    <div className="flex items-center justify-between">
                        <Tabs
                            value={activeChain}
                            onValueChange={(v) => setActiveChain(v as "solana" | "ethereum")}
                            className="w-fit"
                        >
                            <TabsList>
                                <TabsTrigger value="solana" className="gap-1.5">
                                    <span>◎</span> Solana
                                </TabsTrigger>
                                <TabsTrigger value="ethereum" className="gap-1.5">
                                    <span>Ξ</span> Ethereum
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10"
                            onClick={() => { setShowKeyImport(true); setError(""); }}
                        >
                            <Plus className="h-3 w-3" /> Import Private Key
                        </Button>
                    </div>

                    {showKeyImport && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Key className="h-4 w-4" /> Import {activeChain === "solana" ? "Solana" : "Ethereum"} Key
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="py-3 px-4 space-y-3">
                                <div className="space-y-1.5">
                                    <Input
                                        value={keyInput}
                                        onChange={e => { setKeyInput(e.target.value); setError(""); }}
                                        placeholder={activeChain === "solana" ? "Base58 Private Key..." : "0x... Hex Private Key"}
                                        className="font-mono text-xs"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Imported keys are stored only in your local browser storage.
                                    </p>
                                </div>
                                {error && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertDescription className="text-[10px]">{error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => setShowKeyImport(false)}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" className="flex-[2] text-xs" onClick={handleImportKey}>
                                        Import Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Tabs value={activeChain} className="w-full">
                        <TabsContent value="solana" className="mt-0">
                            <ChainSection
                                accounts={[...(accounts?.solana ?? []), ...importedAccounts.solana]}
                                chain="solana"
                                onRemove={handleRemoveAccount}
                            />
                        </TabsContent>
                        <TabsContent value="ethereum" className="mt-0">
                            <ChainSection
                                accounts={[...(accounts?.ethereum ?? []), ...importedAccounts.ethereum]}
                                chain="ethereum"
                                onRemove={handleRemoveAccount}
                            />
                        </TabsContent>
                    </Tabs>

                    {showAddressBook && (
                        <AddressBookModal onClose={() => setShowAddressBook(false)} />
                    )}

                    {showFiatOnRamp && (
                        <FiatOnRampModal onClose={() => setShowFiatOnRamp(false)} />
                    )}
                </div>
            )}
        </main>
    );
}