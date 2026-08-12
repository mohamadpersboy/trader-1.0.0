"use client";

import {Button} from "@appica/ui-react/button";
import {Skeleton} from "@appica/ui-react/skeleton";
import {ChevronDown} from "@appica/icons-react";


function LoadingSkeleton() {

    return (
        <div className="space-y-2 p-4">
            {Array.from({length: 8}).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md"/>
            ))}
        </div>
    );

}


function ErrorState({message}) {

    return (
        <div className="flex flex-col items-center justify-center gap-1 px-6 py-16 text-center">
            <p className="text-foreground text-sm font-medium">Failed to load data</p>
            <p className="text-foreground-muted text-sm">{message}</p>
        </div>
    );

}


function EmptyState({label}) {

    return (
        <div className="flex flex-col items-center justify-center gap-1 px-6 py-16 text-center">
            <p className="text-foreground text-sm font-medium">No {label} yet</p>
            <p className="text-foreground-muted text-sm">Data will appear here once the runtime detects some.</p>
        </div>
    );

}


export function DataPanel({table, emptyLabel, children}) {

    const {loading, error, data, refreshing, pageNumber, hasNext, hasPrev, goNext, goPrev} = table;


    return (
        <div className="border-border bg-background overflow-hidden rounded-xl border">

            <div className="table-scroll overflow-x-auto">

                {loading ? (
                    <LoadingSkeleton/>
                ) : error ? (
                    <ErrorState message={error}/>
                ) : data.length === 0 ? (
                    <EmptyState label={emptyLabel}/>
                ) : (
                    children
                )}

            </div>

            <div className="border-border bg-background-subtle flex items-center justify-between gap-3 border-t px-4 py-3">

                <p className="text-foreground-muted text-xs">
                    Page {pageNumber} · {data.length} rows
                    {refreshing && !loading && <span className="ms-2 italic">refreshing…</span>}
                </p>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goPrev} disabled={!hasPrev || loading}>
                        <ChevronDown data-icon="start" className="rotate-90"/>
                        Prev
                    </Button>
                    <Button variant="outline" size="sm" onClick={goNext} disabled={!hasNext || loading}>
                        Next
                        <ChevronDown data-icon="end" className="-rotate-90"/>
                    </Button>
                </div>

            </div>

        </div>
    );

}
