"use client";

import {PageHeader} from "@/components/dashboard/page-header";
import {RefreshControls} from "@/components/dashboard/refresh-controls";
import {ClearButton} from "@/components/dashboard/clear-button";
import {FvgTable} from "@/components/dashboard/fvg-table";
import {useCursorTable} from "@/hooks/use-cursor-table";


const ENDPOINT = "/api/dashboard/fvg";


export default function FvgPage() {

    const table = useCursorTable(ENDPOINT, {limit: 50, autoRefreshMs: 20000});


    return (
        <div>

            <PageHeader
                title="Fair Value Gaps"
                description="All FVGs across every BOS, flattened into one table"
                actions={
                    <>
                        <RefreshControls
                            autoRefresh={table.autoRefresh}
                            onAutoRefreshChange={table.setAutoRefresh}
                            onRefresh={table.refresh}
                            refreshing={table.refreshing}
                        />
                        <ClearButton
                            endpoint={ENDPOINT}
                            label="Clear all"
                            warningText="This deletes every FVG record. This cannot be undone."
                            onCleared={table.reset}
                        />
                    </>
                }
            />

            <div className="p-4 sm:p-6">
                <FvgTable table={table}/>
            </div>

        </div>
    );

}
