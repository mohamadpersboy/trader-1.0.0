"use client";

import {ToastProvider, Toaster} from "@appica/ui-react/toast";


export function DashboardToastProvider({children}) {

    return (
        <ToastProvider>
            {children}
            <Toaster position="top-right" progress/>
        </ToastProvider>
    );

}
