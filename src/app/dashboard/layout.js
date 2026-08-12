import {Sidebar} from "@/components/dashboard/sidebar";
import {DashboardToastProvider} from "@/components/dashboard/dashboard-toast-provider";


export default function DashboardLayout({children}) {

    return (
        <DashboardToastProvider>
            <div className="flex h-screen overflow-hidden">

                <Sidebar/>

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>

            </div>
        </DashboardToastProvider>
    );

}
