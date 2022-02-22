import {
  Panel,
  Group,
  layoutConfig,
  navbar,
  AssetsResource,
  VLayout,
  jsx,
  GestureContainer,
  createRef,
  modal,
  Gravity,
  Color,
} from "doric";
import THREE from "three";
import { OrbitControls, ThreeView, loadGLTF } from "doric-three";

@Entry
class Example extends Panel {
  onShow() {
    navbar(context).setTitle("GLTF");
  }
  build(root: Group) {
    const ref = createRef<GestureContainer>();
    const ref2 = createRef<GestureContainer>();

    <VLayout
      backgroundColor={Color.parse("#bfe3dd")}
      parent={root}
      layoutConfig={layoutConfig().most()}
      gravity={Gravity.Center}
    >
      <GestureContainer ref={ref}>
        <ThreeView
          layoutConfig={layoutConfig().most()}
          gestureRef={ref}
          transparentBackground={true}
          onInited={async (renderer) => {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(
              40,
              renderer.domElement.width / renderer.domElement.height,
              1,
              100
            );
            camera.position.set(5, 2, 2);
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

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(0, 0.5, 0);
            controls.update();
            controls.enablePan = false;
            controls.enableDamping = true;
            const requestAnimationFrame = (func: () => void) => {
              setTimeout(func, 16);
            };
            try {
              const gltf = await loadGLTF(
                this.context,
                new AssetsResource("qishi.glb")
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
              model.scale.set(1, 1, 1);
              scene.add(model);
              mixer = new THREE.AnimationMixer(model);
              gltf.animations.forEach((e) => {
                mixer.clipAction(e).play();
              });
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
