import {Card} from "@appica/ui-react/card";


export function StatCard({icon: Icon, label, value, sublabel}) {

    return (
        <Card frame className="flex items-center gap-4">

            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-5.5"/>
            </div>

            <div className="min-w-0">
                <p className="text-foreground-muted text-sm">{label}</p>
                <p className="text-foreground text-2xl font-semibold tabular-nums">
                    {value === null || value === undefined ? "—" : value.toLocaleString()}
                </p>
                {sublabel && (
                    <p className="text-foreground-muted text-xs">{sublabel}</p>
                )}
            </div>

        </Card>
    );

}
