"use client";

import {useState} from "react";

import {Button} from "@appica/ui-react/button";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogClose,
} from "@appica/ui-react/alert-dialog";
import {useToastManager} from "@appica/ui-react/toast";
import {Spinner} from "@appica/ui-react/spinner";
import {Trash} from "@appica/icons-react";


//=======================================================================//
//                            ClearButton                                //
//-----------------------------------------------------------------------//
//  طبق تصمیم پروژه: حذف تک‌تک ردیف‌ها مجاز نیست - فقط پاک‌سازی یکجای کل   //
//  یک بخش (candles/choch/bos/fvg)، و همیشه پشت یک تأییدیه‌ی صریح.        //
//=======================================================================//

export function ClearButton({endpoint, label = "Clear all", warningText, onCleared}) {

    const [open, setOpen] = useState(false);

    const [pending, setPending] = useState(false);

    const toast = useToastManager();


    async function handleConfirm() {

        setPending(true);

        try {

            const res = await fetch(endpoint, {method: "DELETE"});

            const json = await res.json();


            if (!res.ok || !json.success) {
                throw new Error(json.message || "Clear operation failed");
            }


            toast.add({
                title: "Cleared successfully",
                description: json.message,
                type: "success",
            });


            setOpen(false);

            onCleared?.();


        } catch (err) {

            toast.add({
                title: "Failed to clear data",
                description: err.message,
                type: "error",
            });

        } finally {

            setPending(false);

        }

    }


    return (
        <AlertDialog open={open} onOpenChange={setOpen}>

            <AlertDialogTrigger
                render={
                    <Button variant="destructive" size="sm">
                        <Trash data-icon="start"/>
                        {label}
                    </Button>
                }
            />

            <AlertDialogContent>

                <AlertDialogHeader>
                    <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {warningText ?? "This permanently deletes every record in this collection. This action cannot be undone."}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogClose render={<Button variant="outline">Cancel</Button>}/>
                    <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
                        {pending ? <Spinner currentColor className="size-4" data-icon="start"/> : <Trash data-icon="start"/>}
                        Yes, clear everything
                    </Button>
                </AlertDialogFooter>

            </AlertDialogContent>

        </AlertDialog>
    );

}
