import { vsync } from "dangle";
import {
  layoutConfig,
  GestureContainer,
  loge,
  BridgeContext,
  ViewComponent,
  Resource,
} from "doric";
import THREE from "three";
import { OrbitControls } from "./controls/OrbitControls";
import { GLTF, GLTFLoader } from "./loaders/GLTFLoader";
import { ThreeView } from "./ThreeView";

@ViewComponent
export class GLTFView extends GestureContainer {
  threeView: ThreeView;
  touchable = true;
  context?: BridgeContext;
  res?: Resource;
  onLoaded?: (gltf: GLTF) => void;
  constructor() {
    super();
    this.threeView = new ThreeView();
    this.threeView.layoutConfig = layoutConfig().most();
    this.addChild(this.threeView);
    this.threeView.gesture = this;
    this.threeView.onInited = (renderer) => {
      if (!!!this.context) {
        throw new Error("Please set context for GLTFView");
      }
      if (!!!this.res) {
        throw new Error("Please set resource for GLTFView");
      }
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xbfe3dd);
      const camera = new THREE.PerspectiveCamera(
        40,
        renderer.domElement.width / renderer.domElement.height,
        1,
        100
      );
      camera.position.set(5, 2, 8);

      {
        const skyColor = 0xffffff;
        const groundColor = 0xffffff; // brownish orange
        const intensity = 1;
        const light = new THREE.HemisphereLight(
          skyColor,
          groundColor,
          intensity
        );
        scene.add(light);
      }

      {
        const color = 0xffffff;
        const intensity = 1.5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(5, 10, 2);
        scene.add(light);
      }

      const controls = new OrbitControls(camera, renderer.domElement) as any;
      controls.target.set(0, 0.5, 0);
      controls.update();
      controls.enablePan = false;
      controls.enableDamping = true;
      const loader = new GLTFLoader(this.context);
      let mixer: THREE.AnimationMixer;
      const clock = new THREE.Clock();
      const requestAnimationFrame = vsync(this.context).requestAnimationFrame;
      function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        mixer.update(delta);
        controls.update();
        renderer.render(scene, camera);
      }
      try {
        loader.load(
          this.res,
          (gltf) => {
            this.onLoaded?.(gltf);
            const model = gltf.scene;
            model.position.set(1, 1, 0);
            model.scale.set(0.01, 0.01, 0.01);
            scene.add(model);
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
            animate();
          },
          undefined,
          function (e: any) {
            loge(e);
          }
        );
      } catch (error: any) {
        loge(error.stack);
      }
    };
  }
}
