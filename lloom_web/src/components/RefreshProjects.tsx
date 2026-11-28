"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Revalidate on activation, including restored client navigation, not just a hard reload.
export default function RefreshProjects() {
    const router = useRouter();
    useEffect(() => {
        router.refresh();
    }, [router]);
    return null;
}
