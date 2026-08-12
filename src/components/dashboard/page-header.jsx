import {MobileSidebar} from "./mobile-sidebar";


export function PageHeader({title, description, badge, actions}) {

    return (
        <div className="border-border bg-background/80 sticky top-0 z-10 flex flex-col gap-3 border-b px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">

            <div className="flex items-center gap-3">

                <MobileSidebar/>

                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-foreground text-lg font-semibold">{title}</h1>
                        {badge}
                    </div>
                    {description && (
                        <p className="text-foreground-muted mt-0.5 text-sm">{description}</p>
                    )}
                </div>

            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}

        </div>
    );

}
