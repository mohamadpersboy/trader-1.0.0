"use client";

import {Button} from "@appica/ui-react/button";
import {Switch} from "@appica/ui-react/switch";
import {Refresh} from "@appica/icons-react";


export function RefreshControls({autoRefresh, onAutoRefreshChange, onRefresh, refreshing}) {

    return (
        <div className="border-border bg-background-subtle flex items-center gap-3 rounded-lg border px-3 py-1.5">

            <label className="flex items-center gap-2 text-sm">
                <Switch
                    size="sm"
                    checked={autoRefresh}
                    onCheckedChange={onAutoRefreshChange}
                />
                <span className="text-foreground-muted">Auto-refresh</span>
            </label>

            <span className="bg-border h-4 w-px"/>

            <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
            >
                <Refresh data-icon="start" className={refreshing ? "animate-spin" : ""}/>
                Refresh
            </Button>

        </div>
    );

}
