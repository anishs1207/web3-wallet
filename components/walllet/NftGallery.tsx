"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface NFT {
    id: string;
    name: string;
    image: string;
    symbol?: string;
}

interface Props {
    address: string;
    chain: "solana" | "ethereum";
}

export default function NftGallery({}: Props) {
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNFTs = useCallback(async () => {
        setLoading(true);
        try {
            // For a real app, use Helius or SimpleHash here.
            // Placeholder for now as direct RPC NFT fetching is complex
            setNfts([]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNFTs();
    }, [fetchNFTs]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest">Collectibles</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 min-h-[150px]">
                {loading && (
                    <div className="col-span-2 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin opacity-20" />
                    </div>
                )}

                {!loading && nfts.length === 0 && (
                    <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center text-muted-foreground/50 border border-dashed border-border/50 rounded-lg">
                        <ImageIcon className="h-8 w-8 mb-2 opacity-10" />
                        <p className="text-[10px]">No NFTs found in this account</p>
                    </div>
                )}

                {nfts.map(nft => (
                    <div key={nft.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                        <Image 
                            src={nft.image} 
                            alt={nft.name} 
                            fill 
                            className="object-cover transition-transform group-hover:scale-110" 
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] font-bold text-white truncate">{nft.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
