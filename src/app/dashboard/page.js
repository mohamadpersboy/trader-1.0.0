"use client";

import {useEffect, useState} from "react";

import {ChartCandle, GitBranch, TrendingUp, Box, Clock} from "@appica/icons-react";

import {PageHeader} from "@/components/dashboard/page-header";
import {StatCard} from "@/components/dashboard/stat-card";
import {RefreshControls} from "@/components/dashboard/refresh-controls";
import {useCursorTable} from "@/hooks/use-cursor-table";


function useStats() {

    const [stats, setStats] = useState(null);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [autoRefresh, setAutoRefresh] = useState(true);


    async function load(silent = false) {

        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {

            const res = await fetch("/api/dashboard/stats");

            const json = await res.json();

            if (json.success) {
                setStats(json.data);
            }

        } finally {

            setLoading(false);

            setRefreshing(false);

        }

    }


    useEffect(() => {

        // Fetching in response to mount/dependency changes is the documented
        // "synchronize with an external system" case for effects; the loading
        // state naturally gets set from inside `load()`.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();

    }, []);


    useEffect(() => {

        if (!autoRefresh) {
            return;
        }

        const id = setInterval(() => load(true), 20000);

        return () => clearInterval(id);

    }, [autoRefresh]);


    return {stats, loading, refreshing, autoRefresh, setAutoRefresh, reload: () => load(true)};

}


export default function DashboardOverviewPage() {

    const {stats, loading, refreshing, autoRefresh, setAutoRefresh, reload} = useStats();


    return (
        <div>

            <PageHeader
                title="Overview"
                description="Live snapshot of the SMC detection pipeline"
                actions={
                    <RefreshControls
                        autoRefresh={autoRefresh}
                        onAutoRefreshChange={setAutoRefresh}
                        onRefresh={reload}
                        refreshing={refreshing}
                    />
                }
            />

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">

                <StatCard
                    icon={ChartCandle}
                    label="Minute Candles"
                    value={stats?.candles?.minute}
                />

                <StatCard
                    icon={ChartCandle}
                    label="Quarter Candles"
                    value={stats?.candles?.quarter}
                />

                <StatCard
                    icon={GitBranch}
                    label="Minute CHOCH"
                    value={stats?.choch?.minute}
                />

                <StatCard
                    icon={GitBranch}
                    label="Quarter CHOCH"
                    value={stats?.choch?.quarter}
                />

                <StatCard
                    icon={TrendingUp}
                    label="BOS"
                    value={stats?.bos}
                />

                <StatCard
                    icon={Box}
                    label="FVG"
                    value={stats?.fvg}
                />

            </div>

            {stats?.lastCheckpoints && (
                <div className="border-border bg-background mx-4 mb-6 rounded-xl border p-4 sm:mx-6">

                    <div className="mb-3 flex items-center gap-2">
                        <Clock className="text-foreground-muted size-4"/>
                        <p className="text-foreground text-sm font-medium">Detection checkpoints</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
                        <CheckpointItem label="Last minute candle" value={stats.lastCheckpoints.lastMinuteCandleIndex}/>
                        <CheckpointItem label="Last quarter candle" value={stats.lastCheckpoints.lastQuarterCandleIndex}/>
                        <CheckpointItem label="Last minute CHOCH check" value={stats.lastCheckpoints.lastMinuteChochCheckIndex}/>
                        <CheckpointItem label="Last quarter CHOCH check" value={stats.lastCheckpoints.lastQuarterChochCheckIndex}/>
                        <CheckpointItem label="Last BOS check" value={stats.lastCheckpoints.lastBosCheckIndex}/>
                    </div>

                </div>
            )}

        </div>
    );

}


function CheckpointItem({label, value}) {

    return (
        <div>
            <p className="text-foreground-muted text-xs">{label}</p>
            <p className="text-foreground font-mono">{value ?? 0}</p>
        </div>
    );

}
