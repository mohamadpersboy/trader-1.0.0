"use client";

import {Fragment, useState} from "react";

import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell} from "@appica/ui-react/table";
import {Badge} from "@appica/ui-react/badge";
import {Separator} from "@appica/ui-react/separator";

import {DataPanel} from "./data-panel";
import {ExpandTrigger} from "./expand-trigger";
import {PointCard} from "./point-card";
import {TypeBadge, FlagBadge} from "./type-badge";
import {FvgMiniList} from "./fvg-mini-list";


export function BosTable({table}) {

    const [expandedIds, setExpandedIds] = useState(() => new Set());


    function toggleRow(id) {

        setExpandedIds((prev) => {

            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;

        });

    }


    return (
        <DataPanel table={table} emptyLabel="BOS">

            <Table size="sm" hoverableRows>

                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10"/>
                        <TableHead>Index</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start → End</TableHead>
                        <TableHead className="text-end">50%</TableHead>
                        <TableHead>Flags</TableHead>
                        <TableHead>FVGs</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {table.data.map((bos) => {

                        const isExpanded = expandedIds.has(bos._id);

                        return (
                            <Fragment key={bos._id}>
                                <TableRow>
                                    <TableCell>
                                        <ExpandTrigger
                                            expanded={isExpanded}
                                            onClick={() => toggleRow(bos._id)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-foreground-muted font-mono">{bos.index}</TableCell>
                                    <TableCell><TypeBadge type={bos.type}/></TableCell>
                                    <TableCell className="text-foreground-muted text-sm whitespace-nowrap">
                                        {bos.open?.formattedTime ?? "—"} → {bos.close?.formattedTime ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-end font-mono">
                                        {bos.percents50?.toFixed?.(6) ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            <FlagBadge label="Standard" value={bos.standard}/>
                                            <FlagBadge label="Return" value={bos.return}/>
                                            <FlagBadge label="Matched" value={bos.isMatched}/>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={bos.fvgCount > 0 ? "primary" : "light"} size="sm">
                                            {bos.fvgCount}
                                        </Badge>
                                    </TableCell>
                                </TableRow>

                                {isExpanded && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="bg-background-subtle p-4">

                                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                                                <PointCard label="Open" point={bos.open}/>
                                                <PointCard label="Update" point={bos.update}/>
                                                <PointCard label="Close" point={bos.close}/>
                                                <PointCard label="Min" point={bos.min}/>
                                                <PointCard label="Max" point={bos.max}/>
                                            </div>

                                            <Separator className="my-4"/>

                                            <p className="text-foreground-muted mb-2 text-xs font-medium tracking-wide uppercase">
                                                Fair Value Gaps
                                            </p>

                                            <FvgMiniList bosId={bos._id}/>

                                        </TableCell>
                                    </TableRow>
                                )}
                            </Fragment>
                        );

                    })}
                </TableBody>

            </Table>

        </DataPanel>
    );

}
