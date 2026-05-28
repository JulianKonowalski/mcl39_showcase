import React, { useState, useEffect, useMemo } from "react";

/*----------------------------------------------------------------------------*/

import Viewer, { View } from "./Viewer";

/*----------------------------------------------------------------------------*/

import views from "../../assets/views.json";

/*----------------------------------------------------------------------------*/

export default function App() {

    const [view_height,] = useState<number>(750);

    const v = useMemo(() => {
        return views.views.map((view) => {
            return ({
                camera_position: view.camera_position,
                target_position: view.target_position
            }) as View;
        })
    }, []);

    useEffect(() => {

        const resize_handler = (e: UIEvent) => {
            const root = document.getElementById("root");
            if (root === null) { return; }
            const target_height = (document.body.clientHeight + view_height * (v.length)) - 1;
            root.style.height = `${target_height}px`;
        }

        addEventListener("resize", resize_handler);
        resize_handler(new UIEvent("asdf"));

        return () => removeEventListener("resize", resize_handler);
    }, []);

    return (
        <div>
            <Viewer views={v} view_height={view_height}/>
        </div>
    );
}

/*----------------------------------------------------------------------------*/