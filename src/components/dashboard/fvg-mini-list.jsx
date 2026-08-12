"use client";

import {useEffect, useState} from "react";

import {Spinner} from "@appica/ui-react/spinner";
import {Badge} from "@appica/ui-react/badge";

import {formatPrice} from "./format";
import {TypeBadge} from "./type-badge";


export function FvgMiniList({bosId}) {

    const [state, setState] = useState({loading: true, error: null, items: []});


    useEffect(() => {

        let cancelled = false;

        // Resetting to a loading state when `bosId` changes is the expected
        // "synchronize with an external resource" effect pattern.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({loading: true, error: null, items: []});


        fetch(`/api/dashboard/bos/${bosId}/fvgs`)
            .then((res) => res.json())
            .then((json) => {

                if (cancelled) {
                    return;
                }

                if (!json.success) {
                    throw new Error(json.message || "Failed to load FVGs");
                }

                setState({loading: false, error: null, items: json.data});

            })
            .catch((err) => {

                if (!cancelled) {
                    setState({loading: false, error: err.message, items: []});
                }

            });


        return () => {
            cancelled = true;
        };

    }, [bosId]);


    if (state.loading) {
        return (
            <div className="flex items-center gap-2 py-3">
                <Spinner className="size-4"/>
                <span className="text-foreground-muted text-sm">Loading FVGs…</span>
            </div>
        );
    }

    if (state.error) {
        return <p className="text-foreground-muted text-sm">Failed to load FVGs: {state.error}</p>;
    }

    if (state.items.length === 0) {
        return <p className="text-foreground-muted text-sm italic">No FVGs for this BOS.</p>;
    }

    return (
        <div className="space-y-2">
            {state.items.map((fvg) => (
                <div
                    key={fvg._id}
                    className="border-border bg-background flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2 text-xs"
                >
                    <TypeBadge type={fvg.type}/>
                    <span className="text-foreground-muted">Index <span className="text-foreground font-mono">{fvg.index}</span></span>
                    <span className="text-foreground-muted">High <span className="text-foreground font-mono">{formatPrice(fvg.high)}</span></span>
                    <span className="text-foreground-muted">Low <span className="text-foreground font-mono">{formatPrice(fvg.low)}</span></span>
                    <span className="text-foreground-muted">{fvg.formattedTime}</span>
                    <Badge variant={fvg.use ? "success" : "light"} size="sm">
                        {fvg.use ? "Used" : "Unused"}
                    </Badge>
                </div>
            ))}
        </div>
    );

}
