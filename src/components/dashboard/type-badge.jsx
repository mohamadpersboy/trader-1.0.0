import {Badge} from "@appica/ui-react/badge";


export function TypeBadge({type}) {

    if (type === "bearish") {
        return <Badge variant="error" size="sm">Bearish</Badge>;
    }

    if (type === "bullish") {
        return <Badge variant="success" size="sm">Bullish</Badge>;
    }

    return <Badge variant="light" size="sm">{type ?? "—"}</Badge>;

}


export function FlagBadge({label, value}) {

    return (
        <Badge variant={value ? "success" : "light"} size="sm">
            {label}
        </Badge>
    );

}
