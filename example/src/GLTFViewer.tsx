import {
  Panel,
  Group,
  layoutConfig,
  navbar,
  VLayout,
  jsx,
  GestureContainer,
  createRef,
  Gravity,
  Color,
  loge,
  navigator,
  modal,
  Image,
  AssetsResource,
  Text,
  RotationAnimation,
  TimingFunction,
} from "doric";
import THREE from "three";
import { OrbitControls, ThreeView, GLTFLoader, RGBELoader } from "doric-three";
import { vsync } from "dangle";
import { DemoData } from "./data";

@Entry
export class GLTFViewer extends Panel {
  get data() {
    const initData = this.getInitData() as { index: number };
    return DemoData[initData.index];
  }
  onShow() {
    navbar(this.context).setTitle(this.data.title);
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
          />
          <Text textSize={20} textColor={Color.GRAY}>
            Loading...
          </Text>
        </VLayout>
        <ThreeView
          ref={threeRef}
          enableCmdRecord={true}
          gestureRef={gestureRef}
          layoutConfig={layoutConfig().most()}
          transparentBackground={true}
          onInited={async (renderer) => {
            try {
              const loader = new GLTFLoader(this.context, renderer);
              if (!!!this.data.resource) {
                modal(this.context).toast("Resource is empty!");
                navigator(this.context).pop();
                return;
              }
              const gltf = await loader.load(this.data.resource, true);
              const model = gltf.scene;
              let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
              if (gltf.cameras.length > 0) {
                camera = gltf.cameras[0];
              } else {
                camera = new THREE.PerspectiveCamera(
                  50,
                  renderer.domElement.width / renderer.domElement.height,
                  1,
                  100
                );
                camera.position.set(0, 0, 5);
                const size = new THREE.Vector3();
                new THREE.Box3().setFromObject(model).getSize(size);
                model.scale.set(2 / size.x, 2 / size.x, 2 / size.x);
              }
              const controls = new OrbitControls(camera, renderer.domElement);
              controls.update();
              controls.enablePan = false;
              controls.enableDamping = true;
              if (camera instanceof THREE.PerspectiveCamera) {
                controls.minDistance = camera.near;
                controls.maxDistance = camera.far;
                camera.aspect =
                  renderer.domElement.width / renderer.domElement.height;
              } else {
                controls.minDistance = 1;
                controls.maxDistance = 100;
              }
              controls.zoomSpeed = 0.5;
              const requestAnimationFrame = vsync(
                this.context
              ).requestAnimationFrame;
              const clock = new THREE.Clock();
              let mixer = new THREE.AnimationMixer(model);
              if (gltf.animations.length > 0) {
                mixer.clipAction(gltf.animations[0]).play();
              }
              const scene = new THREE.Scene();
              scene.add(model);
              function animate() {
                const delta = clock.getDelta();
                mixer.update(delta);
                controls.update();
                threeRef.current.glCmds = [];
                renderer.render(scene, camera);
                loge(`command length:${threeRef.current.glCmds.length}`);
                requestAnimationFrame(animate);
              }
              animate();
              for (let pendingTexture of gltf.pendingTextures) {
                await loader.loadTexture(pendingTexture);
                renderer.render(scene, camera);
              }
              loadingIconRef.current.stopAnimating(this.context);
              loadingRef.current.hidden = true;
              const rgbeLoader = new RGBELoader();
              const hdrRes = new AssetsResource("footprint_court.hdr");
              const texture = await rgbeLoader.load(this.context, hdrRes);
              if (!!texture) {
                loge("texture is", typeof texture);
                texture.mapping = THREE.EquirectangularReflectionMapping;
                //scene.background = texture;
                scene.environment = texture;
              }
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
