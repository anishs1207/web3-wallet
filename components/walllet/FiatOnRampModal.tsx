"use client";

import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
    onClose: () => void;
}

export default function FiatOnRampModal({ onClose }: Props) {
    // MoonPay URL - in a real app this would be more dynamic
    const moonPayUrl = "https://buy.moonpay.com";

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-md">
                <DialogHeader>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl ring-1 bg-green-500/10 dark:bg-green-500/15 ring-green-500/30">
                            <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm">Buy Crypto</DialogTitle>
                            <DialogDescription className="text-xs">
                                Purchase assets using your credit card or bank transfer
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-center space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground">Secure Checkout via MoonPay</p>
                            <p className="text-xs text-muted-foreground">
                                You will be redirected to our partner MoonPay to complete your purchase securely.
                            </p>
                        </div>
                    </div>

                    <Alert className="border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300">
                        <AlertDescription className="text-[10px]">
                            MoonPay is a third-party service. Their terms of use and privacy policy apply to all transactions.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button className="gap-2" asChild>
                            <a href={moonPayUrl} target="_blank" rel="noopener noreferrer">
                                Continue <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
