import {
  Panel,
  Group,
  layoutConfig,
  Gravity,
  navbar,
  GestureContainer,
  Color,
  createRef,
  jsx,
  Image,
  VLayout,
  AssetsResource,
  Text,
  loge,
  RotationAnimation,
  TimingFunction,
} from "doric";
import { vsync } from "dangle";
import * as THREE from "three";
import { OrbitControls, ThreeView, GLTFLoader, RGBELoader } from "doric-three";

@Entry
export class webgl_loader_gltf_fullscreen extends Panel {
  onShow() {
    navbar(context).setTitle("webgl_loader_gltf_fullscreen");
  }
  build(root: Group) {
    const gestureRef = createRef<GestureContainer>();
    const threeRef = createRef<ThreeView>();
    const loadingIconRef = createRef<Image>();
    const loadingRef = createRef<VLayout>();
    <VLayout
      backgroundColor={Color.parse("#bfe3dd")}
      parent={root}
      layoutConfig={layoutConfig().most()}
      gravity={Gravity.Center}
    >
      <GestureContainer ref={gestureRef} layoutConfig={layoutConfig().most()}>
        <VLayout
          ref={loadingRef}
          layoutConfig={layoutConfig().fit().configAlignment(Gravity.Center)}
          gravity={Gravity.Center}
          space={20}
        >
          <Image
            ref={loadingIconRef}
            image={new AssetsResource("icon_loading.png")}
            layoutConfig={layoutConfig().just()}
            width={50}
            height={50}
          ></Image>
          <Text textSize={20} textColor={Color.GRAY}>
            Loading...
          </Text>
        </VLayout>
        <ThreeView
          ref={threeRef}
          gestureRef={gestureRef}
          layoutConfig={layoutConfig().most()}
          transparentBackground={true}
          onInited={async (renderer) => {
            try {
              const scene = new THREE.Scene();
              const camera = new THREE.PerspectiveCamera(
                45,
                renderer.domElement.width / renderer.domElement.height,
                0.25,
                500
              );
              camera.position.set(5, 4, 0);
              {
                const color = 0xb0dfff;
                const intensity = 0.5;
                const light = new THREE.DirectionalLight(color, intensity);
                light.position.set(12.168, 7.03, 5.3117);
                light.rotation.set(-0.05, 1.117, 0.651);
                light.scale.set(4, 4, 4);
                scene.add(light);

                const lightHelper = new THREE.DirectionalLightHelper(light);
                // scene.add(lightHelper);
              }

              {
                const color = 0xb66aff;
                const intensity = 0.2;
                const light = new THREE.DirectionalLight(color, intensity);
                light.position.set(11.092, 3.5213, -4.9768);
                light.rotation.set(0, 1.349, -0.55);
                light.scale.set(4, 4, 4);
                scene.add(light);

                const lightHelper = new THREE.DirectionalLightHelper(light);
                // scene.add(lightHelper);
              }
              const controls = new OrbitControls(camera, renderer.domElement);
              controls.target.set(4.9, 3.9, 0);
              controls.update();
              controls.enablePan = false;
              controls.enableDamping = true;
              controls.minDistance = 1;
              controls.maxDistance = 100;
              controls.zoomSpeed = 0.5;
              const requestAnimationFrame = vsync(
                this.context
              ).requestAnimationFrame;
              const rgbeLoader = new RGBELoader();
              const hdrRes = new AssetsResource(
                "Joost_Vanhoutte-Experiment_0001_4k.hdr"
              );
              const texture = await rgbeLoader.load(this.context, hdrRes);
              if (!!texture) {
                loge("texture is", typeof texture);
                texture.mapping = THREE.EquirectangularRefractionMapping;
                scene.background = texture;
                scene.environment = texture;
              }
              loge("start loading gltf");
              const loader = new GLTFLoader(this.context, renderer);
              const gltf = await loader.load(
                new AssetsResource("threejs/hall/hall.gltf"),
                true
              );
              let mixer: THREE.AnimationMixer;
              const clock = new THREE.Clock();
              const model = gltf.scene;
              model.position.set(0, 0, 0);
              scene.add(model);
              mixer = new THREE.AnimationMixer(model);
              gltf.animations.forEach((e) => {
                mixer.clipAction(e).play();
              });
              function animate() {
                const delta = clock.getDelta();
                mixer.update(delta);
                controls.update();
                renderer.render(scene, camera);
                requestAnimationFrame(animate);
              }
              animate();
              for (let pendingTexture of gltf.pendingTextures) {
                await loader.loadTexture(pendingTexture);
                renderer.render(scene, camera);
              }
              loadingIconRef.current.stopAnimating(this.context);
              loadingRef.current.hidden = true;
            } catch (e) {
              if (e instanceof Error) {
                loge(e.message, e.stack);
              }
            }
          }}
        />
      </GestureContainer>
    </VLayout>;
    const rotationAnimation = new RotationAnimation();
    rotationAnimation.fromRotation = 0;
    rotationAnimation.toRotation = 2;
    rotationAnimation.repeatCount = -1;
    rotationAnimation.duration = 3000;
    rotationAnimation.timingFunction = TimingFunction.Linear;
    this.addOnRenderFinishedCallback(() => {
      loadingIconRef.current.doAnimation(this.context, rotationAnimation);
    });
  }
}
