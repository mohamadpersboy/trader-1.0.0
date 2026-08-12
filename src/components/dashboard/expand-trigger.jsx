"use client";

import {Button} from "@appica/ui-react/button";
import {ChevronDown} from "@appica/icons-react";


export function ExpandTrigger({expanded, onClick}) {

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClick}
            aria-label={expanded ? "Collapse row" : "Expand row"}
        >
            <ChevronDown className={`transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}/>
        </Button>
    );

}
