"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

import {Navigation, NavigationList, NavigationItem, NavigationLink} from "@appica/ui-react/navigation";
import {
    LayoutDashboard,
    ChartCandle,
    GitBranch,
    TrendingUp,
    Box,
} from "@appica/icons-react";


const NAV_GROUPS = [
    {
        title: null,
        items: [
            {href: "/dashboard", label: "Overview", icon: LayoutDashboard},
        ],
    },
    {
        title: "Candles",
        items: [
            {href: "/dashboard/candles/minute", label: "1 Minute", icon: ChartCandle},
            {href: "/dashboard/candles/quarter", label: "15 Minute", icon: ChartCandle},
        ],
    },
    {
        title: "CHOCH",
        items: [
            {href: "/dashboard/chochs/minute", label: "1 Minute", icon: GitBranch},
            {href: "/dashboard/chochs/quarter", label: "15 Minute", icon: GitBranch},
        ],
    },
    {
        title: "Patterns",
        items: [
            {href: "/dashboard/bos", label: "BOS", icon: TrendingUp},
            {href: "/dashboard/fvg", label: "FVG", icon: Box},
        ],
    },
];


function BrandHeader() {

    return (
        <div className="border-border flex h-16 items-center gap-2 border-b px-5">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <ChartCandle className="size-4.5"/>
            </div>
            <div className="leading-tight">
                <p className="text-foreground text-sm font-semibold">Trader Engine</p>
                <p className="text-foreground-muted text-xs">SMC Dashboard</p>
            </div>
        </div>
    );

}


// Pure nav content, no positioning/width wrapper - reused by the desktop
// sidebar (below) and the mobile drawer (mobile-sidebar.jsx).
export function SidebarNav() {

    const pathname = usePathname();

    return (
        <Navigation orientation="vertical" variant="indicator" activeLink={pathname}>
            {NAV_GROUPS.map((group, groupIndex) => (
                <div key={group.title ?? `group-${groupIndex}`} className={groupIndex > 0 ? "mt-5" : ""}>
                    {group.title && (
                        <p className="text-foreground-muted px-3 pb-1.5 text-xs font-medium tracking-wide uppercase">
                            {group.title}
                        </p>
                    )}
                    <NavigationList>
                        {group.items.map((item) => (
                            <NavigationItem key={item.href}>
                                <NavigationLink
                                    value={item.href}
                                    render={<Link href={item.href}/>}
                                >
                                    <item.icon data-icon="start"/>
                                    {item.label}
                                </NavigationLink>
                            </NavigationItem>
                        ))}
                    </NavigationList>
                </div>
            ))}
        </Navigation>
    );

}


export function Sidebar() {

    return (
        <aside className="border-border bg-background hidden w-64 shrink-0 flex-col border-e md:flex">

            <BrandHeader/>

            <div className="table-scroll flex-1 overflow-y-auto px-3 py-4">
                <SidebarNav/>
            </div>

        </aside>
    );

}


export {BrandHeader};
