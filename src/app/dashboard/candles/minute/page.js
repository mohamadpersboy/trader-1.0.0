"use client";

import {PageHeader} from "@/components/dashboard/page-header";
import {RefreshControls} from "@/components/dashboard/refresh-controls";
import {ClearButton} from "@/components/dashboard/clear-button";
import {CandlesTable} from "@/components/dashboard/candles-table";
import {useCursorTable} from "@/hooks/use-cursor-table";


const ENDPOINT = "/api/dashboard/candles/minute";


export default function MinuteCandlesPage() {

    const table = useCursorTable(ENDPOINT, {limit: 50, autoRefreshMs: 20000});


    return (
        <div>

            <PageHeader
                title="1 Minute Candles"
                description="Raw OHLC candles fetched from Faraz"
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
                            warningText="This deletes every minute candle AND everything derived from it: minute CHOCH, BOS, and FVG. This cannot be undone."
                            onCleared={table.reset}
                        />
                    </>
                }
            />

            <div className="p-4 sm:p-6">
                <CandlesTable table={table}/>
            </div>

        </div>
    );

}
