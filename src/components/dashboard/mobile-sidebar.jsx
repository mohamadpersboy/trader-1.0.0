"use client";

import {Drawer, DrawerTrigger, DrawerContent, DrawerBody} from "@appica/ui-react/drawer";
import {Button} from "@appica/ui-react/button";
import {Menu2} from "@appica/icons-react";

import {BrandHeader, SidebarNav} from "./sidebar";


export function MobileSidebar() {

    return (
        <Drawer side="left">
            <DrawerTrigger
                render={
                    <Button variant="outline" size="icon-md" className="md:hidden">
                        <Menu2/>
                    </Button>
                }
            />
            <DrawerContent className="w-72 p-0">
                <BrandHeader/>
                <DrawerBody className="px-3 py-4">
                    <SidebarNav/>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );

}
