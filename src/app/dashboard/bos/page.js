"use client";

import {PageHeader} from "@/components/dashboard/page-header";
import {RefreshControls} from "@/components/dashboard/refresh-controls";
import {ClearButton} from "@/components/dashboard/clear-button";
import {BosTable} from "@/components/dashboard/bos-table";
import {useCursorTable} from "@/hooks/use-cursor-table";


const ENDPOINT = "/api/dashboard/bos";


export default function BosPage() {

    const table = useCursorTable(ENDPOINT, {limit: 30, autoRefreshMs: 20000});


    return (
        <div>

            <PageHeader
                title="Break of Structure"
                description="Confirmed BOS, expand a row to see its Fair Value Gaps"
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
                            warningText="This deletes every BOS AND its derived FVG. This cannot be undone."
                            onCleared={table.reset}
                        />
                    </>
                }
            />

            <div className="p-4 sm:p-6">
                <BosTable table={table}/>
            </div>

        </div>
    );

}
