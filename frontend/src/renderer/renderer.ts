import {
    Scene,
    Color,
    Camera,
    WebGLRenderer,
    PerspectiveCamera,
    EquirectangularReflectionMapping,
    SRGBColorSpace,
    ACESFilmicToneMapping
} from "three";

import { HDRLoader }        from "three/examples/jsm/loaders/HDRLoader.js";
import { GLTFLoader }       from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls }    from 'three/addons/controls/OrbitControls.js';

/*----------------------------------------------------------------------------*/

export default class Renderer {

    /*------------------------------------------------------------------------*/

    constructor(target: HTMLCanvasElement) {
        addEventListener("resize", this.#on_resize.bind(this));

        this.#target = target;

        this.#scene.background = new Color().setRGB(0, 0, 0);

        this.#renderer = new WebGLRenderer({canvas: this.#target, antialias: true});
        this.#renderer.setPixelRatio(window.devicePixelRatio);
        this.#renderer.outputColorSpace = SRGBColorSpace;
        this.#renderer.toneMapping = ACESFilmicToneMapping;
        this.#renderer.setAnimationLoop(this.#on_frame.bind(this));

        this.#camera.position.set(8.0, 0.0, 0.0);

        this.#camera_controls               = new OrbitControls(this.#camera, this.#target);
        this.#camera_controls.enablePan     = false;
        this.#camera_controls.minDistance   = 1.0;
        this.#camera_controls.maxDistance   = 10.0;        

        this.#on_resize(new UIEvent("resize"));
    }

    /*------------------------------------------------------------------------*/
    
    destroy() {
        removeEventListener("resize", this.#on_resize.bind(this));

        this.#renderer?.dispose();
        this.#camera_controls?.dispose();
    }

    /*------------------------------------------------------------------------*/

    async load_hdr_envmap(hdr_envmap_path: string) {
        try {
            const envmap            = await new HDRLoader().loadAsync(hdr_envmap_path);
            envmap.mapping          = EquirectangularReflectionMapping;
            this.#scene.environment = envmap;
        } catch(e) {
            console.log(`Failed to load ${hdr_envmap_path}:\n${e}`);
            return;
        }
    }

    /*------------------------------------------------------------------------*/
    
    async load_gltf_model(gltf_model_path: string) {
        const gltf      = await new GLTFLoader().loadAsync(gltf_model_path);
        const model     = gltf.scene;

        this.#renderer?.compileAsync(model, this.#camera, this.#scene);
        this.#scene.add(model);
    }

    /*------------------------------------------------------------------------*/
    
    #on_resize(resize_event: UIEvent) {
        if (!this.#target) { return; }

        this.#vp_width  = this.#target.clientWidth;
        this.#vp_height = this.#target.clientHeight;

        this.#renderer?.setSize(this.#vp_width, this.#vp_height, false);

        (this.#camera as PerspectiveCamera).aspect = this.#vp_width / this.#vp_height;
        (this.#camera as PerspectiveCamera).updateProjectionMatrix();
    }

    /*------------------------------------------------------------------------*/
    
    #on_frame() {
        this.#camera_controls?.update();
        this.#renderer?.render(this.#scene, this.#camera);
    }

    /*------------------------------------------------------------------------*/
    
    #vp_width: number                   = 0;
    #vp_height: number                  = 0;
    #target: HTMLCanvasElement | null   = null;

    #scene: Scene                   = new Scene();
    #camera: Camera                 = new PerspectiveCamera(40.0, 1, 0.1, 100.0);
    #renderer: WebGLRenderer | null = null;

    #camera_controls: OrbitControls | null = null;

    /*------------------------------------------------------------------------*/

};

/*----------------------------------------------------------------------------*/