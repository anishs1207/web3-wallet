"use client";

import { Wallet, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

export default function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">

                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
                        <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-base font-bold tracking-tight text-foreground">
                        Vaulta
                    </span>
                    <Badge variant="secondary" className="hidden text-[10px] font-semibold sm:flex">
                        Beta
                    </Badge>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3">
                    <Separator orientation="vertical" className="h-5 opacity-40" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                                <Github className="h-4 w-4" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>View source</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </header>
    );
}
