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
import { vsync } from "dangle";
import { loge } from "doric/lib/src/util/log";

@Entry
class Example extends Panel {
  onShow() {
    navbar(context).setTitle("GLTF");
  }
  build(root: Group) {
    const ref = createRef<GestureContainer>();
    const ref2 = createRef<GestureContainer>();

    <VLayout
      backgroundColor={Color.YELLOW}
      parent={root}
      layoutConfig={layoutConfig().most()}
      gravity={Gravity.Center}
      space={20}
    >
      <GestureContainer ref={ref}>
        <ThreeView
          layoutConfig={layoutConfig().just()}
          width={300}
          height={300}
          gestureRef={ref}
          transparentBackground={true}
          onInited={async (renderer) => {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xbfe3dd);
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

            const controls = new OrbitControls(
              camera,
              renderer.domElement
            ) as any;
            controls.target.set(0, 0.5, 0);
            controls.update();
            controls.enablePan = false;
            controls.enableDamping = true;
            const requestAnimationFrame = (func: Function) => {
              setTimeout(func, 16);
            };
            try {
              const gltf = await loadGLTF(
                this.context,
                new AssetsResource("qishi.gltf")
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
      {/* <GestureContainer ref={ref2}>
        <ThreeView
          layoutConfig={layoutConfig().just()}
          width={300}
          height={300}
          gestureRef={ref2}
          onInited={async (renderer) => {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xbfe3dd);
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

            const controls = new OrbitControls(
              camera,
              renderer.domElement
            ) as any;
            controls.target.set(0, 0.5, 0);
            controls.update();
            controls.enablePan = false;
            controls.enableDamping = true;
            const requestAnimationFrame = (func: Function) => {
              setTimeout(func, 16);
            };
            try {
              const gltf = await loadGLTF(
                this.context,
                new AssetsResource("qishi.gltf")
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
      </GestureContainer> */}
    </VLayout>;
  }
}
