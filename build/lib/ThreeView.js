var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// @ts-nocheck
import { ViewComponent } from "doric";
import { DangleView } from "dangle";
import THREE from "three";
let ThreeView = class ThreeView extends DangleView {
    constructor() {
        super();
        this.touchable = true;
        this.transparentBackground = false;
        this.onReady = (gl) => {
            var _a;
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
                removeEventListener: (() => { }),
                setPointerCapture: (() => { }),
                releasePointerCapture: (() => { }),
                clientWidth: width,
                clientHeight: height,
                getContext: (() => {
                    return gl;
                }),
            };
            let window = {
                innerWidth: width,
                innerHeight: height,
                devicePixelRatio: 1,
                addEventListener: (() => { }),
            };
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                canvas: inputCanvas,
                alpha: this.transparentBackground,
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.outputEncoding = THREE.sRGBEncoding;
            (_a = this.onInited) === null || _a === void 0 ? void 0 : _a.call(this, renderer);
        };
    }
    isDirty() {
        var _a;
        (_a = this.gl) === null || _a === void 0 ? void 0 : _a.endFrame();
        return super.isDirty();
    }
    set gesture(v) {
        this.addEventListener = (name, fn) => {
            if (name == "pointerdown") {
                v.onTouchDown = ({ x, y }) => {
                    fn({
                        pageX: x * Environment.screenScale,
                        pageY: y * Environment.screenScale,
                        pointerType: "touch",
                    });
                };
            }
            else if (name == "pointerup") {
                v.onTouchUp = ({ x, y }) => {
                    fn({
                        pageX: x * Environment.screenScale,
                        pageY: y * Environment.screenScale,
                        pointerType: "touch",
                    });
                };
            }
            else if (name == "pointermove") {
                v.onTouchMove = ({ x, y }) => {
                    fn({
                        pageX: x * Environment.screenScale,
                        pageY: y * Environment.screenScale,
                        pointerType: "touch",
                    });
                };
            }
            else if (name == "pointercancel") {
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
};
ThreeView = __decorate([
    ViewComponent,
    __metadata("design:paramtypes", [])
], ThreeView);
export { ThreeView };
//# sourceMappingURL=ThreeView.js.map