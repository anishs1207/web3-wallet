"use client"

import Link from "next/link"
import { Github, Twitter, Disc, ShieldCheck, ExternalLink } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

export default function Footer() {
    return (
        <footer className="w-full border-t bg-background">
            <div className="container mx-auto px-6 py-10">

                {/* Bottom Section */}
                <div className="flex flex-col  justify-between items-center gap-4 text-sm text-muted-foreground">

                    <div>
                        © {new Date().getFullYear()} SolWallet. All rights reserved.
                    </div>


                </div>

            </div>
        </footer>
    )
}