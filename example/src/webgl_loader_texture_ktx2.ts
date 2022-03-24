import {
  Panel,
  Group,
  vlayout,
  layoutConfig,
  Gravity,
  navbar,
  Color,
  AssetsResource,
  GestureContainer,
  gestureContainer,
} from "doric";
import { dangleView, DangleWebGLRenderingContext, vsync } from "dangle";

import * as THREE from "three";
import { OrbitControls, KTX2Loader } from "doric-three";

@Entry
export class webgl_loader_texture_ktx2 extends Panel {
  private gestureView?: GestureContainer;

  onShow() {
    navbar(this.context).setTitle("webgl_loader_texture_ktx2");
  }
  build(rootView: Group) {
    const self = this;

    vlayout([
      (this.gestureView = gestureContainer([], {
        layoutConfig: layoutConfig().just(),
        width: 300,
        height: 300,
        backgroundColor: Color.BLACK,
      })),
    ])
      .apply({
        layoutConfig: layoutConfig().fit().configAlignment(Gravity.Center),
        space: 20,
        gravity: Gravity.Center,
      })
      .in(rootView);

    this.gestureView.addChild(
      dangleView({
        onReady: async (gl: DangleWebGLRenderingContext) => {
          const width = (gl as any).drawingBufferWidth;
          const height = (gl as any).drawingBufferHeight;

          const inputCanvas = {
            width: width,
            height: height,
            style: {},
            addEventListener: ((
              name: string,
              fn: (event: {
                pageX: number;
                pageY: number;
                pointerType: string;
              }) => void
            ) => {
              if (name == "pointerdown") {
                self.gestureView!!.onTouchDown = ({ x, y }) => {
                  fn({
                    pageX: x * Environment.screenScale,
                    pageY: y * Environment.screenScale,
                    pointerType: "touch",
                  });
                };
              } else if (name == "pointerup") {
                self.gestureView!!.onTouchUp = ({ x, y }) => {
                  fn({
                    pageX: x * Environment.screenScale,
                    pageY: y * Environment.screenScale,
                    pointerType: "touch",
                  });
                };
              } else if (name == "pointermove") {
                self.gestureView!!.onTouchMove = ({ x, y }) => {
                  fn({
                    pageX: x * Environment.screenScale,
                    pageY: y * Environment.screenScale,
                    pointerType: "touch",
                  });
                };
              } else if (name == "pointercancel") {
                self.gestureView!!.onTouchCancel = ({ x, y }) => {
                  fn({
                    pageX: x * Environment.screenScale,
                    pageY: y * Environment.screenScale,
                    pointerType: "touch",
                  });
                };
              }
            }) as any,
            removeEventListener: (() => {}) as any,
            setPointerCapture: (() => {}) as any,
            releasePointerCapture: (() => {}) as any,
            clientHeight: height,
            getContext: (() => {
              return gl;
            }) as any,
          } as any;

          let window = {
            innerWidth: width,
            innerHeight: height,
            devicePixelRatio: 1,
            addEventListener: (() => {}) as any,
          };

          const requestAnimationFrame = vsync(context).requestAnimationFrame;

          //#region code to impl

          const renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: inputCanvas,
          });
          renderer.setSize(width, height);
          renderer.outputEncoding = THREE.sRGBEncoding;

          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0x202020);

          const camera = new THREE.PerspectiveCamera(
            60,
            width / height,
            0.1,
            100
          );
          camera.position.set(2, 1.5, 1);
          camera.lookAt(scene.position);
          scene.add(camera);

          const controls = new OrbitControls(camera, renderer.domElement);
          controls.autoRotate = true;

          // PlaneGeometry UVs assume flipY=true, which compressed textures don't support.
          const geometry = flipY(new THREE.PlaneGeometry());
          const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);

          const formatStrings = {
            [THREE.RGBAFormat]: "RGBA32",
            [THREE.RGBA_BPTC_Format]: "RGBA_BPTC",
            [THREE.RGBA_ASTC_4x4_Format]: "RGBA_ASTC_4x4",
            [THREE.RGB_S3TC_DXT1_Format]: "RGB_S3TC_DXT1",
            [THREE.RGBA_S3TC_DXT5_Format]: "RGBA_S3TC_DXT5",
            [THREE.RGB_PVRTC_4BPPV1_Format]: "RGB_PVRTC_4BPPV1",
            [THREE.RGBA_PVRTC_4BPPV1_Format]: "RGBA_PVRTC_4BPPV1",
            [THREE.RGB_ETC1_Format]: "RGB_ETC1",
            [THREE.RGB_ETC2_Format]: "RGB_ETC2",
            [THREE.RGBA_ETC2_EAC_Format]: "RGB_ETC2_EAC",
          };

          // Samples: sample_etc1s.ktx2, sample_uastc.ktx2, sample_uastc_zstd.ktx2
          const loader = new KTX2Loader(renderer);

          animate();

          try {
            const texture = (await loader.loadTexture(
              self.context,
              new AssetsResource("sample_uastc_zstd.ktx2")
            )) as THREE.Texture;

            console.info(`transcoded to ${formatStrings[texture.format]}`);

            material.map = texture;
            material.transparent = true;

            material.needsUpdate = true;
          } catch (e) {
            console.error(e);
          }

          function animate() {
            requestAnimationFrame(animate);

            controls.update();

            renderer.render(scene, camera);

            gl.endFrame();
          }

          window.addEventListener("resize", onWindowResize);

          function onWindowResize() {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }

          /** Correct UVs to be compatible with `flipY=false` textures. */
          function flipY(geometry: THREE.BufferGeometry) {
            const uv = geometry.attributes.uv;

            for (let i = 0; i < uv.count; i++) {
              uv.setY(i, 1 - uv.getY(i));
            }

            return geometry;
          }

          //#endregion
        },
      }).apply({
        layoutConfig: layoutConfig().just(),
        width: 300,
        height: 300,
      })
    );
  }
}
