"use client";

import {Fragment, useState} from "react";

import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell} from "@appica/ui-react/table";

import {DataPanel} from "./data-panel";
import {ExpandTrigger} from "./expand-trigger";
import {PointCard} from "./point-card";
import {TypeBadge} from "./type-badge";


export function ChochTable({table}) {

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
        <DataPanel table={table} emptyLabel="CHOCH">

            <Table size="sm" hoverableRows>

                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10"/>
                        <TableHead>Index</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Break Min</TableHead>
                        <TableHead>Break Max</TableHead>
                        <TableHead>Created</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {table.data.map((choch) => {

                        const isExpanded = expandedIds.has(choch._id);

                        return (
                            <Fragment key={choch._id}>
                                <TableRow>
                                    <TableCell>
                                        <ExpandTrigger
                                            expanded={isExpanded}
                                            onClick={() => toggleRow(choch._id)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-foreground-muted font-mono">{choch.index}</TableCell>
                                    <TableCell><TypeBadge type={choch.type}/></TableCell>
                                    <TableCell className="text-foreground-muted text-sm">
                                        {choch.breakMin ? "Yes" : "No"}
                                    </TableCell>
                                    <TableCell className="text-foreground-muted text-sm">
                                        {choch.breakMax ? "Yes" : "No"}
                                    </TableCell>
                                    <TableCell className="text-foreground-muted text-sm">
                                        {new Date(choch.createdAt).toLocaleString()}
                                    </TableCell>
                                </TableRow>

                                {isExpanded && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={6} className="bg-background-subtle p-4">
                                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                                                <PointCard label="Base" point={choch.base}/>
                                                <PointCard label="Break" point={choch.break}/>
                                                <PointCard label="Min" point={choch.min}/>
                                                <PointCard label="Max" point={choch.max}/>
                                                <PointCard label="Bearish CH" point={choch.bearishCh}/>
                                                <PointCard label="Bullish CH" point={choch.bullishCh}/>
                                            </div>
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
