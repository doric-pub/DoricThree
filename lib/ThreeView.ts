// @ts-nocheck
import { GestureContainer, Ref, ViewComponent } from "doric";
import { DangleView, DangleWebGLRenderingContext } from "dangle";
import THREE from "three";

@ViewComponent
export class ThreeView extends DangleView {
  onInited?: (renderer: THREE.WebGLRenderer) => void;
  touchable = true;
  gl?: DangleWebGLRenderingContext;
  gestureRef?: Ref<GestureContainer>;
  transparentBackground = false;
  isDirty() {
    this.gl?.endFrame();
    return super.isDirty();
  }

  private addEventListener?: (
    name: string,
    fn: (event: { pageX: number; pageY: number; pointerType: string }) => void
  ) => void;
  constructor() {
    super();
    this.onReady = (gl: DangleWebGLRenderingContext) => {
      if (this.gestureRef && this.gestureRef.current) {
        this.gesture = this.gestureRef.current;
      }
      this.gl = gl;
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const inputCanvas = {
        width: width,
        height: height,
        style: {},
        addEventListener: this.addEventListener,
        removeEventListener: (() => {}) as any,
        setPointerCapture: (() => {}) as any,
        releasePointerCapture: (() => {}) as any,
        clientWidth: width,
        clientHeight: height,
        getContext: (() => {
          return gl;
        }) as any,
      };
      let window = {
        innerWidth: width,
        innerHeight: height,
        devicePixelRatio: 1,
        addEventListener: (() => {}) as any,
      };
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: inputCanvas,
        alpha: this.transparentBackground,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.outputEncoding = THREE.sRGBEncoding;
      this.onInited?.(renderer);
    };
  }
  set gesture(v: GestureContainer) {
    this.addEventListener = (
      name: string,
      fn: (event: { pageX: number; pageY: number; pointerType: string }) => void
    ) => {
      if (name == "pointerdown") {
        v.onTouchDown = ({ x, y }) => {
          fn({
            pageX: x * Environment.screenScale,
            pageY: y * Environment.screenScale,
            pointerType: "touch",
          });
        };
      } else if (name == "pointerup") {
        v.onTouchUp = ({ x, y }) => {
          fn({
            pageX: x * Environment.screenScale,
            pageY: y * Environment.screenScale,
            pointerType: "touch",
          });
        };
      } else if (name == "pointermove") {
        v.onTouchMove = ({ x, y }) => {
          fn({
            pageX: x * Environment.screenScale,
            pageY: y * Environment.screenScale,
            pointerType: "touch",
          });
        };
      } else if (name == "pointercancel") {
        v.onTouchCancel = ({ x, y }) => {
          fn({
            pageX: x * Environment.screenScale,
            pageY: y * Environment.screenScale,
            pointerType: "touch",
          });
        };
      }
    };
  }
}
