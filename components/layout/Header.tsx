"use client";

import ModeToggle from "../theme/ModeToggle";

export default function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                <div className="flex items-center gap-2.5">
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        Vaulta
                    </span>
                </div>
                <ModeToggle />
            </div>
        </header>
    );
}
