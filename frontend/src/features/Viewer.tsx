import React, { useEffect, useState, useCallback, useRef } from "react";

/*----------------------------------------------------------------------------*/

import Renderer from "../renderer/renderer";

/*----------------------------------------------------------------------------*/

import "../styles/features/Viewer.css";

/*----------------------------------------------------------------------------*/

export type View = {
    camera_position: number[],
    target_position: number[]
}

/*----------------------------------------------------------------------------*/

export default function Viewer({
    views,
    view_height
}: {
    views: View[],
    view_height: number
}) {

    /*------------------------------------------------------------------------*/

    const canvas_ref    = useRef<HTMLCanvasElement | null>(null);
    const renderer_ref  = useRef<Renderer | null>(null);
    
    /*------------------------------------------------------------------------*/

    const [view_idx, set_view_idx] = useState<number>(0);
    const [is_ready, set_is_ready] = useState<boolean>(false);

    const scroll_callback = useCallback((e: Event) => {
        const scroll_position = document.body.scrollTop;
        console.log(scroll_position);
        const idx = Math.floor(scroll_position / view_height);
        if (idx !== view_idx) { set_view_idx(idx); }
    }, [view_idx]);

    /*------------------------------------------------------------------------*/

    useEffect(() => {
        if (canvas_ref.current === null) { return; }
        if (renderer_ref.current !== null) { return; }

        renderer_ref.current = new Renderer(canvas_ref.current);
        (async (renderer: Renderer) => {
            const camera_position = views[0].camera_position;
            const target_position = views[0].target_position;
            renderer.set_camera_position(camera_position[0], camera_position[1], camera_position[2]);
            renderer.set_camera_target_position(target_position[0], target_position[1], target_position[2]);
            await renderer.load_hdr_envmap("envmaps/hdri.hdr", 0.1, [180.0, 0.0, 0.0]);
            await renderer.load_gltf_model("models/mcl39/mcl39.gltf");
        })(renderer_ref.current).then(() => {
            set_is_ready(true);
            renderer_ref.current?.run();
        });

        return () => renderer_ref.current?.destroy();
    }, [canvas_ref]);

    useEffect(() => {
        if (renderer_ref.current === null) { return; }
        const camera_position = views[view_idx].camera_position;
        const target_position = views[view_idx].target_position;
        renderer_ref.current.set_camera_position(camera_position[0], camera_position[1], camera_position[2]);
        renderer_ref.current.set_camera_target_position(target_position[0], target_position[1], target_position[2]);
        renderer_ref.current.set_camera_controls_active(view_idx === (views.length - 1));
    }, [view_idx]);

    useEffect(() => {
        addEventListener("scroll", scroll_callback);
        return () => removeEventListener("scroll", scroll_callback);
    }, [scroll_callback]);

    /*------------------------------------------------------------------------*/
    
    return (
        <div className="viewer-container --fullscreen">
            <canvas className="--fullscreen" ref={canvas_ref} />
        </div>
    );
    
    /*------------------------------------------------------------------------*/

}

/*----------------------------------------------------------------------------*/