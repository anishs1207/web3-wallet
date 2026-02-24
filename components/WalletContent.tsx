"use client"

import { useState } from "react"
import { generateMnemonic, mnemonicToSeedSync } from "bip39"
import nacl from "tweetnacl"
import { derivePath } from "ed25519-hd-key"
import { Keypair } from "@solana/web3.js"
import { HDNodeWallet } from "ethers"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Copy, CheckCheck, Wallet } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountInfo {
    index: number
    address: string
    publicKey: string
    privateKey: string
}

interface WalletAccounts {
    solana: AccountInfo[]
    ethereum: AccountInfo[]
}

// ─── Key Derivation ───────────────────────────────────────────────────────────

function deriveAccounts(mnemonic: string): WalletAccounts {
    const seed = mnemonicToSeedSync(mnemonic)

    // Solana (ed25519, BIP44 coin type 501)
    const solanaAccounts: AccountInfo[] = []
    for (let i = 0; i < 4; i++) {
        const path = `m/44'/501'/${i}'/0'`
        const derivedSeed = derivePath(path, seed.toString("hex")).key
        const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed)
        const solKeypair = Keypair.fromSecretKey(keyPair.secretKey)
        solanaAccounts.push({
            index: i,
            address: solKeypair.publicKey.toBase58(),
            publicKey: solKeypair.publicKey.toBase58(),
            privateKey: Buffer.from(keyPair.secretKey).toString("base64"),
        })
    }

    // Ethereum (secp256k1, BIP44 coin type 60)
    const ethereumAccounts: AccountInfo[] = []
    for (let i = 0; i < 4; i++) {
        const path = `m/44'/60'/0'/0/${i}`
        const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path)
        ethereumAccounts.push({
            index: i,
            address: wallet.address,
            publicKey: wallet.publicKey,
            privateKey: wallet.privateKey,
        })
    }

    return { solana: solanaAccounts, ethereum: ethereumAccounts }
}

// ─── AccountCard ──────────────────────────────────────────────────────────────

