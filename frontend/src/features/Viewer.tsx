import React, { useEffect, useRef } from "react";


import Renderer from "../renderer/renderer";

/*----------------------------------------------------------------------------*/

export default function Viewer() {

    const canvas_ref    = useRef<HTMLCanvasElement | null>(null);
    const renderer_ref  = useRef<Renderer | null>(null);

    useEffect(() => {
        if (canvas_ref.current === null) { return; }
        if (renderer_ref.current !== null) { return; }

        renderer_ref.current = new Renderer(canvas_ref.current);
        (async () => {
            await renderer_ref.current?.load_hdr_envmap("envmaps/ferndale_studio.hdr");
            await renderer_ref.current?.load_gltf_model("models/mcl39/scene.gltf");
        })();
    }, [canvas_ref]);

    return (
        <div>
            <canvas id="viewer" ref={canvas_ref} className="--fullscreen"/>
        </div>
    )
}

/*----------------------------------------------------------------------------*/