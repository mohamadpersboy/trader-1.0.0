"use client";

import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell} from "@appica/ui-react/table";
import {Badge} from "@appica/ui-react/badge";

import {DataPanel} from "./data-panel";
import {formatPrice} from "./format";
import {TypeBadge} from "./type-badge";


export function FvgTable({table}) {


    return (
        <DataPanel table={table} emptyLabel="FVGs">

            <Table size="sm" hoverableRows stripedRows>

                <TableHeader>
                    <TableRow>
                        <TableHead>Index</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-end">High</TableHead>
                        <TableHead className="text-end">Low</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Parent BOS</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {table.data.map((fvg) => (
                        <TableRow key={fvg._id}>
                            <TableCell className="text-foreground-muted font-mono">{fvg.index}</TableCell>
                            <TableCell><TypeBadge type={fvg.type}/></TableCell>
                            <TableCell className="text-end font-mono">{formatPrice(fvg.high)}</TableCell>
                            <TableCell className="text-end font-mono">{formatPrice(fvg.low)}</TableCell>
                            <TableCell className="text-sm">{fvg.formattedTime}</TableCell>
                            <TableCell>
                                <Badge variant={fvg.use ? "success" : "light"} size="sm">
                                    {fvg.use ? "Used" : "Unused"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-foreground-muted font-mono text-xs">
                                {String(fvg.bosId).slice(-8)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>

            </Table>

        </DataPanel>
    );

}