function AccountCard({ account, chain }: { account: AccountInfo; chain: "solana" | "ethereum" }) {
    const [showPrivKey, setShowPrivKey] = useState(false)
    const [copiedField, setCopiedField] = useState<string | null>(null)

    async function copy(text: string, field: string) {
        await navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const accent = chain === "solana"
        ? { bg: "bg-purple-500/10", border: "border-purple-500/30", badge: "bg-purple-500/20 text-purple-300", dot: "bg-purple-400" }
        : { bg: "bg-blue-500/10", border: "border-blue-500/30", badge: "bg-blue-500/20 text-blue-300", dot: "bg-blue-400" }

    return (
        <div className={`rounded-xl border ${accent.border} ${accent.bg} p-4 space-y-3`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                    <span className="font-semibold text-sm text-white">Account {account.index + 1}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${accent.badge}`}>
                    {chain === "solana" ? "SOL" : "ETH"}
                </span>
            </div>

            {/* Address */}
            <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Address</p>
                <div className="flex items-center gap-2">
                    <code className="text-xs text-zinc-200 bg-zinc-900/60 rounded-lg px-2 py-1.5 flex-1 truncate font-mono">
                        {account.address}
                    </code>
                    <button
                        onClick={() => copy(account.address, `addr-${account.index}`)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all"
                    >
                        {copiedField === `addr-${account.index}` ? <CheckCheck size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                </div>
            </div>

            {/* Public Key */}
            <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Public Key</p>
                <div className="flex items-center gap-2">
                    <code className="text-xs text-zinc-200 bg-zinc-900/60 rounded-lg px-2 py-1.5 flex-1 truncate font-mono">
                        {account.publicKey}
                    </code>
                    <button
                        onClick={() => copy(account.publicKey, `pub-${account.index}`)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all"
                    >
                        {copiedField === `pub-${account.index}` ? <CheckCheck size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                </div>
            </div>

            {/* Private Key */}
            <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Private Key</p>
                <div className="flex items-center gap-2">
                    <code className="text-xs text-zinc-200 bg-zinc-900/60 rounded-lg px-2 py-1.5 flex-1 truncate font-mono">
                        {showPrivKey ? account.privateKey : "••••••••••••••••••••••••••••••••"}
                    </code>
                    <button
                        onClick={() => setShowPrivKey(v => !v)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all"
                        title={showPrivKey ? "Hide private key" : "Show private key"}
                    >
                        {showPrivKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    {showPrivKey && (
                        <button
                            onClick={() => copy(account.privateKey, `priv-${account.index}`)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all"
                        >
                            {copiedField === `priv-${account.index}` ? <CheckCheck size={13} className="text-green-400" /> : <Copy size={13} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── ChainSection ─────────────────────────────────────────────────────────────

function ChainSection({ accounts, chain }: { accounts: AccountInfo[]; chain: "solana" | "ethereum" }) {
    const isSolana = chain === "solana"
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${isSolana ? "bg-purple-500/20" : "bg-blue-500/20"}`}>
                    {isSolana ? "◎" : "Ξ"}
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">{isSolana ? "Solana" : "Ethereum"} Accounts</h3>
                    <p className="text-xs text-zinc-400">{isSolana ? "ED25519 · BIP44 coin 501" : "secp256k1 · BIP44 coin 60"}</p>
                </div>
            </div>
            <div className="space-y-3">
                {accounts.map(acc => (
                    <AccountCard key={acc.index} account={acc} chain={chain} />
                ))}
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WalletContent() {
    const [mnemonic, setMnemonic] = useState("")
    const [words, setWords] = useState<string[]>([])
    const [step, setStep] = useState<"idle" | "show" | "verify" | "success">("idle")
    const [userInput, setUserInput] = useState<string[]>([])
    const [error, setError] = useState("")
    const [accounts, setAccounts] = useState<WalletAccounts | null>(null)
    const [activeChain, setActiveChain] = useState<"solana" | "ethereum">("solana")

    function handleGenerate() {
        const generated = generateMnemonic()
        const splitWords = generated.split(" ")
        setMnemonic(generated)
        setWords(splitWords)
        setUserInput(new Array(splitWords.length).fill(""))
        setStep("show")
        setError("")
    }

    function handleVerify() {
        const joined = userInput.join(" ").trim()
        if (joined === mnemonic) {
            const derived = deriveAccounts(mnemonic)
            setAccounts(derived)
            setStep("success")
            setError("")
        } else {
            setError("Seed phrase does not match. Please try again.")
        }
    }

    function updateInput(index: number, value: string) {
        const newInputs = [...userInput]
        newInputs[index] = value.trim()
        setUserInput(newInputs)
    }

    return (
        <div className="flex justify-center items-start min-h-screen p-6 pt-12 bg-zinc-950">

            {/* ── Idle / Show / Verify steps ── */}
            {step !== "success" && (
                <Card className="w-full max-w-xl bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <Wallet size={18} className="text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-white">Create Wallet</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Generate and verify your secret recovery phrase
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">

                        {/* Step 1: Generate */}
                        {step === "idle" && (
                            <Button
                                onClick={handleGenerate}
                                className="w-full cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-5 rounded-xl transition-all"
                            >
                                Generate Seed Phrase
                            </Button>
                        )}

                        {/* Step 2: Show seed phrase */}
                        {step === "show" && (
                            <>
                                <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-300">
                                    <AlertDescription className="text-xs">
                                        ⚠️ Write down these words in order and store them safely. Never share your seed phrase with anyone.
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-3 gap-2">
                                    {words.map((word, i) => (
                                        <div
                                            key={i}
                                            className="border border-zinc-700 rounded-lg px-3 py-2 text-sm bg-zinc-800/60 flex items-center gap-1.5"
                                        >
                                            <span className="text-zinc-500 text-xs w-4 shrink-0">{i + 1}.</span>
                                            <span className="text-zinc-100 font-mono">{word}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => setStep("verify")}
                                    className="w-full cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-5 rounded-xl"
                                >
                                    I've saved my seed phrase →
                                </Button>
                            </>
                        )}

                        {/* Step 3: Verify */}
                        {step === "verify" && (
                            <>
                                <p className="text-sm text-zinc-400">
                                    Re-enter your seed phrase in order to confirm you've saved it.
                                </p>

                                <div className="grid grid-cols-3 gap-2">
                                    {userInput.map((value, i) => (
                                        <Input
                                            key={i}
                                            placeholder={`${i + 1}`}
                                            value={value}
                                            onChange={(e) => updateInput(i, e.target.value)}
                                            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500 font-mono text-xs"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                                        <AlertDescription className="text-red-400 text-xs">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    onClick={handleVerify}
                                    className="w-full cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-5 rounded-xl"
                                >
                                    Verify Seed Phrase
                                </Button>
                            </>
                        )}

                    </CardContent>
                </Card>
            )}

            {/* ── Step 4: Success — show accounts ── */}
            {step === "success" && accounts && (
                <div className="w-full max-w-2xl space-y-6">

                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Wallet size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Your Wallet</h1>
                            <p className="text-sm text-zinc-400">4 accounts derived from your seed phrase</p>
                        </div>
                    </div>

                    {/* Warning banner */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
                        🔒 Keep your private keys safe. Never share them. Anyone with your private key has full control of that account.
                    </div>

                    {/* Chain tabs */}
                    <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800 w-fit">
                        <button
                            onClick={() => setActiveChain("solana")}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeChain === "solana"
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            ◎ Solana
                        </button>
                        <button
                            onClick={() => setActiveChain("ethereum")}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeChain === "ethereum"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            Ξ Ethereum
                        </button>
                    </div>

                    {/* Accounts list */}
                    <div className="space-y-3">
                        {activeChain === "solana" && (
                            <ChainSection accounts={accounts.solana} chain="solana" />
                        )}
                        {activeChain === "ethereum" && (
                            <ChainSection accounts={accounts.ethereum} chain="ethereum" />
                        )}
                    </div>

                    {/* New wallet button */}
                    <Button
                        onClick={() => {
                            setStep("idle")
                            setMnemonic("")
                            setWords([])
                            setUserInput([])
                            setAccounts(null)
                            setError("")
                        }}
                        variant="outline"
                        className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 bg-zinc-900 rounded-xl py-5"
                    >
                        + Create New Wallet
                    </Button>
                </div>
            )}

        </div>
    )
}