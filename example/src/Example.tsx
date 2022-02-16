import {
  Panel,
  Group,
  layoutConfig,
  navbar,
  AssetsResource,
  Image,
  VLayout,
  jsx,
  GestureContainer,
  createRef,
  modal,
} from "doric";
import THREE from "three";
import { OrbitControls, ThreeView, loadGLTF } from "doric-three";
import { vsync } from "dangle";

@Entry
class Example extends Panel {
  onShow() {
    navbar(context).setTitle("GLTF");
  }
  build(root: Group) {
    const ref = createRef<GestureContainer>();
    <VLayout parent={root} layoutConfig={layoutConfig().most()}>
      <Image image={new AssetsResource("logo_doric.png")} />
      <GestureContainer ref={ref}>
        <ThreeView
          layoutConfig={layoutConfig().just()}
          width={300}
          height={300}
          gestureRef={ref}
          onInited={async (renderer) => {
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

            const controls = new OrbitControls(
              camera,
              renderer.domElement
            ) as any;
            controls.target.set(0, 0.5, 0);
            controls.update();
            controls.enablePan = false;
            controls.enableDamping = true;
            const requestAnimationFrame = vsync(
              this.context
            ).requestAnimationFrame;
            try {
              const gltf = await loadGLTF(
                this.context,
                new AssetsResource("threejs/LittlestTokyo/LittlestTokyo.gltf")
              );
              let mixer: THREE.AnimationMixer;
              const clock = new THREE.Clock();
              function animate() {
                requestAnimationFrame(animate);
                const delta = clock.getDelta();
                mixer.update(delta);
                controls.update();
                renderer.render(scene, camera);
              }
              const model = gltf.scene;
              model.position.set(1, 1, 0);
              model.scale.set(0.01, 0.01, 0.01);
              scene.add(model);
              mixer = new THREE.AnimationMixer(model);
              mixer.clipAction(gltf.animations[0]).play();
              animate();
            } catch (error) {
              modal(this.context).alert(`${error}`);
            }
          }}
        />
      </GestureContainer>
    </VLayout>;
  }
}
