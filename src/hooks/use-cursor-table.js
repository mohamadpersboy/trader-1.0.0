"use client";

import {useCallback, useEffect, useRef, useState} from "react";


//=======================================================================//
//                          useCursorTable                               //
//-----------------------------------------------------------------------//
//  هوک مشترک برای صفحه‌های داشبورد: cursor pagination (بدون skip، برای   //
//  دیتاست‌های خیلی بزرگ) + auto-refresh دوره‌ای + رفرش دستی.              //
//
//  چون هر صفحه‌ای که سراغش می‌ریم رو با cursorاش توی history نگه می‌داریم،
//  رفتن به عقب فقط یعنی "دوباره همون cursor قبلی رو fetch کن" - نیازی به
//  جهت prev واقعی از سمت کلاینت نیست (سرور از prev پشتیبانی می‌کنه، ولی
//  اینجا لازمش نداریم چون history رو خودمون داریم).
//=======================================================================//

export function useCursorTable(endpoint, {limit = 25, autoRefreshMs = 20000, enabled = true} = {}) {

    const [data, setData] = useState([]);

    const [pageInfo, setPageInfo] = useState(null);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState(null);

    const [pageIndex, setPageIndex] = useState(0);

    const [autoRefresh, setAutoRefresh] = useState(true);

    // cursorHistory[i] = the "cursor" query param used to fetch page i (null for page 0)
    const cursorHistoryRef = useRef([null]);

    const abortRef = useRef(null);


    const fetchPage = useCallback(async (cursor, {silent = false} = {}) => {

        if (abortRef.current) {
            abortRef.current.abort();
        }

        const controller = new AbortController();

        abortRef.current = controller;

        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);


        try {

            const params = new URLSearchParams();

            params.set("limit", String(limit));

            if (cursor !== null && cursor !== undefined) {
                params.set("cursor", String(cursor));
                params.set("direction", "next");
            }


            const res = await fetch(`${endpoint}?${params.toString()}`, {
                signal: controller.signal,
            });

            const json = await res.json();


            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load data");
            }


            setData(json.data);

            setPageInfo(json.pageInfo);


        } catch (err) {

            if (err.name !== "AbortError") {
                setError(err.message);
            }

        } finally {

            setLoading(false);

            setRefreshing(false);

        }

    }, [endpoint, limit]);


    // initial load + whenever endpoint changes, reset to page 0
    useEffect(() => {

        if (!enabled) {
            return;
        }

        cursorHistoryRef.current = [null];

        // Resetting pagination to page 0 whenever `endpoint` changes (i.e. the
        // user navigated to a different data page) is the expected "sync with
        // a changed external identity" effect pattern.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPageIndex(0);

        fetchPage(null);

    }, [endpoint, enabled, fetchPage]);


    // auto-refresh: silently re-fetch the CURRENT page on an interval
    useEffect(() => {

        if (!enabled || !autoRefresh || !autoRefreshMs) {
            return;
        }

        const id = setInterval(() => {

            const currentCursor = cursorHistoryRef.current[pageIndex] ?? null;

            fetchPage(currentCursor, {silent: true});

        }, autoRefreshMs);

        return () => clearInterval(id);

    }, [enabled, autoRefresh, autoRefreshMs, pageIndex, fetchPage]);


    const goNext = useCallback(() => {

        if (!pageInfo?.hasNextPage || pageInfo.endCursor === null) {
            return;
        }

        const nextIndex = pageIndex + 1;

        cursorHistoryRef.current[nextIndex] = pageInfo.endCursor;

        setPageIndex(nextIndex);

        fetchPage(pageInfo.endCursor);

    }, [pageInfo, pageIndex, fetchPage]);


    const goPrev = useCallback(() => {

        if (pageIndex === 0) {
            return;
        }

        const prevIndex = pageIndex - 1;

        setPageIndex(prevIndex);

        fetchPage(cursorHistoryRef.current[prevIndex] ?? null);

    }, [pageIndex, fetchPage]);


    const refresh = useCallback(() => {

        const currentCursor = cursorHistoryRef.current[pageIndex] ?? null;

        fetchPage(currentCursor, {silent: true});

    }, [pageIndex, fetchPage]);


    const reset = useCallback(() => {

        cursorHistoryRef.current = [null];

        setPageIndex(0);

        fetchPage(null);

    }, [fetchPage]);


    return {

        data,

        pageInfo,

        loading,

        refreshing,

        error,

        pageNumber: pageIndex + 1,

        hasNext: Boolean(pageInfo?.hasNextPage),

        hasPrev: pageIndex > 0,

        goNext,

        goPrev,

        refresh,

        reset,

        autoRefresh,

        setAutoRefresh,

    };

}
