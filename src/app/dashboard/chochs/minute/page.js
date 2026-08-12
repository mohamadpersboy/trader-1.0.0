"use client";

import {PageHeader} from "@/components/dashboard/page-header";
import {RefreshControls} from "@/components/dashboard/refresh-controls";
import {ClearButton} from "@/components/dashboard/clear-button";
import {ChochTable} from "@/components/dashboard/choch-table";
import {useCursorTable} from "@/hooks/use-cursor-table";


const ENDPOINT = "/api/dashboard/chochs/minute";


export default function MinuteChochPage() {

    const table = useCursorTable(ENDPOINT, {limit: 30, autoRefreshMs: 20000});


    return (
        <div>

            <PageHeader
                title="1 Minute CHOCH"
                description="Change of Character points detected on 1-minute candles"
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
                            warningText="This deletes every minute CHOCH AND everything derived from it: BOS and FVG. This cannot be undone."
                            onCleared={table.reset}
                        />
                    </>
                }
            />

            <div className="p-4 sm:p-6">
                <ChochTable table={table}/>
            </div>

        </div>
    );

}
