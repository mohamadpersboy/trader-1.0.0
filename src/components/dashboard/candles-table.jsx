"use client";

import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell} from "@appica/ui-react/table";

import {DataPanel} from "./data-panel";
import {formatPrice} from "./format";


export function CandlesTable({table}) {


    return (
        <DataPanel table={table} emptyLabel="candles">

            <Table size="sm" hoverableRows stripedRows>

                <TableHeader>
                    <TableRow>
                        <TableHead>Index</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-end">Open</TableHead>
                        <TableHead className="text-end">High</TableHead>
                        <TableHead className="text-end">Low</TableHead>
                        <TableHead className="text-end">Close</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {table.data.map((candle) => (
                        <TableRow key={candle._id}>
                            <TableCell className="text-foreground-muted font-mono">{candle.index}</TableCell>
                            <TableCell>{candle.formattedTime}</TableCell>
                            <TableCell className="text-end font-mono">{formatPrice(candle.open)}</TableCell>
                            <TableCell className="text-end font-mono">{formatPrice(candle.high)}</TableCell>
                            <TableCell className="text-end font-mono">{formatPrice(candle.low)}</TableCell>
                            <TableCell className="text-end font-mono">{formatPrice(candle.close)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>

            </Table>

        </DataPanel>
    );

}
