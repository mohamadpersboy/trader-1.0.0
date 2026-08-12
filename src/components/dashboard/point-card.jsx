import {formatPrice} from "./format";


export function PointCard({label, point}) {

    return (
        <div className="border-border bg-background-subtle rounded-lg border p-3">

            <p className="text-foreground-muted mb-2 text-xs font-medium tracking-wide uppercase">
                {label}
            </p>

            {!point ? (
                <p className="text-foreground-muted text-sm italic">null</p>
            ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <span className="text-foreground-muted">Index</span>
                    <span className="text-foreground text-end font-mono">{point.index}</span>

                    <span className="text-foreground-muted">Open</span>
                    <span className="text-foreground text-end font-mono">{formatPrice(point.open)}</span>

                    <span className="text-foreground-muted">High</span>
                    <span className="text-foreground text-end font-mono">{formatPrice(point.high)}</span>

                    <span className="text-foreground-muted">Low</span>
                    <span className="text-foreground text-end font-mono">{formatPrice(point.low)}</span>

                    <span className="text-foreground-muted">Close</span>
                    <span className="text-foreground text-end font-mono">{formatPrice(point.close)}</span>

                    <span className="text-foreground-muted">Time</span>
                    <span className="text-foreground text-end">{point.formattedTime ?? "—"}</span>
                </div>
            )}

        </div>
    );

}
