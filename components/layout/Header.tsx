"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ModeToggle from "@/components/ModeToggle";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
} from "@/components/ui/sheet";

import { Wallet, Copy, LogOut, Menu } from "lucide-react";

export default function Header() {

    return (
        <header className="w-full border-b bg-background">
            <div className="flex h-16 items-center justify-between px-6">

                {/* LEFT: Logo */}
                <div className="flex items-center gap-2 font-semibold text-lg">
                    <Wallet className="h-5 w-5" />
                    Vaulta
                </div>

                <ModeToggle />

            </div>
        </header>
    );
}

