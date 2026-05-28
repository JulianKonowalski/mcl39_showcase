import * as THREE from "three";

/*----------------------------------------------------------------------------*/

import { HDRLoader }        from "three/examples/jsm/loaders/HDRLoader.js";
import { GLTFLoader }       from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls }    from 'three/addons/controls/OrbitControls.js';

/*----------------------------------------------------------------------------*/

import JEASINGS from "jeasings";
import * as POSTPROCESSING from "postprocessing";
import { degToRad } from "three/src/math/MathUtils.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/Addons.js";

/*----------------------------------------------------------------------------*/

export default class Renderer {

    /*------------------------------------------------------------------------*/

    constructor(target: HTMLCanvasElement) {
        addEventListener("resize", this.#on_resize.bind(this));

        this.#target = target;

        {
            RectAreaLightUniformsLib.init();
            const area_light_intensity = 10;
            const area_light_width = 5.1;
            const area_light_height = 2.3;
            const area_light_1 = new THREE.RectAreaLight(0xEB5C06, area_light_intensity, area_light_width, area_light_height);
            area_light_1.position.set(-4.0, 1.18, 0.0);
            area_light_1.lookAt(0.0, 1.18, 0.0);
            this.#scene.add(area_light_1);

            const area_light_2 = new THREE.RectAreaLight(0xFFFFFF, area_light_intensity / 4, area_light_width, area_light_height); 
            area_light_2.position.set(4, 1, 6);
            area_light_2.lookAt(0, 0, 0);
            this.#scene.add(area_light_2);

            const area_light_3 = new THREE.RectAreaLight(0xFFFFFF, area_light_intensity / 2, area_light_width, area_light_height); 
            area_light_3.position.set(-4, 2, -6);
            area_light_3.lookAt(0, 0, 0);
            this.#scene.add(area_light_3);

            const area_light_4 = new THREE.RectAreaLight(0xEB5C06, area_light_intensity / 2, area_light_width * 2, area_light_height * 2); 
            area_light_4.position.set(0, 8, 0);
            area_light_4.lookAt(0, 0, 0);
            this.#scene.add(area_light_4);
        }

        this.#camera_controls           = new OrbitControls(this.#camera, this.#target);
        this.#camera_controls.enabled       = false;
        this.#camera_controls.enablePan     = false;
        this.#camera_controls.enableZoom    = false;
        this.#camera_controls.enableDamping = true;

        this.#renderer                      = new THREE.WebGLRenderer({canvas: this.#target, antialias: true });
        this.#renderer.shadowMap.enabled    = true;
        this.#renderer.shadowMap.type       = THREE.PCFSoftShadowMap
        this.#renderer.toneMapping          = THREE.ACESFilmicToneMapping;
        this.#renderer.outputColorSpace     = THREE.SRGBColorSpace;
        this.#renderer.setPixelRatio(window.devicePixelRatio);

        this.#composer = new POSTPROCESSING.EffectComposer(this.#renderer, { frameBufferType: THREE.HalfFloatType });
        this.#composer.addPass(new POSTPROCESSING.RenderPass(this.#scene, this.#camera));
        this.#composer.addPass(new POSTPROCESSING.EffectPass(this.#camera, this.#dof_effect));
        this.#composer.addPass(new POSTPROCESSING.EffectPass(this.#camera, new POSTPROCESSING.BloomEffect()));

        this.#on_resize(new UIEvent("resize"));
    }

    /*------------------------------------------------------------------------*/
    
    destroy() {
        removeEventListener("resize", this.#on_resize.bind(this));

        this.#renderer?.dispose();
        this.#camera_controls?.dispose();
        this.#dof_effect.dispose();
        this.#composer?.dispose();
    }

    /*------------------------------------------------------------------------*/

    async load_hdr_envmap(hdr_envmap_path: string, intensity: number, rotation: number[]) {
        try {
            const envmap            = await new HDRLoader().loadAsync(hdr_envmap_path);
            envmap.mapping          = THREE.EquirectangularReflectionMapping;
            
            this.#scene.environment             = envmap;
            this.#scene.environmentIntensity    = intensity;
            this.#scene.environmentRotation     = new THREE.Euler(
                degToRad(rotation[0]),
                degToRad(rotation[1]),
                degToRad(rotation[2])
            );
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

    set_camera_position(x_pos: number, y_pos: number, z_pos: number) {
        new JEASINGS.JEasing(this.#camera.position).to(
            { x: x_pos, y: y_pos, z: z_pos },
            1000          
        ).easing(
            JEASINGS.Cubic.InOut
        ).start().onComplete(() => {
            const target = this.#camera_controls?.target;
            if (target === undefined) { return; }
            this.#dof_effect.target = target;
        });
    }

    /*------------------------------------------------------------------------*/

    set_camera_target_position(x_pos: number, y_pos: number, z_pos: number) {
        if (!this.#camera_controls) { return; }
        new JEASINGS.JEasing(this.#camera_controls?.target).to(
            { x: x_pos, y: y_pos, z: z_pos },
            1000
        ).easing(
            JEASINGS.Cubic.InOut
        ).start().onComplete(() => {
            const target = this.#camera_controls?.target;
            if (target === undefined) { return; }
            this.#dof_effect.target = target;
            const dist = this.#dof_effect.calculateFocusDistance(target);
            this.#dof_effect.bokehScale = 5 / dist;
        });
    }

    /*------------------------------------------------------------------------*/

    set_camera_controls_active(state: boolean) {
        if (!this.#camera_controls) { return; }
        this.#camera_controls.enabled = state;

        if (state) {
            this.#camera_controls.minPolarAngle = 3.14 * 0.25;
            this.#camera_controls.maxPolarAngle = 3.14 * 0.50;
        } else {
            this.#camera_controls.minPolarAngle = 0;
            this.#camera_controls.maxPolarAngle = 3.14;
        }
    }

    /*------------------------------------------------------------------------*/

    run() {
        requestAnimationFrame(this.#on_frame.bind(this));
    }

    /*------------------------------------------------------------------------*/
    
    #on_resize(resize_event: UIEvent) {
        if (!this.#target) { return; }

        this.#vp_width  = this.#target.clientWidth;
        this.#vp_height = this.#target.clientHeight;

        this.#renderer?.setSize(this.#vp_width, this.#vp_height, false);
        this.#composer?.setSize(this.#vp_width, this.#vp_height, false);

        (this.#camera as THREE.PerspectiveCamera).aspect = this.#vp_width / this.#vp_height;
        (this.#camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    /*------------------------------------------------------------------------*/
    
    #on_frame() {
        this.#camera_controls?.update();
        JEASINGS.update();
        this.#composer?.render();

        requestAnimationFrame(this.#on_frame.bind(this));
    }

    /*------------------------------------------------------------------------*/
 
    #vp_width   = 0;
    #vp_height  = 0;
    #target: HTMLCanvasElement | null   = null;

    #scene  = new THREE.Scene();
    #camera = new THREE.PerspectiveCamera(30.0, 1, 0.1, 100.0);
    #renderer: THREE.WebGLRenderer | null   = null;

    #camera_controls: OrbitControls | null  = null;

    #composer: POSTPROCESSING.EffectComposer | null = null;
    #dof_effect = new POSTPROCESSING.DepthOfFieldEffect(this.#camera);

    /*------------------------------------------------------------------------*/

};

/*----------------------------------------------------------------------------*/