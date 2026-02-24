"use client";

import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full border-t border-border/60 bg-background/80 backdrop-blur-md">
            <div className="mx-auto max-w-5xl px-6 py-6">
                <Separator className="mb-5 opacity-30" />
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
                        Keys never leave your browser · Open source · Non-custodial
                    </div>
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Vaulta. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}