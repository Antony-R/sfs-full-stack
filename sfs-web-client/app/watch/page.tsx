'use client'

import React, { Suspense } from "react";
import { ShowVideo } from "../showvideo/showvideo";

export default function Watch() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <ShowVideo />
        </Suspense>
    );
}

