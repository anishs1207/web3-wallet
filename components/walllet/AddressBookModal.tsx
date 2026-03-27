"use client";

import { useState } from "react";
import { Book, Plus, Trash2, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getContacts, saveContact, deleteContact, Contact } from "@/lib/addressBook";

interface Props {
    onClose: () => void;
    onSelect?: (address: string) => void;
}

export default function AddressBookModal({ onClose, onSelect }: Props) {
    const [contacts, setContacts] = useState<Contact[]>(() => getContacts());
    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newAlias, setNewAlias] = useState("");
    const [newAddr, setNewAddr] = useState("");
    const [newChain, setNewChain] = useState<"solana" | "ethereum">("solana");


    const filtered = contacts.filter(c =>
        c.alias.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase())
    );

    function handleAdd() {
        if (!newAlias || !newAddr) return;
        saveContact({ alias: newAlias, address: newAddr, chain: newChain });
        setContacts(getContacts());
        setIsAdding(false);
        setNewAlias("");
        setNewAddr("");
    }

    function handleDelete(id: string) {
        deleteContact(id);
        setContacts(getContacts());
    }

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-md">
                <DialogHeader>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl ring-1 bg-amber-500/10 dark:bg-amber-500/15 ring-amber-500/30">
                            <Book className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm">Address Book</DialogTitle>
                            <DialogDescription className="text-xs">
                                Manage your trusted contacts and recipients
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {!isAdding && (
                        <>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search contacts..."
                                    className="pl-8 text-xs h-9"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="h-64 overflow-y-auto rounded-xl border border-border/50 bg-muted/20 p-2">
                                {filtered.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                                        <User className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                        <p className="text-xs text-muted-foreground">No contacts found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filtered.map(contact => (
                                            <div
                                                key={contact.id}
                                                className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-2.5 transition-colors hover:border-primary/30"
                                            >
                                                <div
                                                    className="flex-1 cursor-pointer"
                                                    onClick={() => onSelect?.(contact.address)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-foreground">{contact.alias}</span>
                                                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                                                            {contact.chain}
                                                        </Badge>
                                                    </div>
                                                    <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                        {contact.address}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(contact.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button className="w-full h-9 text-xs" onClick={() => setIsAdding(true)}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> Add New Contact
                            </Button>
                        </>
                    )}

                    {isAdding && (
                        <div className="space-y-3 rounded-xl border border-border/50 bg-muted/30 p-4">
                            <p className="text-xs font-bold text-foreground">Add New Contact</p>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Alias</label>
                                <Input
                                    placeholder="e.g. My Ledger"
                                    className="text-xs h-9"
                                    value={newAlias}
                                    onChange={e => setNewAlias(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Address</label>
                                <Input
                                    placeholder="0x... or Solana Address"
                                    className="font-mono text-xs h-9"
                                    value={newAddr}
                                    onChange={e => setNewAddr(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Chain</label>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={newChain === "solana" ? "default" : "outline"}
                                        className="flex-1 text-[10px]"
                                        onClick={() => setNewChain("solana")}
                                    >
                                        Solana
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={newChain === "ethereum" ? "default" : "outline"}
                                        className="flex-1 text-[10px]"
                                        onClick={() => setNewChain("ethereum")}
                                    >
                                        Ethereum
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button variant="ghost" className="flex-1 text-xs" onClick={() => setIsAdding(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-[2] text-xs" onClick={handleAdd}>
                                    Save Contact
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
