'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var doric = require('doric');
var dangle = require('dangle');
var Three = require('three');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var Three__default = /*#__PURE__*/_interopDefaultLegacy(Three);
var Three__namespace = /*#__PURE__*/_interopNamespace(Three);

var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
exports.ThreeView = class ThreeView extends dangle.DangleView {
    constructor() {
        super();
        this.touchable = true;
        this.transparentBackground = false;
        this.eventListeners = {};
        this.addEventListener = (name, fn) => {
            this.eventListeners[name] = fn;
            if (this._gestureContainer) {
                this.bindTouchingEvents(this._gestureContainer);
            }
        };
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
            const renderer = new Three__default["default"].WebGLRenderer({
                antialias: true,
                canvas: inputCanvas,
                alpha: this.transparentBackground,
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.outputEncoding = Three__default["default"].sRGBEncoding;
            (_a = this.onInited) === null || _a === void 0 ? void 0 : _a.call(this, renderer);
        };
    }
    isDirty() {
        var _a;
        (_a = this.gl) === null || _a === void 0 ? void 0 : _a.endFrame();
        return super.isDirty();
    }
    bindTouchingEvents(v) {
        for (const entry of Object.entries(this.eventListeners)) {
            const [name, fn] = entry;
            if (name === "pointerdown") {
                v.onTouchDown = ({ x, y }) => {
                    fn({
                        pageX: x * Environment.screenScale,
                        pageY: y * Environment.screenScale,
                        pointerType: "touch",
                    });
                };
            }
            else if (name === "pointerup") {
                v.onTouchUp = ({ x, y }) => {
                    fn({
                        pageX: x * Environment.screenScale,
                        pageY: y * Environment.screenScale,
                        pointerType: "touch",
                    });
                };
            }
            else if (name === "pointermove") {
                v.onTouchMove = ({ x, y }) => {
                    fn({
                        pageX: x * Environment.screenScale,
                        pageY: y * Environment.screenScale,
                        pointerType: "touch",
                    });
                };
            }
            else if (name === "pointercancel") {
                v.onTouchCancel = ({ x, y }) => {
                    fn({
                        pageX: x * Environment.screenScale,
                        pageY: y * Environment.screenScale,
                        pointerType: "touch",
                    });
                };
            }
            else if (name === "wheel") {
                v.onPinch = (scale) => {
                    fn({
                        deltaY: 1 - scale,
                    });
                };
            }
        }
    }
    set gesture(v) {
        this.bindTouchingEvents(v);
        this._gestureContainer = v;
    }
    get gesture() {
        return this._gestureContainer;
    }
};
exports.ThreeView = __decorate([
    doric.ViewComponent,
    __metadata("design:paramtypes", [])
], exports.ThreeView);

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move
const _changeEvent = { type: "change" };
const _startEvent = { type: "start" };
const _endEvent = { type: "end" };
const EPS = 0.000001;
var STATE;
(function (STATE) {
    STATE[STATE["NONE"] = -1] = "NONE";
    STATE[STATE["ROTATE"] = 0] = "ROTATE";
    STATE[STATE["DOLLY"] = 1] = "DOLLY";
    STATE[STATE["PAN"] = 2] = "PAN";
    STATE[STATE["TOUCH_ROTATE"] = 3] = "TOUCH_ROTATE";
    STATE[STATE["TOUCH_PAN"] = 4] = "TOUCH_PAN";
    STATE[STATE["TOUCH_DOLLY_PAN"] = 5] = "TOUCH_DOLLY_PAN";
    STATE[STATE["TOUCH_DOLLY_ROTATE"] = 6] = "TOUCH_DOLLY_ROTATE";
})(STATE || (STATE = {}));
class OrbitControls extends Three.EventDispatcher {
    constructor(object, domElement) {
        super();
        // Set to false to disable this control
        this.enabled = true;
        // "target" sets the location of focus, where the object orbits around
        this.target = new Three.Vector3();
        // How far you can dolly in and out ( PerspectiveCamera only )
        this.minDistance = 0;
        this.maxDistance = Infinity;
        // How far you can zoom in and out ( OrthographicCamera only )
        this.minZoom = 0;
        this.maxZoom = Infinity;
        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians
        // How far you can orbit horizontally, upper and lower limits.
        // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
        this.minAzimuthAngle = -Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians
        // Set to true to enable damping (inertia)
        // If damping is enabled, you must call controls.update() in your animation loop
        this.enableDamping = false;
        this.dampingFactor = 0.05;
        // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
        // Set to false to disable zooming
        this.enableZoom = true;
        this.zoomSpeed = 1.0;
        // Set to false to disable rotating
        this.enableRotate = true;
        this.rotateSpeed = 1.0;
        // Set to false to disable panning
        this.enablePan = true;
        this.panSpeed = 1.0;
        this.screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up
        this.keyPanSpeed = 7.0; // pixels moved per arrow key push
        // Set to true to automatically rotate around the target
        // If auto-rotate is enabled, you must call controls.update() in your animation loop
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60
        // The four arrow keys
        this.keys = {
            LEFT: "ArrowLeft",
            UP: "ArrowUp",
            RIGHT: "ArrowRight",
            BOTTOM: "ArrowDown",
        };
        // Mouse buttons
        this.mouseButtons = {
            LEFT: Three.MOUSE.ROTATE,
            MIDDLE: Three.MOUSE.DOLLY,
            RIGHT: Three.MOUSE.PAN,
        };
        // Touch fingers
        this.touches = { ONE: Three.TOUCH.ROTATE, TWO: Three.TOUCH.DOLLY_PAN };
        // current position in spherical coordinates
        this.spherical = new Three.Spherical();
        this.sphericalDelta = new Three.Spherical();
        this.scale = 1;
        this.panOffset = new Three.Vector3();
        this.zoomChanged = false;
        this.rotateStart = new Three.Vector2();
        this.rotateEnd = new Three.Vector2();
        this.rotateDelta = new Three.Vector2();
        this.panStart = new Three.Vector2();
        this.panEnd = new Three.Vector2();
        this.panDelta = new Three.Vector2();
        this.dollyStart = new Three.Vector2();
        this.dollyEnd = new Three.Vector2();
        this.dollyDelta = new Three.Vector2();
        this.pointers = [];
        this.pointerPositions = {};
        this.state = STATE.NONE;
        this.panLeft = (() => {
            const v = new Three.Vector3();
            return (distance, objectMatrix) => {
                v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
                v.multiplyScalar(-distance);
                this.panOffset.add(v);
            };
        })();
        this.panUp = (() => {
            const v = new Three.Vector3();
            return (distance, objectMatrix) => {
                if (this.screenSpacePanning === true) {
                    v.setFromMatrixColumn(objectMatrix, 1);
                }
                else {
                    v.setFromMatrixColumn(objectMatrix, 0);
                    v.crossVectors(this.object.up, v);
                }
                v.multiplyScalar(distance);
                this.panOffset.add(v);
            };
        })();
        // deltaX and deltaY are in pixels; right and down are positive
        this.pan = (() => {
            const offset = new Three.Vector3();
            return (deltaX, deltaY) => {
                const element = this.domElement;
                if (this.object instanceof Three.PerspectiveCamera) {
                    // perspective
                    const position = this.object.position;
                    offset.copy(position).sub(this.target);
                    let targetDistance = offset.length();
                    // half of the fov is center to top of screen
                    targetDistance *= Math.tan(((this.object.fov / 2) * Math.PI) / 180.0);
                    // we use only clientHeight here so aspect ratio does not distort speed
                    this.panLeft((2 * deltaX * targetDistance) / element.clientHeight, this.object.matrix);
                    this.panUp((2 * deltaY * targetDistance) / element.clientHeight, this.object.matrix);
                }
                else if (this.object instanceof Three.OrthographicCamera) {
                    // orthographic
                    this.panLeft((deltaX * (this.object.right - this.object.left)) /
                        this.object.zoom /
                        element.clientWidth, this.object.matrix);
                    this.panUp((deltaY * (this.object.top - this.object.bottom)) /
                        this.object.zoom /
                        element.clientHeight, this.object.matrix);
                }
                else {
                    // camera neither orthographic nor perspective
                    doric.logw("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
                    this.enablePan = false;
                }
            };
        })();
        if (domElement === undefined)
            doric.logw('THREE.OrbitControls: The second parameter "domElement" is now mandatory.');
        this.object = object;
        this.domElement = domElement;
        this.update = (() => {
            const offset = new Three.Vector3();
            // so camera.up is the orbit axis
            const quat = new Three.Quaternion().setFromUnitVectors(this.object.up, new Three.Vector3(0, 1, 0));
            const quatInverse = quat.clone().invert();
            const lastPosition = new Three.Vector3();
            const lastQuaternion = new Three.Quaternion();
            const twoPI = 2 * Math.PI;
            return () => {
                const position = this.object.position;
                offset.copy(position).sub(this.target);
                // rotate offset to "y-axis-is-up" space
                offset.applyQuaternion(quat);
                // angle from z-axis around y-axis
                this.spherical.setFromVector3(offset);
                if (this.autoRotate && this.state === STATE.NONE) {
                    this.rotateLeft(this.getAutoRotationAngle());
                }
                if (this.enableDamping) {
                    this.spherical.theta +=
                        this.sphericalDelta.theta * this.dampingFactor;
                    this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
                }
                else {
                    this.spherical.theta += this.sphericalDelta.theta;
                    this.spherical.phi += this.sphericalDelta.phi;
                }
                // restrict theta to be between desired limits
                let min = this.minAzimuthAngle;
                let max = this.maxAzimuthAngle;
                if (isFinite(min) && isFinite(max)) {
                    if (min < -Math.PI)
                        min += twoPI;
                    else if (min > Math.PI)
                        min -= twoPI;
                    if (max < -Math.PI)
                        max += twoPI;
                    else if (max > Math.PI)
                        max -= twoPI;
                    if (min <= max) {
                        this.spherical.theta = Math.max(min, Math.min(max, this.spherical.theta));
                    }
                    else {
                        this.spherical.theta =
                            this.spherical.theta > (min + max) / 2
                                ? Math.max(min, this.spherical.theta)
                                : Math.min(max, this.spherical.theta);
                    }
                }
                // restrict phi to be between desired limits
                this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
                this.spherical.makeSafe();
                this.spherical.radius *= this.scale;
                // restrict radius to be between desired limits
                this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
                // move target to panned location
                if (this.enableDamping === true) {
                    this.target.addScaledVector(this.panOffset, this.dampingFactor);
                }
                else {
                    this.target.add(this.panOffset);
                }
                offset.setFromSpherical(this.spherical);
                // rotate offset back to "camera-up-vector-is-up" space
                offset.applyQuaternion(quatInverse);
                position.copy(this.target).add(offset);
                this.object.lookAt(this.target);
                if (this.enableDamping === true) {
                    this.sphericalDelta.theta *= 1 - this.dampingFactor;
                    this.sphericalDelta.phi *= 1 - this.dampingFactor;
                    this.panOffset.multiplyScalar(1 - this.dampingFactor);
                }
                else {
                    this.sphericalDelta.set(0, 0, 0);
                    this.panOffset.set(0, 0, 0);
                }
                this.scale = 1;
                // update condition is:
                // min(camera displacement, camera rotation in radians)^2 > EPS
                // using small-angle approximation cos(x/2) = 1 - x^2 / 8
                if (this.zoomChanged ||
                    lastPosition.distanceToSquared(this.object.position) > EPS ||
                    8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS) {
                    this.dispatchEvent(_changeEvent);
                    lastPosition.copy(this.object.position);
                    lastQuaternion.copy(this.object.quaternion);
                    this.zoomChanged = false;
                    return true;
                }
                return false;
            };
        })();
        this.domElement.style.touchAction = "none"; // disable touch scroll
        // for reset
        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.zoom0 = this.object.zoom;
        // the target DOM element for key events
        this._domElementKeyEvents = null;
        //
        this.domElement.addEventListener("contextmenu", (event) => {
            this.onContextMenu(event);
        });
        this.domElement.addEventListener("pointerdown", (event) => {
            this.onPointerDown(event);
        });
        this.domElement.addEventListener("pointercancel", (event) => {
            this.onPointerCancel(event);
        });
        this.domElement.addEventListener("wheel", (event) => {
            this.onMouseWheel(event);
        }, {
            passive: false,
        });
        // force an update at start
        this.update();
    }
    //
    // public methods
    //
    getPolarAngle() {
        return this.spherical.phi;
    }
    getAzimuthalAngle() {
        return this.spherical.theta;
    }
    getDistance() {
        return this.object.position.distanceTo(this.target);
    }
    listenToKeyEvents(domElement) {
        domElement.addEventListener("keydown", (event) => {
            this.onKeyDown(event);
        });
    }
    saveState() {
        this.target0.copy(this.target);
        this.position0.copy(this.object.position);
        if (this.object instanceof Three.PerspectiveCamera ||
            this.object instanceof Three.OrthographicCamera) {
            this.zoom0 = this.object.zoom;
        }
    }
    reset() {
        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        if (this.object instanceof Three.PerspectiveCamera ||
            this.object instanceof Three.OrthographicCamera) {
            this.object.zoom = this.zoom0;
            this.object.updateProjectionMatrix();
        }
        this.dispatchEvent(_changeEvent);
        this.update();
        this.state = STATE.NONE;
    }
    dispose() {
        this.domElement.removeEventListener("contextmenu", this.onContextMenu);
        this.domElement.removeEventListener("pointerdown", this.onPointerDown);
        this.domElement.removeEventListener("pointercancel", this.onPointerCancel);
        this.domElement.removeEventListener("wheel", this.onMouseWheel);
        this.domElement.removeEventListener("pointermove", this.onPointerMove);
        this.domElement.removeEventListener("pointerup", this.onPointerUp);
        if (this._domElementKeyEvents !== null) {
            this._domElementKeyEvents.removeEventListener("keydown", this.onKeyDown);
        }
    }
    getAutoRotationAngle() {
        return ((2 * Math.PI) / 60 / 60) * this.autoRotateSpeed;
    }
    getZoomScale() {
        return Math.pow(0.95, this.zoomSpeed);
    }
    rotateLeft(angle) {
        this.sphericalDelta.theta -= angle;
    }
    rotateUp(angle) {
        this.sphericalDelta.phi -= angle;
    }
    dollyOut(dollyScale) {
        if (this.object instanceof Three.PerspectiveCamera) {
            this.scale /= dollyScale;
        }
        else if (this.object instanceof Three.OrthographicCamera) {
            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale));
            this.object.updateProjectionMatrix();
            this.zoomChanged = true;
        }
        else {
            doric.logw("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
            this.enableZoom = false;
        }
    }
    dollyIn(dollyScale) {
        if (this.object instanceof Three.PerspectiveCamera) {
            this.scale *= dollyScale;
        }
        else if (this.object instanceof Three.OrthographicCamera) {
            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale));
            this.object.updateProjectionMatrix();
            this.zoomChanged = true;
        }
        else {
            doric.logw("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
            this.enableZoom = false;
        }
    }
    //
    // event callbacks - update the object state
    //
    handleMouseDownRotate(event) {
        this.rotateStart.set(event.clientX, event.clientY);
    }
    handleMouseDownDolly(event) {
        this.dollyStart.set(event.clientX, event.clientY);
    }
    handleMouseDownPan(event) {
        this.panStart.set(event.clientX, event.clientY);
    }
    handleMouseMoveRotate(event) {
        this.rotateEnd.set(event.clientX, event.clientY);
        this.rotateDelta
            .subVectors(this.rotateEnd, this.rotateStart)
            .multiplyScalar(this.rotateSpeed);
        const element = this.domElement;
        this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight); // yes, height
        this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);
        this.rotateStart.copy(this.rotateEnd);
        this.update();
    }
    handleMouseMoveDolly(event) {
        this.dollyEnd.set(event.clientX, event.clientY);
        this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);
        if (this.dollyDelta.y > 0) {
            this.dollyOut(this.getZoomScale());
        }
        else if (this.dollyDelta.y < 0) {
            this.dollyIn(this.getZoomScale());
        }
        this.dollyStart.copy(this.dollyEnd);
        this.update();
    }
    handleMouseMovePan(event) {
        this.panEnd.set(event.clientX, event.clientY);
        this.panDelta
            .subVectors(this.panEnd, this.panStart)
            .multiplyScalar(this.panSpeed);
        this.pan(this.panDelta.x, this.panDelta.y);
        this.panStart.copy(this.panEnd);
        this.update();
    }
    handleMouseUp(event) {
        // no-op
    }
    handleMouseWheel(event) {
        if (event.deltaY < 0) {
            this.dollyIn(this.getZoomScale());
        }
        else if (event.deltaY > 0) {
            this.dollyOut(this.getZoomScale());
        }
        this.update();
    }
    handleKeyDown(event) {
        let needsUpdate = false;
        switch (event.code) {
            case this.keys.UP:
                this.pan(0, this.keyPanSpeed);
                needsUpdate = true;
                break;
            case this.keys.BOTTOM:
                this.pan(0, -this.keyPanSpeed);
                needsUpdate = true;
                break;
            case this.keys.LEFT:
                this.pan(this.keyPanSpeed, 0);
                needsUpdate = true;
                break;
            case this.keys.RIGHT:
                this.pan(-this.keyPanSpeed, 0);
                needsUpdate = true;
                break;
        }
        if (needsUpdate) {
            // prevent the browser from scrolling on cursor keys
            // event.preventDefault();
            this.update();
        }
    }
    handleTouchStartRotate() {
        if (this.pointers.length === 1) {
            this.rotateStart.set(this.pointers[0].pageX, this.pointers[0].pageY);
        }
        else {
            const x = 0.5 * (this.pointers[0].pageX + this.pointers[1].pageX);
            const y = 0.5 * (this.pointers[0].pageY + this.pointers[1].pageY);
            this.rotateStart.set(x, y);
        }
    }
    handleTouchStartPan() {
        if (this.pointers.length === 1) {
            this.panStart.set(this.pointers[0].pageX, this.pointers[0].pageY);
        }
        else {
            const x = 0.5 * (this.pointers[0].pageX + this.pointers[1].pageX);
            const y = 0.5 * (this.pointers[0].pageY + this.pointers[1].pageY);
            this.panStart.set(x, y);
        }
    }
    handleTouchStartDolly() {
        const dx = this.pointers[0].pageX - this.pointers[1].pageX;
        const dy = this.pointers[0].pageY - this.pointers[1].pageY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.dollyStart.set(0, distance);
    }
    handleTouchStartDollyPan() {
        if (this.enableZoom)
            this.handleTouchStartDolly();
        if (this.enablePan)
            this.handleTouchStartPan();
    }
    handleTouchStartDollyRotate() {
        if (this.enableZoom)
            this.handleTouchStartDolly();
        if (this.enableRotate)
            this.handleTouchStartRotate();
    }
    handleTouchMoveRotate(event) {
        if (this.pointers.length == 1) {
            this.rotateEnd.set(event.pageX, event.pageY);
        }
        else {
            const position = this.getSecondPointerPosition(event);
            const x = 0.5 * (event.pageX + position.x);
            const y = 0.5 * (event.pageY + position.y);
            this.rotateEnd.set(x, y);
        }
        this.rotateDelta
            .subVectors(this.rotateEnd, this.rotateStart)
            .multiplyScalar(this.rotateSpeed);
        const element = this.domElement;
        this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight); // yes, height
        this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);
        this.rotateStart.copy(this.rotateEnd);
    }
    handleTouchMovePan(event) {
        if (this.pointers.length === 1) {
            this.panEnd.set(event.pageX, event.pageY);
        }
        else {
            const position = this.getSecondPointerPosition(event);
            const x = 0.5 * (event.pageX + position.x);
            const y = 0.5 * (event.pageY + position.y);
            this.panEnd.set(x, y);
        }
        this.panDelta
            .subVectors(this.panEnd, this.panStart)
            .multiplyScalar(this.panSpeed);
        this.pan(this.panDelta.x, this.panDelta.y);
        this.panStart.copy(this.panEnd);
    }
    handleTouchMoveDolly(event) {
        const position = this.getSecondPointerPosition(event);
        const dx = event.pageX - position.x;
        const dy = event.pageY - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.dollyEnd.set(0, distance);
        this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed));
        this.dollyOut(this.dollyDelta.y);
        this.dollyStart.copy(this.dollyEnd);
    }
    handleTouchMoveDollyPan(event) {
        if (this.enableZoom)
            this.handleTouchMoveDolly(event);
        if (this.enablePan)
            this.handleTouchMovePan(event);
    }
    handleTouchMoveDollyRotate(event) {
        if (this.enableZoom)
            this.handleTouchMoveDolly(event);
        if (this.enableRotate)
            this.handleTouchMoveRotate(event);
    }
    handleTouchEnd( /*event*/) {
        // no-op
    }
    //
    // event handlers - FSM: listen for events and reset state
    //
    onPointerDown(event) {
        if (this.enabled === false)
            return;
        if (this.pointers.length === 0) {
            this.domElement.setPointerCapture(event.pointerId);
            this.domElement.addEventListener("pointermove", (event) => {
                this.onPointerMove(event);
            });
            this.domElement.addEventListener("pointerup", (event) => {
                this.onPointerUp(event);
            });
        }
        //
        this.addPointer(event);
        if (event.pointerType === "touch") {
            this.onTouchStart(event);
        }
        else {
            this.onMouseDown(event);
        }
    }
    onPointerMove(event) {
        if (this.enabled === false)
            return;
        if (event.pointerType === "touch") {
            this.onTouchMove(event);
        }
        else {
            this.onMouseMove(event);
        }
    }
    onPointerUp(event) {
        if (this.enabled === false)
            return;
        if (event.pointerType === "touch") {
            this.onTouchEnd();
        }
        else {
            this.onMouseUp(event);
        }
        this.removePointer(event);
        //
        if (this.pointers.length === 0) {
            this.domElement.releasePointerCapture(event.pointerId);
            this.domElement.removeEventListener("pointermove", this.onPointerMove);
            this.domElement.removeEventListener("pointerup", this.onPointerUp);
        }
    }
    onPointerCancel(event) {
        this.removePointer(event);
    }
    onMouseDown(event) {
        let mouseAction;
        switch (event.button) {
            case 0:
                mouseAction = this.mouseButtons.LEFT;
                break;
            case 1:
                mouseAction = this.mouseButtons.MIDDLE;
                break;
            case 2:
                mouseAction = this.mouseButtons.RIGHT;
                break;
            default:
                mouseAction = -1;
        }
        switch (mouseAction) {
            case Three.MOUSE.DOLLY:
                if (this.enableZoom === false)
                    return;
                this.handleMouseDownDolly(event);
                this.state = STATE.DOLLY;
                break;
            case Three.MOUSE.ROTATE:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (this.enablePan === false)
                        return;
                    this.handleMouseDownPan(event);
                    this.state = STATE.PAN;
                }
                else {
                    if (this.enableRotate === false)
                        return;
                    this.handleMouseDownRotate(event);
                    this.state = STATE.ROTATE;
                }
                break;
            case Three.MOUSE.PAN:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (this.enableRotate === false)
                        return;
                    this.handleMouseDownRotate(event);
                    this.state = STATE.ROTATE;
                }
                else {
                    if (this.enablePan === false)
                        return;
                    this.handleMouseDownPan(event);
                    this.state = STATE.PAN;
                }
                break;
            default:
                this.state = STATE.NONE;
        }
        if (this.state !== STATE.NONE) {
            this.dispatchEvent(_startEvent);
        }
    }
    onMouseMove(event) {
        if (this.enabled === false)
            return;
        switch (this.state) {
            case STATE.ROTATE:
                if (this.enableRotate === false)
                    return;
                this.handleMouseMoveRotate(event);
                break;
            case STATE.DOLLY:
                if (this.enableZoom === false)
                    return;
                this.handleMouseMoveDolly(event);
                break;
            case STATE.PAN:
                if (this.enablePan === false)
                    return;
                this.handleMouseMovePan(event);
                break;
        }
    }
    onMouseUp(event) {
        this.handleMouseUp(event);
        this.dispatchEvent(_endEvent);
        this.state = STATE.NONE;
    }
    onMouseWheel(event) {
        if (this.enabled === false ||
            this.enableZoom === false ||
            (this.state !== STATE.NONE &&
                this.state !== STATE.ROTATE &&
                this.state !== STATE.TOUCH_ROTATE))
            return;
        //    event.preventDefault();
        this.dispatchEvent(_startEvent);
        this.handleMouseWheel(event);
        this.dispatchEvent(_endEvent);
    }
    onKeyDown(event) {
        if (this.enabled === false || this.enablePan === false)
            return;
        this.handleKeyDown(event);
    }
    onTouchStart(event) {
        this.trackPointer(event);
        switch (this.pointers.length) {
            case 1:
                switch (this.touches.ONE) {
                    case Three.TOUCH.ROTATE:
                        if (this.enableRotate === false)
                            return;
                        this.handleTouchStartRotate();
                        this.state = STATE.TOUCH_ROTATE;
                        break;
                    case Three.TOUCH.PAN:
                        if (this.enablePan === false)
                            return;
                        this.handleTouchStartPan();
                        this.state = STATE.TOUCH_PAN;
                        break;
                    default:
                        this.state = STATE.NONE;
                }
                break;
            case 2:
                switch (this.touches.TWO) {
                    case Three.TOUCH.DOLLY_PAN:
                        if (this.enableZoom === false && this.enablePan === false)
                            return;
                        this.handleTouchStartDollyPan();
                        this.state = STATE.TOUCH_DOLLY_PAN;
                        break;
                    case Three.TOUCH.DOLLY_ROTATE:
                        if (this.enableZoom === false && this.enableRotate === false)
                            return;
                        this.handleTouchStartDollyRotate();
                        this.state = STATE.TOUCH_DOLLY_ROTATE;
                        break;
                    default:
                        this.state = STATE.NONE;
                }
                break;
            default:
                this.state = STATE.NONE;
        }
        if (this.state !== STATE.NONE) {
            this.dispatchEvent(_startEvent);
        }
    }
    onTouchMove(event) {
        this.trackPointer(event);
        switch (this.state) {
            case STATE.TOUCH_ROTATE:
                if (this.enableRotate === false)
                    return;
                this.handleTouchMoveRotate(event);
                this.update();
                break;
            case STATE.TOUCH_PAN:
                if (this.enablePan === false)
                    return;
                this.handleTouchMovePan(event);
                this.update();
                break;
            case STATE.TOUCH_DOLLY_PAN:
                if (this.enableZoom === false && this.enablePan === false)
                    return;
                this.handleTouchMoveDollyPan(event);
                this.update();
                break;
            case STATE.TOUCH_DOLLY_ROTATE:
                if (this.enableZoom === false && this.enableRotate === false)
                    return;
                this.handleTouchMoveDollyRotate(event);
                this.update();
                break;
            default:
                this.state = STATE.NONE;
        }
    }
    onTouchEnd() {
        this.handleTouchEnd();
        this.dispatchEvent(_endEvent);
        this.state = STATE.NONE;
    }
    onContextMenu(event) {
        if (this.enabled === false)
            return;
        // event.preventDefault();
    }
    addPointer(event) {
        this.pointers.push(event);
    }
    removePointer(event) {
        delete this.pointerPositions[event.pointerId];
        for (let i = 0; i < this.pointers.length; i++) {
            if (this.pointers[i].pointerId == event.pointerId) {
                this.pointers.splice(i, 1);
                return;
            }
        }
    }
    trackPointer(event) {
        let position = this.pointerPositions[event.pointerId];
        if (position === undefined) {
            position = new Three.Vector2();
            this.pointerPositions[event.pointerId] = position;
        }
        position.set(event.pageX, event.pageY);
    }
    getSecondPointerPosition(event) {
        const pointer = event.pointerId === this.pointers[0].pointerId
            ? this.pointers[1]
            : this.pointers[0];
        return this.pointerPositions[pointer.pointerId];
    }
}
// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
// This is very similar to OrbitControls, another set of touch behavior
//
//    Orbit - right mouse, or left mouse + ctrl/meta/shiftKey / touch: two-finger rotate
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - left mouse, or arrow keys / touch: one-finger move
class MapControls extends OrbitControls {
    constructor(object, domElement) {
        super(object, domElement);
        this.screenSpacePanning = false; // pan orthogonal to world-space direction camera.up
        this.mouseButtons.LEFT = Three.MOUSE.PAN;
        this.mouseButtons.RIGHT = Three.MOUSE.ROTATE;
        this.touches.ONE = Three.TOUCH.PAN;
        this.touches.TWO = Three.TOUCH.DOLLY_ROTATE;
    }
}

class UnifiedResource extends doric.Resource {
    constructor(type, identifier) {
        if (identifier.startsWith("./")) {
            identifier = identifier.replace("./", "");
        }
        else if (identifier.startsWith("data:")) {
            type = "base64";
        }
        super(type, identifier);
    }
}
class ArrayBufferResource extends doric.Resource {
    constructor(data) {
        super("arrayBuffer", doric.uniqueId("buffer"));
        this.data = data;
    }
    toModel() {
        const ret = super.toModel();
        ret.data = this.data;
        return ret;
    }
}

/** When Object3D instances are targeted by animation, they need unique names. */
function createUniqueName(originalName) {
    const sanitizedName = Three__namespace.PropertyBinding.sanitizeNodeName(originalName || "");
    return doric.uniqueId(sanitizedName);
}

const EXTENSIONS = {
    KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
    KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
    KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
    KHR_MATERIALS_IOR: "KHR_materials_ior",
    KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: "KHR_materials_pbrSpecularGlossiness",
    KHR_MATERIALS_SHEEN: "KHR_materials_sheen",
    KHR_MATERIALS_SPECULAR: "KHR_materials_specular",
    KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
    KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
    KHR_MATERIALS_VOLUME: "KHR_materials_volume",
    KHR_TEXTURE_BASISU: "KHR_texture_basisu",
    KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
    KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
    EXT_TEXTURE_WEBP: "EXT_texture_webp",
    EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression",
};
const WEBGL_COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
};
const WEBGL_FILTERS = {
    9728: Three__namespace.NearestFilter,
    9729: Three__namespace.LinearFilter,
    9984: Three__namespace.NearestMipmapNearestFilter,
    9985: Three__namespace.LinearMipmapNearestFilter,
    9986: Three__namespace.NearestMipmapLinearFilter,
    9987: Three__namespace.LinearMipmapLinearFilter,
};
const WEBGL_WRAPPINGS = {
    33071: Three__namespace.ClampToEdgeWrapping,
    33648: Three__namespace.MirroredRepeatWrapping,
    10497: Three__namespace.RepeatWrapping,
};
const ATTRIBUTES$1 = {
    POSITION: "position",
    NORMAL: "normal",
    TANGENT: "tangent",
    TEXCOORD_0: "uv",
    TEXCOORD_1: "uv2",
    COLOR_0: "color",
    WEIGHTS_0: "skinWeight",
    JOINTS_0: "skinIndex",
};
class GLTFExtension {
    constructor(context) {
        this.context = context;
    }
    get gltf() {
        return this.context.gltf;
    }
}
class PremitiveExtension extends GLTFExtension {
}
class AttachmentExtension extends GLTFExtension {
}
class MeshExtension extends GLTFExtension {
}
class TextureExtension extends GLTFExtension {
}
class TextureExtraExtension extends GLTFExtension {
}
class BufferViewExtension extends GLTFExtension {
}

function toString(message) {
    if (message instanceof Function) {
        return message.toString();
    }
    else if (message instanceof Object) {
        try {
            return JSON.stringify(message);
        }
        catch (e) {
            return message.toString();
        }
    }
    else if (message === undefined) {
        return "undefined";
    }
    else {
        return message.toString();
    }
}
function loge(...message) {
    let out = "";
    for (let i = 0; i < arguments.length; i++) {
        if (i > 0) {
            out += ',';
        }
        out += toString(arguments[i]);
    }
    nativeLog('e', out);
}

var __awaiter$b = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const ATTRIBUTES = {
    POSITION: "position",
    NORMAL: "normal",
    TANGENT: "tangent",
    TEXCOORD_0: "uv",
    TEXCOORD_1: "uv2",
    COLOR_0: "color",
    WEIGHTS_0: "skinWeight",
    JOINTS_0: "skinIndex",
};
/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
class GLTFDracoMeshCompressionExtension extends PremitiveExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
    }
    decodePrimitive(primitive) {
        var _a;
        return __awaiter$b(this, void 0, void 0, function* () {
            const bufferViewIndex = primitive.extensions[this.name].bufferView;
            const extensionAttributes = primitive.extensions[this.name].attributes;
            const threeAttributeMap = {};
            const attributeNormalizedMap = {};
            const attributeTypeMap = {};
            for (const attributeName in extensionAttributes) {
                const lowerCaseName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();
                threeAttributeMap[lowerCaseName] = extensionAttributes[attributeName];
            }
            for (const attributeName in primitive.attributes) {
                const lowerCaseName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();
                if (extensionAttributes[attributeName] !== undefined) {
                    const accessorDef = (_a = this.gltf.accessors) === null || _a === void 0 ? void 0 : _a[primitive.attributes[attributeName]];
                    if (!!!accessorDef) {
                        loge(this.name, "error: cannot find accessor ", primitive.attributes[attributeName]);
                        continue;
                    }
                    attributeTypeMap[lowerCaseName] = accessorDef.componentType;
                    attributeNormalizedMap[lowerCaseName] =
                        (accessorDef === null || accessorDef === void 0 ? void 0 : accessorDef.normalized) === true;
                }
            }
            const bufferView = yield this.context.getDependency("bufferView", bufferViewIndex);
            const geometry = yield this.decodeDracoFile(bufferView, threeAttributeMap, attributeTypeMap);
            for (const attributeName in geometry.attributes) {
                const attribute = geometry.attributes[attributeName];
                const normalized = attributeNormalizedMap[attributeName];
                if (normalized !== undefined)
                    attribute.normalized = normalized;
            }
            return geometry;
        });
    }
    decodeDracoFile(buffer, attributeIDs, attributeTypes) {
        var _a;
        return __awaiter$b(this, void 0, void 0, function* () {
            const ret = (yield this.context.bridgeContext.callNative("draco", "decode", {
                buffer,
                attributeIDs,
                attributeTypes,
            }));
            const geometry = new Three__namespace.BufferGeometry();
            const dataView = new DataView(ret);
            let offset = 0;
            const len = dataView.getUint32(offset);
            offset += 4;
            for (let l = 0; l < len; l++) {
                const attributeId = dataView.getUint32(offset);
                offset += 4;
                const name = ((_a = Object.entries(attributeIDs).find(([_, v]) => v === attributeId)) === null || _a === void 0 ? void 0 : _a[0]) ||
                    "";
                const attributeType = attributeTypes[name];
                const arrayType = WEBGL_COMPONENT_TYPES[attributeType];
                const bufferLen = dataView.getUint32(offset);
                offset += 4;
                const arrayBuffer = ret.slice(offset, offset + bufferLen);
                const array = new arrayType(arrayBuffer);
                offset += bufferLen;
                const itemSize = dataView.getUint32(offset);
                offset += 4;
                const attribute = new Three__namespace.BufferAttribute(array, itemSize, false);
                geometry.setAttribute(name, attribute);
            }
            if (offset != ret.byteLength) {
                const bufferLen = dataView.getUint32(offset);
                offset += 4;
                const arrayBuffer = ret.slice(offset, offset + bufferLen);
                offset += bufferLen;
                const array = new Uint32Array(arrayBuffer);
                geometry.setIndex(new Three__namespace.BufferAttribute(array, 1));
            }
            return geometry;
        });
    }
}

var __awaiter$a = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
class GLTFLightsExtension extends AttachmentExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;
        // Object3D instance caches
        this.cache = { refs: {}, uses: {} };
        this.markRefs = () => {
            const nodeDefs = this.gltf.nodes || [];
            for (let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex++) {
                const nodeDef = nodeDefs[nodeIndex];
                if (nodeDef.extensions &&
                    nodeDef.extensions[this.name] &&
                    nodeDef.extensions[this.name].light !== undefined) {
                    this.context._addNodeRef(this.cache, nodeDef.extensions[this.name].light);
                }
            }
        };
    }
    createNodeAttachment(index) {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter$a(this, void 0, void 0, function* () {
            const lightIndex = (_d = (_c = (_b = (_a = this.gltf.nodes) === null || _a === void 0 ? void 0 : _a[index]) === null || _b === void 0 ? void 0 : _b.extensions) === null || _c === void 0 ? void 0 : _c[this.name]) === null || _d === void 0 ? void 0 : _d.light;
            if (lightIndex === undefined)
                return undefined;
            const cacheKey = "light:" + lightIndex;
            let dependency = this.context.getCache(cacheKey);
            if (dependency) {
                return dependency;
            }
            const lightDef = (_g = (_f = (_e = this.gltf.extensions) === null || _e === void 0 ? void 0 : _e[this.name]) === null || _f === void 0 ? void 0 : _f.lights) === null || _g === void 0 ? void 0 : _g[lightIndex];
            const color = new Three__namespace.Color(0xffffff);
            if (lightDef.color !== undefined)
                color.fromArray(lightDef.color);
            const range = lightDef.range !== undefined ? lightDef.range : 0;
            let ret;
            switch (lightDef.type) {
                case "directional":
                    {
                        const lightNode = new Three__namespace.DirectionalLight(color);
                        lightNode.target.position.set(0, 0, -1);
                        lightNode.add(lightNode.target);
                        ret = lightNode;
                    }
                    break;
                case "point":
                    {
                        const lightNode = new Three__namespace.PointLight(color);
                        lightNode.distance = range;
                        lightNode.decay = 2;
                        ret = lightNode;
                    }
                    break;
                case "spot":
                    {
                        const lightNode = new Three__namespace.SpotLight(color);
                        lightNode.distance = range;
                        // Handle spotlight properties.
                        lightDef.spot = lightDef.spot || {};
                        lightDef.spot.innerConeAngle =
                            lightDef.spot.innerConeAngle !== undefined
                                ? lightDef.spot.innerConeAngle
                                : 0;
                        lightDef.spot.outerConeAngle =
                            lightDef.spot.outerConeAngle !== undefined
                                ? lightDef.spot.outerConeAngle
                                : Math.PI / 4.0;
                        lightNode.angle = lightDef.spot.outerConeAngle;
                        lightNode.penumbra =
                            1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
                        lightNode.target.position.set(0, 0, -1);
                        lightNode.add(lightNode.target);
                        lightNode.decay = 2;
                        ret = lightNode;
                    }
                    break;
                default:
                    throw new Error("THREE.GLTFLoader: Unexpected light type: " + lightDef.type);
            }
            // Some lights (e.g. spot) default to a position other than the origin. Reset the position
            // here, because node-level parsing will only override position if explicitly specified.
            ret.position.set(0, 0, 0);
            if (lightDef.intensity !== undefined)
                ret.intensity = lightDef.intensity;
            ret.name = createUniqueName(lightDef.name || "light_" + lightIndex);
            dependency = Promise.resolve(ret);
            this.context.addCache(cacheKey, dependency);
            loge(`Create light`, ret.name);
            return dependency;
        });
    }
}

var __awaiter$9 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
class GLTFMaterialsClearcoatExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;
        this.extendMaterialParams = (materialIndex, materialParams) => __awaiter$9(this, void 0, void 0, function* () {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const pending = [];
            const extension = materialDef.extensions[this.name];
            if (extension.clearcoatFactor !== undefined) {
                materialParams.clearcoat = extension.clearcoatFactor;
            }
            if (extension.clearcoatTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "clearcoatMap", extension.clearcoatTexture));
            }
            if (extension.clearcoatRoughnessFactor !== undefined) {
                materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;
            }
            if (extension.clearcoatRoughnessTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "clearcoatRoughnessMap", extension.clearcoatRoughnessTexture));
            }
            if (extension.clearcoatNormalTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "clearcoatNormalMap", extension.clearcoatNormalTexture));
                if (extension.clearcoatNormalTexture.scale !== undefined) {
                    const scale = extension.clearcoatNormalTexture.scale;
                    materialParams.clearcoatNormalScale = new Three__namespace.Vector2(scale, scale);
                }
            }
            return Promise.all(pending);
        });
    }
    getMaterialType(materialIndex) {
        var _a, _b;
        const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
        if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
            return undefined;
        }
        return Three__namespace.MeshPhysicalMaterial;
    }
}

var __awaiter$8 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class GLTFMaterialsIorExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_IOR;
        this.extendMaterialParams = (materialIndex, materialParams) => __awaiter$8(this, void 0, void 0, function* () {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const extension = materialDef.extensions[this.name];
            materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;
            return;
        });
    }
    getMaterialType(materialIndex) {
        var _a, _b;
        const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
        if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
            return undefined;
        }
        return Three__namespace.MeshPhysicalMaterial;
    }
}

var __awaiter$7 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Specular-Glossiness Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness
 */
/**
 * A sub class of StandardMaterial with some of the functionality
 * changed via the `onBeforeCompile` callback
 * @pailhead
 */
class GLTFMeshStandardSGMaterial extends Three__namespace.MeshStandardMaterial {
    constructor(params) {
        super();
        this.isGLTFSpecularGlossinessMaterial = true;
        this.glossiness = 0;
        //various chunks that need replacing
        const specularMapParsFragmentChunk = [
            "#ifdef USE_SPECULARMAP",
            "	uniform sampler2D specularMap;",
            "#endif",
        ].join("\n");
        const glossinessMapParsFragmentChunk = [
            "#ifdef USE_GLOSSINESSMAP",
            "	uniform sampler2D glossinessMap;",
            "#endif",
        ].join("\n");
        const specularMapFragmentChunk = [
            "vec3 specularFactor = specular;",
            "#ifdef USE_SPECULARMAP",
            "	vec4 texelSpecular = texture2D( specularMap, vUv );",
            "	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture",
            "	specularFactor *= texelSpecular.rgb;",
            "#endif",
        ].join("\n");
        const glossinessMapFragmentChunk = [
            "float glossinessFactor = glossiness;",
            "#ifdef USE_GLOSSINESSMAP",
            "	vec4 texelGlossiness = texture2D( glossinessMap, vUv );",
            "	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture",
            "	glossinessFactor *= texelGlossiness.a;",
            "#endif",
        ].join("\n");
        const lightPhysicalFragmentChunk = [
            "PhysicalMaterial material;",
            "material.diffuseColor = diffuseColor.rgb * ( 1. - max( specularFactor.r, max( specularFactor.g, specularFactor.b ) ) );",
            "vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );",
            "float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );",
            "material.roughness = max( 1.0 - glossinessFactor, 0.0525 ); // 0.0525 corresponds to the base mip of a 256 cubemap.",
            "material.roughness += geometryRoughness;",
            "material.roughness = min( material.roughness, 1.0 );",
            "material.specularColor = specularFactor;",
        ].join("\n");
        const uniforms = {
            specular: { value: new Three__namespace.Color().setHex(0xffffff) },
            glossiness: { value: 1 },
            specularMap: { value: null },
            glossinessMap: { value: null },
        };
        this.onBeforeCompile = (shader) => {
            Object.entries(uniforms).forEach((entity) => {
                shader.uniforms[entity[0]] = entity[1];
            });
            shader.fragmentShader = shader.fragmentShader
                .replace("uniform float roughness;", "uniform vec3 specular;")
                .replace("uniform float metalness;", "uniform float glossiness;")
                .replace("#include <roughnessmap_pars_fragment>", specularMapParsFragmentChunk)
                .replace("#include <metalnessmap_pars_fragment>", glossinessMapParsFragmentChunk)
                .replace("#include <roughnessmap_fragment>", specularMapFragmentChunk)
                .replace("#include <metalnessmap_fragment>", glossinessMapFragmentChunk)
                .replace("#include <lights_physical_fragment>", lightPhysicalFragmentChunk);
        };
        Object.defineProperties(this, {
            specular: {
                get: function () {
                    return uniforms.specular.value;
                },
                set: function (v) {
                    uniforms.specular.value = v;
                },
            },
            specularMap: {
                get: function () {
                    return uniforms.specularMap.value;
                },
                set: function (v) {
                    uniforms.specularMap.value = v;
                    if (v) {
                        this.defines.USE_SPECULARMAP = ""; // USE_UV is set by the renderer for specular maps
                    }
                    else {
                        delete this.defines.USE_SPECULARMAP;
                    }
                },
            },
            glossiness: {
                get: function () {
                    return uniforms.glossiness.value;
                },
                set: function (v) {
                    uniforms.glossiness.value = v;
                },
            },
            glossinessMap: {
                get: function () {
                    return uniforms.glossinessMap.value;
                },
                set: function (v) {
                    uniforms.glossinessMap.value = v;
                    if (v) {
                        this.defines.USE_GLOSSINESSMAP = "";
                        this.defines.USE_UV = "";
                    }
                    else {
                        delete this.defines.USE_GLOSSINESSMAP;
                        delete this.defines.USE_UV;
                    }
                },
            },
        });
        delete this.metalness;
        delete this.roughness;
        delete this.metalnessMap;
        delete this.roughnessMap;
        this.setValues(params);
    }
    copy(source) {
        var _a;
        super.copy(source);
        this.specularMap = source.specularMap;
        if (source.specular) {
            (_a = this.specular) === null || _a === void 0 ? void 0 : _a.copy(source.specular);
        }
        this.glossinessMap = source.glossinessMap;
        this.glossiness = source.glossiness;
        delete this.metalness;
        delete this.roughness;
        delete this.metalnessMap;
        delete this.roughnessMap;
        return this;
    }
}
class GLTFMaterialsPbrSpecularGlossinessExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS;
        this.specularGlossinessParams = [
            "color",
            "map",
            "lightMap",
            "lightMapIntensity",
            "aoMap",
            "aoMapIntensity",
            "emissive",
            "emissiveIntensity",
            "emissiveMap",
            "bumpMap",
            "bumpScale",
            "normalMap",
            "normalMapType",
            "displacementMap",
            "displacementScale",
            "displacementBias",
            "specularMap",
            "specular",
            "glossinessMap",
            "glossiness",
            "alphaMap",
            "envMap",
            "envMapIntensity",
            "refractionRatio",
        ];
        this.extendParams = (params, materialDef) => __awaiter$7(this, void 0, void 0, function* () {
            var _a;
            const pbrSpecularGlossiness = (_a = materialDef.extensions) === null || _a === void 0 ? void 0 : _a[this.name];
            if (!!!pbrSpecularGlossiness) {
                return;
            }
            const materialParams = params;
            materialParams.color = new Three__namespace.Color(1.0, 1.0, 1.0);
            materialParams.opacity = 1.0;
            const pending = [];
            if (Array.isArray(pbrSpecularGlossiness.diffuseFactor)) {
                const array = pbrSpecularGlossiness.diffuseFactor;
                materialParams.color.fromArray(array);
                materialParams.opacity = array[3];
            }
            if (pbrSpecularGlossiness.diffuseTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "map", pbrSpecularGlossiness.diffuseTexture));
            }
            materialParams.emissive = new Three__namespace.Color(0.0, 0.0, 0.0);
            materialParams.glossiness =
                pbrSpecularGlossiness.glossinessFactor !== undefined
                    ? pbrSpecularGlossiness.glossinessFactor
                    : 1.0;
            materialParams.specular = new Three__namespace.Color(1.0, 1.0, 1.0);
            if (Array.isArray(pbrSpecularGlossiness.specularFactor)) {
                materialParams.specular.fromArray(pbrSpecularGlossiness.specularFactor);
            }
            if (pbrSpecularGlossiness.specularGlossinessTexture !== undefined) {
                const specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture;
                pending.push(this.context.assignTexture(materialParams, "glossinessMap", specGlossMapDef));
                pending.push(this.context.assignTexture(materialParams, "specularMap", specGlossMapDef));
            }
            return Promise.all(pending);
        });
        this.createMaterial = (params) => {
            const materialParams = params;
            const material = new GLTFMeshStandardSGMaterial(materialParams);
            material.fog = true;
            material.color = materialParams.color;
            material.map = materialParams.map === undefined ? null : materialParams.map;
            material.lightMap = null;
            material.lightMapIntensity = 1.0;
            material.aoMap =
                materialParams.aoMap === undefined ? null : materialParams.aoMap;
            material.aoMapIntensity = 1.0;
            material.emissive = materialParams.emissive;
            material.emissiveIntensity = 1.0;
            material.emissiveMap =
                materialParams.emissiveMap === undefined
                    ? null
                    : materialParams.emissiveMap;
            material.bumpMap =
                materialParams.bumpMap === undefined ? null : materialParams.bumpMap;
            material.bumpScale = 1;
            material.normalMap =
                materialParams.normalMap === undefined ? null : materialParams.normalMap;
            material.normalMapType = Three__namespace.TangentSpaceNormalMap;
            if (materialParams.normalScale)
                material.normalScale = materialParams.normalScale;
            material.displacementMap = null;
            material.displacementScale = 1;
            material.displacementBias = 0;
            material.specularMap =
                materialParams.specularMap === undefined
                    ? null
                    : materialParams.specularMap;
            material.specular = materialParams.specular;
            material.glossinessMap =
                materialParams.glossinessMap === undefined
                    ? null
                    : materialParams.glossinessMap;
            material.glossiness = materialParams.glossiness;
            material.alphaMap = null;
            material.envMap =
                materialParams.envMap === undefined ? null : materialParams.envMap;
            material.envMapIntensity = 1.0;
            material.refractionRatio = 0.98;
            return material;
        };
    }
    getMaterialType() {
        return GLTFMeshStandardSGMaterial;
    }
}

/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
class GLTFMaterialsSheenExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_SHEEN;
        this.extendMaterialParams = (materialIndex, materialParams) => {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return Promise.resolve();
            }
            const pending = [];
            materialParams.sheenColor = new Three__namespace.Color(0, 0, 0);
            materialParams.sheenRoughness = 0;
            materialParams.sheen = 1;
            const extension = materialDef.extensions[this.name];
            if (extension.sheenColorFactor !== undefined) {
                materialParams.sheenColor.fromArray(extension.sheenColorFactor);
            }
            if (extension.sheenRoughnessFactor !== undefined) {
                materialParams.sheenRoughness = extension.sheenRoughnessFactor;
            }
            if (extension.sheenColorTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "sheenColorMap", extension.sheenColorTexture));
            }
            if (extension.sheenRoughnessTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "sheenRoughnessMap", extension.sheenRoughnessTexture));
            }
            return Promise.all(pending);
        };
    }
    getMaterialType(materialIndex) {
        var _a, _b;
        const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
        if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
            return undefined;
        }
        return Three__namespace.MeshPhysicalMaterial;
    }
}

var __awaiter$6 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
class GLTFMaterialsSpecularExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_SPECULAR;
        this.extendMaterialParams = (materialIndex, materialParams) => __awaiter$6(this, void 0, void 0, function* () {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const pending = [];
            const extension = materialDef.extensions[this.name];
            materialParams.specularIntensity =
                extension.specularFactor !== undefined ? extension.specularFactor : 1.0;
            if (extension.specularTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "specularIntensityMap", extension.specularTexture));
            }
            const colorArray = extension.specularColorFactor || [1, 1, 1];
            materialParams.specularColor = new Three__namespace.Color(colorArray[0], colorArray[1], colorArray[2]);
            if (extension.specularColorTexture !== undefined) {
                pending.push(this.context
                    .assignTexture(materialParams, "specularColorMap", extension.specularColorTexture)
                    .then((texture) => {
                    if (texture) {
                        texture.encoding = Three__namespace.sRGBEncoding;
                    }
                    return texture;
                }));
            }
            return Promise.all(pending);
        });
    }
    getMaterialType(materialIndex) {
        var _a, _b;
        const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
        if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
            return undefined;
        }
        return Three__namespace.MeshPhysicalMaterial;
    }
}

var __awaiter$5 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */
class GLTFMaterialsTransmissionExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;
        this.extendMaterialParams = (materialIndex, materialParams) => __awaiter$5(this, void 0, void 0, function* () {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const pending = [];
            const extension = materialDef.extensions[this.name];
            if (extension.transmissionFactor !== undefined) {
                materialParams.transmission = extension.transmissionFactor;
            }
            if (extension.transmissionTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "transmissionMap", extension.transmissionTexture));
            }
            return Promise.all(pending);
        });
    }
    getMaterialType(materialIndex) {
        var _a, _b;
        const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
        if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
            return undefined;
        }
        return Three__namespace.MeshPhysicalMaterial;
    }
}

/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
class GLTFMaterialsUnlitExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;
        this.extendParams = (materialParams, materialDef) => {
            const pending = [];
            materialParams.color = new Three__namespace.Color(1.0, 1.0, 1.0);
            materialParams.opacity = 1.0;
            const metallicRoughness = materialDef.pbrMetallicRoughness;
            if (metallicRoughness) {
                if (Array.isArray(metallicRoughness.baseColorFactor)) {
                    const array = metallicRoughness.baseColorFactor;
                    materialParams.color.fromArray(array);
                    materialParams.opacity = array[3];
                }
                if (metallicRoughness.baseColorTexture !== undefined) {
                    pending.push(this.context.assignTexture(materialParams, "map", metallicRoughness.baseColorTexture));
                }
            }
            return Promise.all(pending);
        };
    }
    getMaterialType() {
        return Three__namespace.MeshBasicMaterial;
    }
}

/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
class GLTFMaterialsVolumeExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_VOLUME;
        this.extendMaterialParams = (materialIndex, materialParams) => {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return Promise.resolve();
            }
            const pending = [];
            const extension = materialDef.extensions[this.name];
            materialParams.thickness =
                extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;
            if (extension.thicknessTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "thicknessMap", extension.thicknessTexture));
            }
            materialParams.attenuationDistance = extension.attenuationDistance || 0;
            const colorArray = extension.attenuationColor || [1, 1, 1];
            materialParams.attenuationColor = new Three__namespace.Color(colorArray[0], colorArray[1], colorArray[2]);
            return Promise.all(pending);
        };
    }
    getMaterialType(materialIndex) {
        var _a, _b;
        const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
        if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
            return undefined;
        }
        return Three__namespace.MeshPhysicalMaterial;
    }
}

var __awaiter$4 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
class GLTFMeshoptCompressionExtension extends BufferViewExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
    }
    loadBufferView(index) {
        var _a;
        return __awaiter$4(this, void 0, void 0, function* () {
            const bufferView = (_a = this.gltf.bufferViews) === null || _a === void 0 ? void 0 : _a[index];
            if (bufferView &&
                bufferView.extensions &&
                bufferView.extensions[this.name]) {
                const extensionDef = bufferView.extensions[this.name];
                const decoder = this.context.meshoptDecoder;
                if (!decoder || !decoder.supported) {
                    if (this.gltf.extensionsRequired &&
                        this.gltf.extensionsRequired.indexOf(this.name) >= 0) {
                        throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");
                    }
                    else {
                        // Assumes that the extension is optional and that fallback buffer data is present
                        return;
                    }
                }
                const raw = yield this.context.loadBuffer(extensionDef.buffer);
                if (!!!raw) {
                    throw new Error("THREE.GLTFLoader: load meshopt decoder error");
                }
                yield decoder.ready();
                const byteOffset = extensionDef.byteOffset || 0;
                const byteLength = extensionDef.byteLength || 0;
                const count = extensionDef.count;
                const stride = extensionDef.byteStride;
                const source = new Uint8Array(raw, byteOffset, byteLength);
                const result = yield decoder.decode(source, count, stride, extensionDef.mode, extensionDef.filter);
                return result;
            }
        });
    }
}

var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
class GLTFTextureBasisUExtension extends TextureExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_TEXTURE_BASISU;
        this.textureCache = {};
    }
    loadTexture(textureIndex) {
        var _a, _b, _c;
        return __awaiter$3(this, void 0, void 0, function* () {
            const textureDef = (_a = this.gltf.textures) === null || _a === void 0 ? void 0 : _a[textureIndex];
            if (!!!((_b = textureDef === null || textureDef === void 0 ? void 0 : textureDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const extension = textureDef.extensions[this.name];
            const source = (_c = this.gltf.images) === null || _c === void 0 ? void 0 : _c[extension.source];
            if (!!!source) {
                return;
            }
            const cacheKey = (source.uri || source.bufferView) + ":" + textureDef.sampler;
            if (!!this.textureCache[cacheKey]) {
                // See https://github.com/mrdoob/three.js/issues/21559.
                return this.textureCache[cacheKey];
            }
            let resource;
            if (source.bufferView !== undefined) {
                const arrayBuffer = yield this.context.getDependency("bufferView", source.bufferView);
                if (!!!arrayBuffer) {
                    doric.loge(`THREE.GLTFLoader: ${this.name} Image ${textureIndex} is missing bufferView ${source.bufferView}`);
                    return;
                }
                resource = new doric.ArrayBufferResource(arrayBuffer);
            }
            else if (source.uri !== undefined) {
                const url = Three__namespace.LoaderUtils.resolveURL(decodeURIComponent(source.uri) || "", this.context.option.path);
                resource = new UnifiedResource(this.context.option.resType, url);
            }
            else {
                doric.loge(`THREE.GLTFLoader: Image ${textureIndex} is missing URI and bufferView,source is ${JSON.stringify(source)}`);
                return;
            }
            if (!!!this.context.ktx2Loader) {
                doric.loge("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
                return;
            }
            else {
                const texture = yield this.context.ktx2Loader.loadTexture(this.context.bridgeContext, resource);
                if (!!!texture) {
                    doric.loge("THREE.KTXLoader: loadTexture error");
                    return;
                }
                texture.flipY = false;
                if (textureDef.name)
                    texture.name = textureDef.name;
                const samplers = this.gltf.samplers || [];
                const sampler = samplers[textureDef.sampler] || {};
                texture.magFilter =
                    WEBGL_FILTERS[sampler.magFilter] || Three__namespace.LinearFilter;
                texture.minFilter =
                    WEBGL_FILTERS[sampler.minFilter] || Three__namespace.LinearMipmapLinearFilter;
                texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS] || Three__namespace.RepeatWrapping;
                texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT] || Three__namespace.RepeatWrapping;
                this.context.associations.set(texture, { index: textureIndex });
                this.textureCache[cacheKey] = texture;
                return texture;
            }
        });
    }
}

/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */
class GLTFTextureTransformExtension extends TextureExtraExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;
    }
    extendTexture(texture, transform) {
        if (transform.texCoord !== undefined) {
            doric.logw('THREE.GLTFLoader: Custom UV sets in "' +
                this.name +
                '" extension not yet supported.');
        }
        if (transform.offset === undefined &&
            transform.rotation === undefined &&
            transform.scale === undefined) {
            // See https://github.com/mrdoob/three.js/issues/21819.
            return texture;
        }
        texture = texture.clone();
        if (transform.offset !== undefined) {
            texture.offset.fromArray(transform.offset);
        }
        if (transform.rotation !== undefined) {
            texture.rotation = transform.rotation;
        }
        if (transform.scale !== undefined) {
            texture.repeat.fromArray(transform.scale);
        }
        texture.needsUpdate = true;
        return texture;
    }
}

var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
class GLTFTextureWebPExtension extends TextureExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.EXT_TEXTURE_WEBP;
    }
    loadTexture(textureIndex) {
        var _a, _b, _c;
        return __awaiter$2(this, void 0, void 0, function* () {
            const textureDef = (_a = this.gltf.textures) === null || _a === void 0 ? void 0 : _a[textureIndex];
            if (!!!((_b = textureDef === null || textureDef === void 0 ? void 0 : textureDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const extension = textureDef.extensions[this.name];
            const source = (_c = this.gltf.images) === null || _c === void 0 ? void 0 : _c[extension.source];
            if (!!!source) {
                return;
            }
            return this.context.loadTextureImage(textureIndex, source);
        });
    }
}

/*********************************/
/********** INTERPOLATION ********/
/*********************************/
// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Three__namespace.Interpolant {
    constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
        super(parameterPositions, sampleValues, sampleSize, resultBuffer);
    }
    copySampleValue_(index) {
        // Copies a sample value to the result buffer. See description of glTF
        // CUBICSPLINE values layout in interpolate_() function below.
        const result = this.resultBuffer, values = this.sampleValues, valueSize = this.valueSize, offset = index * valueSize * 3 + valueSize;
        for (let i = 0; i !== valueSize; i++) {
            result[i] = values[offset + i];
        }
        return result;
    }
}
GLTFCubicSplineInterpolant.prototype.beforeStart_ =
    GLTFCubicSplineInterpolant.prototype.copySampleValue_;
GLTFCubicSplineInterpolant.prototype.afterEnd_ =
    GLTFCubicSplineInterpolant.prototype.copySampleValue_;
GLTFCubicSplineInterpolant.prototype.interpolate_ = function (i1, t0, t, t1) {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;
    const stride2 = stride * 2;
    const stride3 = stride * 3;
    const td = t1 - t0;
    const p = (t - t0) / td;
    const pp = p * p;
    const ppp = pp * p;
    const offset1 = i1 * stride3;
    const offset0 = offset1 - stride3;
    const s2 = -2 * ppp + 3 * pp;
    const s3 = ppp - pp;
    const s0 = 1 - s2;
    const s1 = s3 - pp + p;
    // Layout of keyframe output values for CUBICSPLINE animations:
    //   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
    for (let i = 0; i !== stride; i++) {
        const p0 = values[offset0 + i + stride]; // splineVertex_k
        const m0 = values[offset0 + i + stride2] * td; // outTangent_k * (t_k+1 - t_k)
        const p1 = values[offset1 + i + stride]; // splineVertex_k+1
        const m1 = values[offset1 + i] * td; // inTangent_k+1 * (t_k+1 - t_k)
        result[i] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;
    }
    return result;
};
const _q = new Three__namespace.Quaternion();
class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {
    interpolate_(i1, t0, t, t1) {
        const result = super.interpolate_(i1, t0, t, t1);
        _q.fromArray(result).normalize().toArray(result);
        return result;
    }
}

class GLTFMeshQuantizationExtension extends GLTFExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;
    }
}

var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const KTX2TransferSRGB = 2;
const KTX2_ALPHA_PREMULTIPLIED = 1;
const EngineFormat = [
    Three__namespace.RGBAFormat,
    Three__namespace.RGBA_ASTC_4x4_Format,
    Three__namespace.RGBA_BPTC_Format,
    Three__namespace.RGBA_ETC2_EAC_Format,
    Three__namespace.RGBA_PVRTC_4BPPV1_Format,
    Three__namespace.RGBA_S3TC_DXT5_Format,
    Three__namespace.RGB_ETC1_Format,
    Three__namespace.RGB_ETC2_Format,
    Three__namespace.RGB_PVRTC_4BPPV1_Format,
    Three__namespace.RGB_S3TC_DXT1_Format,
];
class KTX2Loader {
    constructor(renderer) {
        const config = {
            astcSupported: renderer.extensions.has("WEBGL_compressed_texture_astc"),
            etc1Supported: renderer.extensions.has("WEBGL_compressed_texture_etc1"),
            etc2Supported: renderer.extensions.has("WEBGL_compressed_texture_etc"),
            dxtSupported: renderer.extensions.has("WEBGL_compressed_texture_s3tc"),
            bptcSupported: renderer.extensions.has("EXT_texture_compression_bptc"),
            pvrtcSupported: renderer.extensions.has("WEBGL_compressed_texture_pvrtc") ||
                renderer.extensions.has("WEBKIT_WEBGL_compressed_texture_pvrtc"),
        };
        this.extensionFlag =
            (config.astcSupported ? 0x1 : 0) |
                (config.etc1Supported ? 0x1 << 1 : 0) |
                (config.etc2Supported ? 0x1 << 2 : 0) |
                (config.dxtSupported ? 0x1 << 3 : 0) |
                (config.bptcSupported ? 0x1 << 4 : 0) |
                (config.pvrtcSupported ? 0x1 << 5 : 0);
    }
    loadTexture(context, resource) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const arrayBuffer = yield context.callNative("ktx2", "decode", {
                resource,
                extensionFlag: this.extensionFlag,
            });
            const dataView = new DataView(arrayBuffer);
            let offset = 0;
            const width = dataView.getUint32(offset);
            offset += 4;
            const height = dataView.getUint32(offset);
            offset += 4;
            dataView.getUint32(offset) === 1;
            offset += 4;
            const format = EngineFormat[dataView.getUint32(offset)];
            offset += 4;
            const dfdTransferFn = dataView.getUint32(offset);
            offset += 4;
            const dfdFlags = dataView.getUint32(offset);
            offset += 4;
            const levels = dataView.getUint32(offset);
            offset += 4;
            const mipmaps = [];
            for (let i = 0; i < levels; i++) {
                const mipWidth = dataView.getUint32(offset);
                offset += 4;
                const mipHeight = dataView.getUint32(offset);
                offset += 4;
                const bufferLen = dataView.getUint32(offset);
                offset += 4;
                const data = arrayBuffer.slice(offset, offset + bufferLen);
                mipmaps.push({
                    data: new Uint8Array(data),
                    width: mipWidth,
                    height: mipHeight,
                });
            }
            const texture = new Three__namespace.CompressedTexture(mipmaps, width, height, format, Three__namespace.UnsignedByteType);
            texture.minFilter =
                mipmaps.length === 1
                    ? Three__namespace.LinearFilter
                    : Three__namespace.LinearMipmapLinearFilter;
            texture.magFilter = Three__namespace.LinearFilter;
            texture.generateMipmaps = false;
            texture.needsUpdate = true;
            texture.encoding =
                dfdTransferFn === KTX2TransferSRGB
                    ? Three__namespace.sRGBEncoding
                    : Three__namespace.LinearEncoding;
            texture.premultiplyAlpha = !!(dfdFlags & KTX2_ALPHA_PREMULTIPLIED);
            return texture;
        });
    }
}

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function loadGLTF(context, resource, asyncTexture = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const loader = new GLTFLoader(context);
        return loader.load(resource, asyncTexture);
    });
}
/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = "glTF";
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4e4f534a, BIN: 0x004e4942 };
/* CONSTANTS */
const WEBGL_CONSTANTS = {
    FLOAT: 5126,
    //FLOAT_MAT2: 35674,
    FLOAT_MAT3: 35675,
    FLOAT_MAT4: 35676,
    FLOAT_VEC2: 35664,
    FLOAT_VEC3: 35665,
    FLOAT_VEC4: 35666,
    LINEAR: 9729,
    REPEAT: 10497,
    SAMPLER_2D: 35678,
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6,
    UNSIGNED_BYTE: 5121,
    UNSIGNED_SHORT: 5123,
};
const WEBGL_TYPE_SIZES = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
};
const PATH_PROPERTIES = {
    scale: "scale",
    translation: "position",
    rotation: "quaternion",
    weights: "morphTargetInfluences",
};
const INTERPOLATION = {
    CUBICSPLINE: undefined,
    // keyframe track will be initialized with a default interpolation type, then modified.
    LINEAR: Three__namespace.InterpolateLinear,
    STEP: Three__namespace.InterpolateDiscrete,
};
const ALPHA_MODES = {
    OPAQUE: "OPAQUE",
    MASK: "MASK",
    BLEND: "BLEND",
};
/**
 * @param {Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
function updateMorphTargets(mesh, meshDef) {
    mesh.updateMorphTargets();
    if (meshDef.weights !== undefined && !!mesh.morphTargetInfluences) {
        for (let i = 0, il = meshDef.weights.length; i < il; i++) {
            mesh.morphTargetInfluences[i] = meshDef.weights[i];
        }
    }
    // .extras has user-defined data, so check that .extras.targetNames is an array.
    if (meshDef.extras &&
        Array.isArray(meshDef.extras.targetNames) &&
        !!mesh.morphTargetInfluences) {
        const targetNames = meshDef.extras.targetNames;
        if (mesh.morphTargetInfluences.length === targetNames.length) {
            mesh.morphTargetDictionary = {};
            for (let i = 0, il = targetNames.length; i < il; i++) {
                mesh.morphTargetDictionary[targetNames[i]] = i;
            }
        }
        else {
            doric.logw("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.");
        }
    }
}
/**
 * @param {BufferGeometry} geometry
 * @param {Number} drawMode
 * @return {BufferGeometry}
 */
function toTrianglesDrawMode(geometry, drawMode) {
    let index = geometry.getIndex();
    // generate index if not present
    if (index === null) {
        const indices = [];
        const position = geometry.getAttribute("position");
        if (position !== undefined) {
            for (let i = 0; i < position.count; i++) {
                indices.push(i);
            }
            geometry.setIndex(indices);
            index = geometry.getIndex();
        }
        if (index === null) {
            doric.loge("THREE.GLTFLoader.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.");
            return geometry;
        }
    }
    //
    const numberOfTriangles = index.count - 2;
    const newIndices = [];
    if (drawMode === Three__namespace.TriangleFanDrawMode) {
        // gl.TRIANGLE_FAN
        for (let i = 1; i <= numberOfTriangles; i++) {
            newIndices.push(index.getX(0));
            newIndices.push(index.getX(i));
            newIndices.push(index.getX(i + 1));
        }
    }
    else {
        // gl.TRIANGLE_STRIP
        for (let i = 0; i < numberOfTriangles; i++) {
            if (i % 2 === 0) {
                newIndices.push(index.getX(i));
                newIndices.push(index.getX(i + 1));
                newIndices.push(index.getX(i + 2));
            }
            else {
                newIndices.push(index.getX(i + 2));
                newIndices.push(index.getX(i + 1));
                newIndices.push(index.getX(i));
            }
        }
    }
    if (newIndices.length / 3 !== numberOfTriangles) {
        doric.loge("THREE.GLTFLoader.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
    }
    // build final geometry
    const newGeometry = geometry.clone();
    newGeometry.setIndex(newIndices);
    return newGeometry;
}
function createAttributesKey(attributes) {
    let attributesKey = "";
    const keys = Object.keys(attributes).sort();
    for (let i = 0, il = keys.length; i < il; i++) {
        attributesKey += keys[i] + ":" + attributes[keys[i]] + ";";
    }
    return attributesKey;
}
function createPrimitiveKey(primitiveDef) {
    const dracoExtension = primitiveDef.extensions &&
        primitiveDef.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION];
    let geometryKey;
    if (dracoExtension) {
        geometryKey =
            "draco:" +
                dracoExtension.bufferView +
                ":" +
                dracoExtension.indices +
                ":" +
                createAttributesKey(dracoExtension.attributes);
    }
    else {
        geometryKey =
            primitiveDef.indices +
                ":" +
                createAttributesKey(primitiveDef.attributes) +
                ":" +
                primitiveDef.mode;
    }
    return geometryKey;
}
function parseGLB(data) {
    const headerView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH);
    const header = {
        magic: Three__namespace.LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
        version: headerView.getUint32(4, true),
        length: headerView.getUint32(8, true),
    };
    if (header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
        throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    }
    else if (header.version < 2.0) {
        throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    }
    const chunkContentsLength = header.length - BINARY_EXTENSION_HEADER_LENGTH;
    const chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
    let chunkIndex = 0;
    let content = undefined;
    let body = undefined;
    while (chunkIndex < chunkContentsLength) {
        const chunkLength = chunkView.getUint32(chunkIndex, true);
        chunkIndex += 4;
        const chunkType = chunkView.getUint32(chunkIndex, true);
        chunkIndex += 4;
        if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
            const contentArray = new Uint8Array(data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
            content = Three__namespace.LoaderUtils.decodeText(contentArray);
        }
        else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
            const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
            body = data.slice(byteOffset, byteOffset + chunkLength);
        }
        // Clients must ignore chunks with unknown types.
        chunkIndex += chunkLength;
    }
    if (content === null) {
        throw new Error("THREE.GLTFLoader: JSON content not found.");
    }
    return {
        content,
        body,
    };
}
function assignExtrasToUserData(object, hasExtras) {
    if (hasExtras.extras !== undefined) {
        if (typeof hasExtras.extras === "object") {
            Object.assign(object.userData, hasExtras.extras);
        }
        else {
            doric.logw("THREE.GLTFLoader: Ignoring primitive type .extras, " + hasExtras.extras);
        }
    }
}
function addUnknownExtensionsToUserData(knownExtensions, object, objectDef) {
    // Add unknown glTF extensions to an object's userData.
    if (typeof objectDef.extensions === "object") {
        for (const name in objectDef.extensions) {
            if (knownExtensions[name] === undefined) {
                object.userData.gltfExtensions = object.userData.gltfExtensions || {};
                object.userData.gltfExtensions[name] = objectDef.extensions[name];
            }
        }
    }
}
let defaultMaterial = undefined;
/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */
function createDefaultMaterial() {
    if (defaultMaterial === undefined) {
        defaultMaterial = new Three__namespace.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x000000,
            metalness: 1,
            roughness: 1,
            transparent: false,
            depthTest: true,
            side: Three__namespace.FrontSide,
        });
    }
    return defaultMaterial;
}
class GLTFLoader extends Three__namespace.Loader {
    constructor(context, renderer) {
        super();
        this.extensionTypes = [
            GLTFMaterialsClearcoatExtension,
            GLTFTextureBasisUExtension,
            GLTFTextureWebPExtension,
            GLTFMaterialsSheenExtension,
            GLTFMaterialsTransmissionExtension,
            GLTFMaterialsVolumeExtension,
            GLTFMaterialsIorExtension,
            GLTFMaterialsSpecularExtension,
            GLTFLightsExtension,
            GLTFMeshoptCompressionExtension, //
        ];
        this.context = context;
        this.renderer = renderer;
    }
    loadTexture(pendingTexture) {
        return __awaiter(this, void 0, void 0, function* () {
            const { texture, resource } = pendingTexture;
            const imageInfo = yield doric.imageDecoder(this.context).getImageInfo(resource);
            const imagePixels = yield doric.imageDecoder(this.context).decodeToPixels(resource);
            texture.image = {
                data: new Uint8ClampedArray(imagePixels),
                width: imageInfo.width,
                height: imageInfo.height,
            };
            texture.needsUpdate = true;
            return texture;
        });
    }
    load(resource, asyncTexture = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = resource.identifier;
            const data = yield doric.resourceLoader(this.context).load(resource);
            const magic = Three__namespace.LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
            let gltf;
            let glbBody = undefined;
            if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
                const { content, body } = parseGLB(data);
                glbBody = body;
                if (!!!content) {
                    throw new Error("THREE.GLTFLoader: Content is empty.");
                }
                gltf = JSON.parse(content);
            }
            else {
                const content = Three__namespace.LoaderUtils.decodeText(new Uint8Array(data));
                gltf = JSON.parse(content);
            }
            if (gltf.asset === undefined || parseInt(gltf.asset.version) < 2) {
                throw new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.");
            }
            const gltfParser = new GLTFParser({
                bridgeContext: this.context,
                path: Three__namespace.LoaderUtils.extractUrlBase(url),
                gltf,
                resType: resource.type,
                body: glbBody,
                asyncTexture,
            });
            if (this.renderer) {
                gltfParser.ktx2Loader = new KTX2Loader(this.renderer);
            }
            this.extensionTypes.forEach((e) => {
                const extension = new e(gltfParser);
                gltfParser.extensions[extension.name] = extension;
            });
            if (gltf.extensionsUsed) {
                for (let i = 0; i < gltf.extensionsUsed.length; ++i) {
                    const extensionName = gltf.extensionsUsed[i];
                    const extensionsRequired = gltf.extensionsRequired || [];
                    switch (extensionName) {
                        case EXTENSIONS.KHR_MATERIALS_UNLIT:
                            gltfParser.extensions[extensionName] =
                                new GLTFMaterialsUnlitExtension(gltfParser);
                            break;
                        case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
                            gltfParser.extensions[extensionName] =
                                new GLTFMaterialsPbrSpecularGlossinessExtension(gltfParser);
                            break;
                        case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
                            gltfParser.extensions[extensionName] =
                                new GLTFDracoMeshCompressionExtension(gltfParser);
                            break;
                        case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
                            gltfParser.extensions[extensionName] =
                                new GLTFTextureTransformExtension(gltfParser);
                            break;
                        case EXTENSIONS.KHR_MESH_QUANTIZATION:
                            gltfParser.extensions[extensionName] =
                                new GLTFMeshQuantizationExtension(gltfParser);
                            break;
                        default:
                            if (extensionsRequired.indexOf(extensionName) >= 0 &&
                                gltfParser.extensions[extensionName] === undefined) {
                                console.warn('THREE.GLTFLoader: Unknown extension "' + extensionName + '".');
                            }
                    }
                }
            }
            return gltfParser.parse();
        });
    }
}
function getNormalizedComponentScale(constructor) {
    // Reference:
    // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data
    switch (constructor) {
        case Int8Array:
            return 1 / 127;
        case Uint8Array:
            return 1 / 255;
        case Int16Array:
            return 1 / 32767;
        case Uint16Array:
            return 1 / 65535;
        default:
            throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.");
    }
}
class GLTFParser {
    constructor(option) {
        this.textureCache = {};
        this.associations = new Map();
        this.cache = new Map();
        this.meshCache = { refs: {}, uses: {} };
        this.cameraCache = { refs: {}, uses: {} };
        this.extensions = {};
        this.primitiveCache = {};
        this.pendingTextures = [];
        this.option = option;
    }
    get bridgeContext() {
        return this.option.bridgeContext;
    }
    addCache(n, v) {
        this.cache.set(n, v);
    }
    getCache(n) {
        return this.cache.get(n);
    }
    parse() {
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = Object.values(this.extensions);
            // Clear the loader cache
            this.cache.clear();
            // Mark the special nodes/meshes in json for efficient parse
            this._markDefs();
            extensions.forEach((ext) => {
                ext.markRefs && ext.markRefs();
            });
            extensions.forEach((ext) => {
                ext.beforeRoot && ext.beforeRoot();
            });
            const dependencies = yield Promise.all([
                this.getDependencies("scene"),
                this.getDependencies("animation"),
                this.getDependencies("camera"),
            ]);
            const result = {
                scene: dependencies[0][this.gltf.scene || 0],
                scenes: dependencies[0],
                animations: dependencies[1],
                cameras: dependencies[2],
                asset: this.gltf.asset,
                userData: {},
                pendingTextures: this.pendingTextures,
            };
            addUnknownExtensionsToUserData(extensions, result, this.gltf);
            assignExtrasToUserData(result, this.gltf);
            extensions.forEach((ext) => {
                ext.afterRoot && ext.afterRoot();
            });
            return result;
        });
    }
    /**
     * Requests all dependencies of the specified type asynchronously, with caching.
     * @param {string} type
     * @return {Promise<Array<Object>>}
     */
    getDependencies(type) {
        return __awaiter(this, void 0, void 0, function* () {
            let dependencies = this.getCache(type);
            if (!dependencies) {
                const defs = this.gltf[type + (type === "mesh" ? "es" : "s")] || [];
                dependencies = Promise.all(defs.map((_, index) => {
                    return this.getDependency(type, index);
                }));
                this.addCache(type, dependencies);
            }
            return dependencies;
        });
    }
    get gltf() {
        return this.option.gltf;
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
     * @param {number} accessorIndex
     * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
     */
    loadAccessor(accessorIndex) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const accessorDef = (_a = this.gltf.accessors) === null || _a === void 0 ? void 0 : _a[accessorIndex];
            if (!!!accessorDef) {
                return;
            }
            if (accessorDef.bufferView === undefined &&
                accessorDef.sparse === undefined) {
                // Ignore empty accessors, which may be used to declare runtime
                // information about attributes coming from another source (e.g. Draco
                // compression extension).
                return;
            }
            const pendingBufferViews = [];
            if (accessorDef.bufferView !== undefined) {
                pendingBufferViews.push(this.getDependency("bufferView", accessorDef.bufferView));
            }
            if (accessorDef.sparse !== undefined) {
                pendingBufferViews.push(this.getDependency("bufferView", accessorDef.sparse.indices.bufferView));
                pendingBufferViews.push(this.getDependency("bufferView", accessorDef.sparse.values.bufferView));
            }
            const bufferViews = yield Promise.all(pendingBufferViews);
            const bufferView = bufferViews[0];
            const itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
            const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType];
            // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
            const elementBytes = TypedArray.BYTES_PER_ELEMENT;
            const itemBytes = elementBytes * itemSize;
            const byteOffset = accessorDef.byteOffset || 0;
            const byteStride = accessorDef.bufferView !== undefined
                ? (_b = this.gltf.bufferViews) === null || _b === void 0 ? void 0 : _b[accessorDef.bufferView].byteStride
                : undefined;
            const normalized = accessorDef.normalized === true;
            let array, bufferAttribute;
            // The buffer is not interleaved if the stride is the item size in bytes.
            if (byteStride && byteStride !== itemBytes) {
                // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
                // This makes sure that IBA.count reflects accessor.count properly
                const ibSlice = Math.floor(byteOffset / byteStride);
                const ibCacheKey = "InterleavedBuffer:" +
                    accessorDef.bufferView +
                    ":" +
                    accessorDef.componentType +
                    ":" +
                    ibSlice +
                    ":" +
                    accessorDef.count;
                let ibPromise = this.getCache(ibCacheKey);
                let ib = !!ibPromise ? yield ibPromise : undefined;
                if (!!!ib) {
                    array = new TypedArray(bufferView, ibSlice * byteStride, (accessorDef.count * byteStride) / elementBytes);
                    // Integer parameters to IB/IBA are in array elements, not bytes.
                    ib = new Three__namespace.InterleavedBuffer(array, byteStride / elementBytes);
                    this.addCache(ibCacheKey, ib);
                }
                bufferAttribute = new Three__namespace.InterleavedBufferAttribute(ib, itemSize, (byteOffset % byteStride) / elementBytes, normalized);
            }
            else {
                if (bufferView === null) {
                    array = new TypedArray(accessorDef.count * itemSize);
                }
                else {
                    array = new TypedArray(bufferView, byteOffset, accessorDef.count * itemSize);
                }
                bufferAttribute = new Three__namespace.BufferAttribute(array, itemSize, normalized);
            }
            // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
            if (accessorDef.sparse !== undefined) {
                const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
                const TypedArrayIndices = WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];
                const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
                const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;
                const sparseIndices = new TypedArrayIndices(bufferViews[1], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices);
                const sparseValues = new TypedArray(bufferViews[2], byteOffsetValues, accessorDef.sparse.count * itemSize);
                if (!!bufferView) {
                    // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
                    bufferAttribute = new Three__namespace.BufferAttribute(bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized);
                }
                for (let i = 0, il = sparseIndices.length; i < il; i++) {
                    const index = sparseIndices[i];
                    bufferAttribute.setX(index, sparseValues[i * itemSize]);
                    if (itemSize >= 2)
                        bufferAttribute.setY(index, sparseValues[i * itemSize + 1]);
                    if (itemSize >= 3)
                        bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]);
                    if (itemSize >= 4)
                        bufferAttribute.setW(index, sparseValues[i * itemSize + 3]);
                    if (itemSize >= 5)
                        throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
                }
            }
            return bufferAttribute;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     * @param {number} bufferViewIndex
     * @return {Promise<ArrayBuffer>}
     */
    loadBufferView(bufferViewIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const bufferViewDef = (_a = this.gltf.bufferViews) === null || _a === void 0 ? void 0 : _a[bufferViewIndex];
            if (!!!bufferViewDef) {
                return;
            }
            let buffer = yield this.getDependency("buffer", bufferViewDef.buffer);
            if (!!!buffer) {
                for (const extension of Object.values(this.extensions)) {
                    if (extension instanceof BufferViewExtension) {
                        buffer = yield extension.loadBufferView(bufferViewIndex);
                        if (!!buffer) {
                            break;
                        }
                    }
                }
            }
            if (!!!buffer) {
                return;
            }
            const byteLength = bufferViewDef.byteLength || 0;
            const byteOffset = bufferViewDef.byteOffset || 0;
            return buffer.slice(byteOffset, byteOffset + byteLength);
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     * @param {number} bufferIndex
     * @return {Promise<ArrayBuffer>}
     */
    loadBuffer(bufferIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const bufferDef = (_a = this.gltf.buffers) === null || _a === void 0 ? void 0 : _a[bufferIndex];
            if (!!!bufferDef) {
                return undefined;
            }
            if (bufferDef.type && bufferDef.type !== "arraybuffer") {
                throw new Error("THREE.GLTFLoader: " + bufferDef.type + " buffer type is not supported.");
            }
            // If present, GLB container is required to be the first buffer.
            if (bufferDef.uri === undefined && bufferIndex === 0) {
                return this.option.body;
            }
            const resource = yield Promise.resolve(new UnifiedResource(this.option.resType, Three__namespace.LoaderUtils.resolveURL(bufferDef.uri || "", this.option.path)));
            const data = yield doric.resourceLoader(this.option.bridgeContext).load(resource);
            return data;
        });
    }
    /**
     * @param {BufferGeometry} geometry
     * @param {GLTF.Primitive} primitiveDef
     * @param {GLTFParser} parser
     */
    computeBounds(geometry, primitiveDef) {
        var _a, _b;
        const attributes = primitiveDef.attributes;
        const box = new Three__namespace.Box3();
        if (attributes.POSITION !== undefined) {
            const accessor = (_a = this.gltf.accessors) === null || _a === void 0 ? void 0 : _a[attributes.POSITION];
            if (!!!accessor) {
                return;
            }
            const min = accessor.min;
            const max = accessor.max;
            // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.
            if (min !== undefined && max !== undefined) {
                box.set(new Three__namespace.Vector3(min[0], min[1], min[2]), new Three__namespace.Vector3(max[0], max[1], max[2]));
                if (accessor.normalized) {
                    const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
                    box.min.multiplyScalar(boxScale);
                    box.max.multiplyScalar(boxScale);
                }
            }
            else {
                doric.logw("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
                return;
            }
        }
        else {
            return;
        }
        const targets = primitiveDef.targets;
        if (targets !== undefined) {
            const maxDisplacement = new Three__namespace.Vector3();
            const vector = new Three__namespace.Vector3();
            for (let i = 0, il = targets.length; i < il; i++) {
                const target = targets[i];
                if (target.POSITION !== undefined) {
                    const accessor = (_b = this.gltf.accessors) === null || _b === void 0 ? void 0 : _b[target.POSITION];
                    if (!!!accessor) {
                        continue;
                    }
                    const min = accessor.min;
                    const max = accessor.max;
                    // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.
                    if (min !== undefined && max !== undefined) {
                        // we need to get max of absolute components because target weight is [-1,1]
                        vector.setX(Math.max(Math.abs(min[0]), Math.abs(max[0])));
                        vector.setY(Math.max(Math.abs(min[1]), Math.abs(max[1])));
                        vector.setZ(Math.max(Math.abs(min[2]), Math.abs(max[2])));
                        if (accessor.normalized) {
                            const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
                            vector.multiplyScalar(boxScale);
                        }
                        // Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
                        // to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
                        // are used to implement key-frame animations and as such only two are active at a time - this results in very large
                        // boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
                        maxDisplacement.max(vector);
                    }
                    else {
                        doric.logw("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
                    }
                }
            }
            // As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
            box.expandByVector(maxDisplacement);
        }
        geometry.boundingBox = box;
        const sphere = new Three__namespace.Sphere();
        box.getCenter(sphere.center);
        sphere.radius = box.min.distanceTo(box.max) / 2;
        geometry.boundingSphere = sphere;
    }
    /**
     * @param {BufferGeometry} geometry
     * @param {GLTF.Primitive} primitiveDef
     * @param {GLTFParser} parser
     * @return {Promise<BufferGeometry>}
     */
    addPrimitiveAttributes(geometry, primitiveDef) {
        return __awaiter(this, void 0, void 0, function* () {
            const attributes = primitiveDef.attributes;
            const pending = [];
            const assignAttributeAccessor = (accessorIndex, attributeName) => __awaiter(this, void 0, void 0, function* () {
                const accessor = yield this.getDependency("accessor", accessorIndex);
                geometry.setAttribute(attributeName, accessor);
            });
            for (const gltfAttributeName in attributes) {
                const threeAttributeName = ATTRIBUTES$1[gltfAttributeName] || gltfAttributeName.toLowerCase();
                // Skip attributes already provided by e.g. Draco extension.
                if (threeAttributeName in geometry.attributes)
                    continue;
                pending.push(assignAttributeAccessor(attributes[gltfAttributeName], threeAttributeName));
            }
            if (primitiveDef.indices !== undefined && !geometry.index) {
                const accessor = this.getDependency("accessor", primitiveDef.indices).then((accessor) => {
                    geometry.setIndex(accessor);
                });
                pending.push(accessor);
            }
            assignExtrasToUserData(geometry, primitiveDef);
            this.computeBounds(geometry, primitiveDef);
            yield Promise.all(pending);
            if (primitiveDef.targets !== undefined) {
                return this.addMorphTargets(geometry, primitiveDef.targets);
            }
            else {
                return geometry;
            }
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
     *
     * @param {BufferGeometry} geometry
     * @param {Array<GLTF.Target>} targets
     * @param {GLTFParser} parser
     * @return {Promise<BufferGeometry>}
     */
    addMorphTargets(geometry, targets) {
        return __awaiter(this, void 0, void 0, function* () {
            let hasMorphPosition = false;
            let hasMorphNormal = false;
            let hasMorphColor = false;
            for (let i = 0, il = targets.length; i < il; i++) {
                const target = targets[i];
                if (target.POSITION !== undefined)
                    hasMorphPosition = true;
                if (target.NORMAL !== undefined)
                    hasMorphNormal = true;
                if (target.COLOR_0 !== undefined)
                    hasMorphColor = true;
                if (hasMorphPosition && hasMorphNormal && hasMorphColor)
                    break;
            }
            if (!hasMorphPosition && !hasMorphNormal && !hasMorphColor)
                return geometry;
            const pendingPositionAccessors = [];
            const pendingNormalAccessors = [];
            const pendingColorAccessors = [];
            for (let i = 0, il = targets.length; i < il; i++) {
                const target = targets[i];
                if (hasMorphPosition) {
                    const pendingAccessor = target.POSITION !== undefined
                        ? this.getDependency("accessor", target.POSITION)
                        : geometry.attributes.position;
                    pendingPositionAccessors.push(pendingAccessor);
                }
                if (hasMorphNormal) {
                    const pendingAccessor = target.NORMAL !== undefined
                        ? this.getDependency("accessor", target.NORMAL)
                        : geometry.attributes.normal;
                    pendingNormalAccessors.push(pendingAccessor);
                }
                if (hasMorphColor) {
                    const pendingAccessor = target.COLOR_0 !== undefined
                        ? this.getDependency("accessor", target.COLOR_0)
                        : geometry.attributes.color;
                    pendingColorAccessors.push(pendingAccessor);
                }
            }
            const accessors = yield Promise.all([
                Promise.all(pendingPositionAccessors),
                Promise.all(pendingNormalAccessors),
                Promise.all(pendingColorAccessors),
            ]);
            const morphPositions = accessors[0];
            const morphNormals = accessors[1];
            const morphColors = accessors[2];
            if (hasMorphPosition)
                geometry.morphAttributes.position = morphPositions;
            if (hasMorphNormal)
                geometry.morphAttributes.normal = morphNormals;
            if (hasMorphColor)
                geometry.morphAttributes.color = morphColors;
            geometry.morphTargetsRelative = true;
            return geometry;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
     *
     * Creates BufferGeometries from primitives.
     *
     * @param {Array<GLTF.Primitive>} primitives
     * @return {Promise<Array<BufferGeometry>>}
     */
    loadGeometries(primitives) {
        const extensions = this.extensions;
        const cache = this.primitiveCache;
        const createDracoPrimitive = (primitive) => __awaiter(this, void 0, void 0, function* () {
            const geometry = yield extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(primitive);
            return this.addPrimitiveAttributes(geometry, primitive);
        });
        const pending = [];
        for (let i = 0, il = primitives.length; i < il; i++) {
            const primitive = primitives[i];
            const cacheKey = createPrimitiveKey(primitive);
            // See if we've already created this geometry
            const cached = cache[cacheKey];
            if (cached) {
                // Use the cached geometry if it exists
                pending.push(cached.promise);
            }
            else {
                let geometryPromise;
                if (primitive.extensions &&
                    primitive.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]) {
                    // Use DRACO geometry if available
                    geometryPromise = createDracoPrimitive(primitive);
                }
                else {
                    // Otherwise create a new geometry
                    geometryPromise = this.addPrimitiveAttributes(new Three__namespace.BufferGeometry(), primitive);
                }
                // Cache this geometry
                cache[cacheKey] = { primitive: primitive, promise: geometryPromise };
                pending.push(geometryPromise);
            }
        }
        return Promise.all(pending);
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
     * @param {number} meshIndex
     * @return {Promise<Group|Mesh|SkinnedMesh>}
     */
    loadMesh(meshIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = this.extensions;
            const meshDef = (_a = this.gltf.meshes) === null || _a === void 0 ? void 0 : _a[meshIndex];
            const primitives = meshDef === null || meshDef === void 0 ? void 0 : meshDef.primitives;
            if (!!!meshDef || !!!primitives) {
                return;
            }
            const pending = [];
            primitives.forEach((e) => {
                if (e.material !== undefined) {
                    pending.push(this.getDependency("material", e.material));
                }
                else {
                    pending.push(createDefaultMaterial());
                }
            });
            pending.push(this.loadGeometries(primitives));
            const results = yield Promise.all(pending);
            const materials = results.slice(0, results.length - 1);
            const geometries = results[results.length - 1];
            const meshes = [];
            for (let i = 0; i < geometries.length; i++) {
                const geometry = geometries[i];
                const primitive = primitives[i];
                // 1. create Mesh
                let mesh;
                const material = materials[i];
                if (primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
                    primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
                    primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
                    primitive.mode === undefined) {
                    // .isSkinnedMesh isn't in glTF spec. See ._markDefs()
                    mesh =
                        meshDef.isSkinnedMesh === true
                            ? new Three__namespace.SkinnedMesh(geometry, material)
                            : new Three__namespace.Mesh(geometry, material);
                    if (mesh.isSkinnedMesh &&
                        !mesh.geometry.attributes.skinWeight.normalized) {
                        // we normalize floating point skin weight array to fix malformed assets (see #15319)
                        // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
                        mesh.normalizeSkinWeights();
                    }
                    if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP) {
                        mesh.geometry = toTrianglesDrawMode(mesh.geometry, Three__namespace.TriangleStripDrawMode);
                    }
                    else if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN) {
                        mesh.geometry = toTrianglesDrawMode(mesh.geometry, Three__namespace.TriangleFanDrawMode);
                    }
                }
                else if (primitive.mode === WEBGL_CONSTANTS.LINES) {
                    mesh = new Three__namespace.LineSegments(geometry, material);
                }
                else if (primitive.mode === WEBGL_CONSTANTS.LINE_STRIP) {
                    mesh = new Three__namespace.Line(geometry, material);
                }
                else if (primitive.mode === WEBGL_CONSTANTS.LINE_LOOP) {
                    mesh = new Three__namespace.LineLoop(geometry, material);
                }
                else if (primitive.mode === WEBGL_CONSTANTS.POINTS) {
                    mesh = new Three__namespace.Points(geometry, material);
                }
                else {
                    throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + primitive.mode);
                }
                if (Object.keys(mesh.geometry.morphAttributes).length > 0) {
                    updateMorphTargets(mesh, meshDef);
                }
                mesh.name = createUniqueName(meshDef.name || "mesh_" + meshIndex);
                assignExtrasToUserData(mesh, meshDef);
                if (primitive.extensions)
                    addUnknownExtensionsToUserData(extensions, mesh, primitive);
                yield this.assignFinalMaterial(mesh);
                meshes.push(mesh);
            }
            for (let i = 0, il = meshes.length; i < il; i++) {
                this.associations.set(meshes[i], {
                    index: meshIndex,
                    primitives: i,
                });
            }
            if (meshes.length === 1) {
                return meshes[0];
            }
            const group = new Three__namespace.Group();
            this.associations.set(group, { index: meshIndex });
            for (let i = 0, il = meshes.length; i < il; i++) {
                group.add(meshes[i]);
            }
            return group;
        });
    }
    /**
     * Assigns final material to a Mesh, Line, or Points instance. The instance
     * already has a material (generated from the glTF material options alone)
     * but reuse of the same glTF material may require multiple threejs materials
     * to accommodate different primitive types, defines, etc. New materials will
     * be created if necessary, and reused from a cache.
     * @param  {Object3D} mesh Mesh, Line, or Points instance.
     */
    assignFinalMaterial(mesh) {
        return __awaiter(this, void 0, void 0, function* () {
            const geometry = mesh.geometry;
            let material = mesh.material;
            const useDerivativeTangents = geometry.attributes.tangent === undefined;
            const useVertexColors = geometry.attributes.color !== undefined;
            const useFlatShading = geometry.attributes.normal === undefined;
            if (mesh instanceof Three__namespace.Points) {
                const cacheKey = "PointsMaterial:" + material.uuid;
                let pointsMaterialPromise = this.getCache(cacheKey);
                let pointsMaterial = !!pointsMaterialPromise
                    ? yield pointsMaterialPromise
                    : undefined;
                if (!pointsMaterial) {
                    pointsMaterial = new Three__namespace.PointsMaterial();
                    Three__namespace.Material.prototype.copy.call(pointsMaterial, material);
                    pointsMaterial.color.copy(material.color);
                    pointsMaterial.map = material.map;
                    pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px
                    this.addCache(cacheKey, pointsMaterial);
                }
                material = pointsMaterial;
            }
            else if (mesh instanceof Three__namespace.Line) {
                const cacheKey = "LineBasicMaterial:" + material.uuid;
                let lineMaterialPromise = this.getCache(cacheKey);
                let lineMaterial = !!lineMaterialPromise
                    ? yield lineMaterialPromise
                    : undefined;
                if (!lineMaterial) {
                    lineMaterial = new Three__namespace.LineBasicMaterial();
                    Three__namespace.Material.prototype.copy.call(lineMaterial, material);
                    lineMaterial.color.copy(material.color);
                    this.addCache(cacheKey, lineMaterial);
                }
                material = lineMaterial;
            }
            // Clone the material if it will be modified
            if (useDerivativeTangents || useVertexColors || useFlatShading) {
                let cacheKey = "ClonedMaterial:" + material.uuid + ":";
                if (material instanceof GLTFMeshStandardSGMaterial)
                    cacheKey += "specular-glossiness:";
                if (useDerivativeTangents)
                    cacheKey += "derivative-tangents:";
                if (useVertexColors)
                    cacheKey += "vertex-colors:";
                if (useFlatShading)
                    cacheKey += "flat-shading:";
                let cachedMaterialPromise = this.getCache(cacheKey);
                let cachedMaterial = !!cachedMaterialPromise
                    ? yield cachedMaterialPromise
                    : undefined;
                if (!!!cachedMaterial) {
                    cachedMaterial = material.clone();
                    if (useVertexColors)
                        cachedMaterial.vertexColors = true;
                    if (useFlatShading)
                        cachedMaterial.flatShading = true;
                    if (useDerivativeTangents) {
                        // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995
                        if (cachedMaterial.normalScale)
                            cachedMaterial.normalScale.y *= -1;
                        if (cachedMaterial.clearcoatNormalScale)
                            cachedMaterial.clearcoatNormalScale.y *= -1;
                    }
                    this.addCache(cacheKey, cachedMaterial);
                    this.associations.set(cachedMaterial, this.associations.get(material));
                }
                material = cachedMaterial;
            }
            // workarounds for mesh and geometry
            if (material.aoMap &&
                geometry.attributes.uv2 === undefined &&
                geometry.attributes.uv !== undefined) {
                geometry.setAttribute("uv2", geometry.attributes.uv);
            }
            mesh.material = material;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
     * @param {number} cameraIndex
     * @return {Promise<THREE.Camera>}
     */
    loadCamera(cameraIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let camera;
            const cameraDef = (_a = this.gltf.cameras) === null || _a === void 0 ? void 0 : _a[cameraIndex];
            if (!!!cameraDef) {
                return;
            }
            const params = cameraDef[cameraDef.type];
            if (!!!params) {
                doric.logw("THREE.GLTFLoader: Missing camera parameters.");
                return;
            }
            if (cameraDef.type === "perspective") {
                camera = new Three__namespace.PerspectiveCamera(Three__namespace.MathUtils.radToDeg(params.yfov), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6);
            }
            else if (cameraDef.type === "orthographic") {
                camera = new Three__namespace.OrthographicCamera(-params.xmag, params.xmag, params.ymag, -params.ymag, params.znear, params.zfar);
            }
            else {
                throw new Error(`THREE.GLTFLoader: Donot support camera type: ${cameraDef.type}`);
            }
            if (cameraDef.name)
                camera.name = createUniqueName(cameraDef.name);
            assignExtrasToUserData(camera, cameraDef);
            return Promise.resolve(camera);
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
     * @param {number} skinIndex
     * @return {Promise<Object>}
     */
    loadSkin(skinIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const skinDef = (_a = this.gltf.skins) === null || _a === void 0 ? void 0 : _a[skinIndex];
            if (!!!skinDef) {
                return;
            }
            const skinEntry = { joints: skinDef.joints };
            if (skinDef.inverseBindMatrices === undefined) {
                return skinEntry;
            }
            const accessor = yield this.getDependency("accessor", skinDef.inverseBindMatrices);
            skinEntry.inverseBindMatrices = accessor;
            return skinEntry;
        });
    }
    /**
     * Marks the special nodes/meshes in json for efficient parse.
     */
    _markDefs() {
        const nodeDefs = this.gltf.nodes || [];
        const skinDefs = this.gltf.skins || [];
        const meshDefs = this.gltf.meshes || [];
        // Nothing in the node definition indicates whether it is a Bone or an
        // Object3D. Use the skins' joint references to mark bones.
        for (let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex++) {
            const joints = skinDefs[skinIndex].joints;
            for (let i = 0, il = joints.length; i < il; i++) {
                nodeDefs[joints[i]].isBone = true;
            }
        }
        // Iterate over all nodes, marking references to shared resources,
        // as well as skeleton joints.
        for (let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex++) {
            const nodeDef = nodeDefs[nodeIndex];
            if (nodeDef.mesh !== undefined) {
                this._addNodeRef(this.meshCache, nodeDef.mesh);
                // Nothing in the mesh definition indicates whether it is
                // a SkinnedMesh or Mesh. Use the node's mesh reference
                // to mark SkinnedMesh if node has skin.
                if (nodeDef.skin !== undefined) {
                    meshDefs[nodeDef.mesh].isSkinnedMesh = true;
                }
            }
            if (nodeDef.camera !== undefined) {
                this._addNodeRef(this.cameraCache, nodeDef.camera);
            }
        }
    }
    /**
     * Counts references to shared node / Object3D resources. These resources
     * can be reused, or "instantiated", at multiple nodes in the scene
     * hierarchy. Mesh, Camera, and Light instances are instantiated and must
     * be marked. Non-scenegraph resources (like Materials, Geometries, and
     * Textures) can be reused directly and are not marked here.
     *
     * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
     */
    _addNodeRef(cache, index) {
        if (index === undefined)
            return;
        if (cache.refs[index] === undefined) {
            cache.refs[index] = cache.uses[index] = 0;
        }
        cache.refs[index]++;
    }
    /** Returns a reference to a shared resource, cloning it if necessary. */
    _getNodeRef(cache, index, object) {
        if (cache.refs[index] <= 1)
            return object;
        const ref = object.clone();
        // Propagates mappings to the cloned object, prevents mappings on the
        // original object from being lost.
        const updateMappings = (original, clone) => {
            const mappings = this.associations.get(original);
            if (!!mappings) {
                this.associations.set(clone, mappings);
            }
            for (const [i, child] of original.children.entries()) {
                updateMappings(child, clone.children[i]);
            }
        };
        updateMappings(object, ref);
        ref.name += "_instance_" + cache.uses[index]++;
        return ref;
    }
    createNodeMesh(nodeIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const nodeDef = (_a = this.gltf.nodes) === null || _a === void 0 ? void 0 : _a[nodeIndex];
            if ((nodeDef === null || nodeDef === void 0 ? void 0 : nodeDef.mesh) === undefined)
                return;
            const mesh = yield this.getDependency("mesh", nodeDef.mesh);
            const node = this._getNodeRef(this.meshCache, nodeDef.mesh, mesh);
            // if weights are provided on the node, override weights on the mesh.
            if (nodeDef.weights !== undefined) {
                node.traverse((o) => {
                    if (!(o instanceof Three__namespace.Mesh) ||
                        !!!nodeDef.weights ||
                        !!!o.morphTargetInfluences)
                        return;
                    for (let i = 0; i < nodeDef.weights.length; i++) {
                        o.morphTargetInfluences[i] = nodeDef.weights[i];
                    }
                });
            }
            return node;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
     * @param {number} animationIndex
     * @return {Promise<AnimationClip>}
     */
    loadAnimation(animationIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const animationDef = (_a = this.gltf.animations) === null || _a === void 0 ? void 0 : _a[animationIndex];
            if (!!!animationDef) {
                return;
            }
            const pendingNodes = [];
            const pendingInputAccessors = [];
            const pendingOutputAccessors = [];
            const pendingSamplers = [];
            const pendingTargets = [];
            for (let i = 0, il = animationDef.channels.length; i < il; i++) {
                const channel = animationDef.channels[i];
                const sampler = animationDef.samplers[channel.sampler];
                const target = channel.target;
                const name = target.node !== undefined ? target.node : target.id; // NOTE: target.id is deprecated.
                const input = animationDef.parameters !== undefined
                    ? animationDef.parameters[sampler.input]
                    : sampler.input;
                const output = animationDef.parameters !== undefined
                    ? animationDef.parameters[sampler.output]
                    : sampler.output;
                pendingNodes.push(this.getDependency("node", name));
                pendingInputAccessors.push(this.getDependency("accessor", input));
                pendingOutputAccessors.push(this.getDependency("accessor", output));
                pendingSamplers.push(sampler);
                pendingTargets.push(target);
            }
            const dependencies = yield Promise.all([
                Promise.all(pendingNodes),
                Promise.all(pendingInputAccessors),
                Promise.all(pendingOutputAccessors),
                Promise.all(pendingSamplers),
                Promise.all(pendingTargets),
            ]);
            const nodes = dependencies[0];
            const inputAccessors = dependencies[1];
            const outputAccessors = dependencies[2];
            const samplers = dependencies[3];
            const targets = dependencies[4];
            const tracks = [];
            for (let i = 0, il = nodes.length; i < il; i++) {
                const node = nodes[i];
                const inputAccessor = inputAccessors[i];
                const outputAccessor = outputAccessors[i];
                const sampler = samplers[i];
                const target = targets[i];
                if (node === undefined)
                    continue;
                node.updateMatrix();
                node.matrixAutoUpdate = true;
                let TypedKeyframeTrack;
                switch (PATH_PROPERTIES[target.path]) {
                    case PATH_PROPERTIES.weights:
                        TypedKeyframeTrack = Three__namespace.NumberKeyframeTrack;
                        break;
                    case PATH_PROPERTIES.rotation:
                        TypedKeyframeTrack = Three__namespace.QuaternionKeyframeTrack;
                        break;
                    case PATH_PROPERTIES.position:
                    case PATH_PROPERTIES.scale:
                    default:
                        TypedKeyframeTrack = Three__namespace.VectorKeyframeTrack;
                        break;
                }
                const targetName = node.name ? node.name : node.uuid;
                const interpolation = sampler.interpolation !== undefined
                    ? INTERPOLATION[sampler.interpolation]
                    : Three__namespace.InterpolateLinear;
                const targetNames = [];
                if (PATH_PROPERTIES[target.path] === PATH_PROPERTIES.weights) {
                    node.traverse((object) => {
                        if (object.morphTargetInfluences) {
                            targetNames.push(object.name ? object.name : object.uuid);
                        }
                    });
                }
                else {
                    targetNames.push(targetName);
                }
                let outputArray = outputAccessor.array;
                if (outputAccessor.normalized) {
                    const scale = getNormalizedComponentScale(outputArray.constructor);
                    const scaled = new Float32Array(outputArray.length);
                    for (let j = 0, jl = outputArray.length; j < jl; j++) {
                        scaled[j] = outputArray[j] * scale;
                    }
                    outputArray = scaled;
                }
                for (let j = 0, jl = targetNames.length; j < jl; j++) {
                    const track = new TypedKeyframeTrack(targetNames[j] + "." + PATH_PROPERTIES[target.path], inputAccessor.array, outputArray, interpolation);
                    // Override interpolation with custom factory method.
                    if (sampler.interpolation === "CUBICSPLINE") {
                        track.createInterpolant =
                            function InterpolantFactoryMethodGLTFCubicSpline(result) {
                                // A CUBICSPLINE keyframe in glTF has three output values for each input value,
                                // representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
                                // must be divided by three to get the interpolant's sampleSize argument.
                                const interpolantType = this instanceof Three__namespace.QuaternionKeyframeTrack
                                    ? GLTFCubicSplineQuaternionInterpolant
                                    : GLTFCubicSplineInterpolant;
                                return new interpolantType(this.times, this.values, this.getValueSize() / 3, result);
                            };
                        // Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
                        track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
                    }
                    tracks.push(track);
                }
            }
            const name = animationDef.name
                ? animationDef.name
                : "animation_" + animationIndex;
            return new Three__namespace.AnimationClip(name, undefined, tracks);
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
     * @param {number} nodeIndex
     * @return {Promise<Object3D>}
     */
    loadNode(nodeIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = this.extensions;
            const nodeDef = (_a = this.gltf.nodes) === null || _a === void 0 ? void 0 : _a[nodeIndex];
            if (!!!nodeDef) {
                return;
            }
            // reserve node's name before its dependencies, so the root has the intended name.
            const nodeName = nodeDef.name ? createUniqueName(nodeDef.name) : "";
            const pending = [];
            const meshPromise = this.createNodeMesh(nodeIndex);
            if (meshPromise) {
                pending.push(meshPromise);
            }
            const cameraIndex = nodeDef.camera;
            if (cameraIndex !== undefined) {
                pending.push(this.getDependency("camera", cameraIndex).then((camera) => {
                    return this._getNodeRef(this.cameraCache, cameraIndex, camera);
                }));
            }
            Object.values(this.extensions).forEach((extension) => {
                if (extension instanceof AttachmentExtension) {
                    pending.push(extension.createNodeAttachment(nodeIndex));
                }
            });
            const objects = (yield Promise.all(pending)).filter((e) => !!e);
            let node;
            // .isBone isn't in glTF spec. See ._markDefs
            if (nodeDef.isBone === true) {
                node = new Three__namespace.Bone();
            }
            else if (objects.length > 1) {
                node = new Three__namespace.Group();
            }
            else if (objects.length === 1) {
                node = objects[0];
            }
            else {
                node = new Three__namespace.Object3D();
            }
            if (node !== objects[0]) {
                for (let i = 0, il = objects.length; i < il; i++) {
                    node.add(objects[i]);
                }
            }
            if (nodeDef.name) {
                node.userData.name = nodeDef.name;
                node.name = nodeName;
            }
            assignExtrasToUserData(node, nodeDef);
            if (nodeDef.extensions)
                addUnknownExtensionsToUserData(extensions, node, nodeDef);
            if (nodeDef.matrix !== undefined) {
                const matrix = new Three__namespace.Matrix4();
                matrix.fromArray(nodeDef.matrix);
                node.applyMatrix4(matrix);
            }
            else {
                if (nodeDef.translation !== undefined) {
                    node.position.fromArray(nodeDef.translation);
                }
                if (nodeDef.rotation !== undefined) {
                    node.quaternion.fromArray(nodeDef.rotation);
                }
                if (nodeDef.scale !== undefined) {
                    node.scale.fromArray(nodeDef.scale);
                }
            }
            const association = this.associations.get(node);
            if (!!!association) {
                this.associations.set(node, { index: nodeIndex });
            }
            else {
                association.index = nodeIndex;
            }
            return node;
        });
    }
    buildNodeHierarchy(nodeId, parentObject) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const nodeDef = (_a = this.gltf.nodes) === null || _a === void 0 ? void 0 : _a[nodeId];
            if (!!!nodeDef) {
                throw new Error("buildNodeHierarchy error");
            }
            const node = yield this.getDependency("node", nodeId);
            if (nodeDef.skin !== undefined) {
                // build skeleton here as well
                const skinEntry = yield this.getDependency("skin", nodeDef.skin);
                const pendingJoints = [];
                for (let i = 0, il = skinEntry.joints.length; i < il; i++) {
                    pendingJoints.push(this.getDependency("node", skinEntry.joints[i]));
                }
                const jointNodes = yield Promise.all(pendingJoints);
                node.traverse((mesh) => {
                    if (!mesh.isMesh)
                        return;
                    const bones = [];
                    const boneInverses = [];
                    for (let j = 0, jl = jointNodes.length; j < jl; j++) {
                        const jointNode = jointNodes[j];
                        if (jointNode) {
                            bones.push(jointNode);
                            const mat = new Three__namespace.Matrix4();
                            if (skinEntry.inverseBindMatrices !== undefined) {
                                mat.fromArray(skinEntry.inverseBindMatrices.array, j * 16);
                            }
                            boneInverses.push(mat);
                        }
                        else {
                            doric.logw('THREE.GLTFLoader: Joint "%s" could not be found.', skinEntry.joints[j]);
                        }
                    }
                    mesh.bind(new Three__namespace.Skeleton(bones, boneInverses), mesh.matrixWorld);
                });
            }
            parentObject.add(node);
            const pending = [];
            if (nodeDef.children) {
                const children = nodeDef.children;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    pending.push(this.buildNodeHierarchy(child, node));
                }
            }
            return Promise.all(pending);
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
     * @param {number} sceneIndex
     * @return {Promise<Group>}
     */
    loadScene(sceneIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = this.extensions;
            const sceneDef = (_a = this.gltf.scenes) === null || _a === void 0 ? void 0 : _a[sceneIndex];
            if (!!!sceneDef) {
                doric.loge("THREE.GLTFLoader:loadScene", sceneIndex, "null");
                return;
            }
            // Loader returns Group, not Scene.
            // See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172
            const scene = new Three__namespace.Group();
            if (sceneDef.name)
                scene.name = createUniqueName(sceneDef.name);
            assignExtrasToUserData(scene, sceneDef);
            if (sceneDef.extensions)
                addUnknownExtensionsToUserData(extensions, scene, sceneDef);
            const nodeIds = sceneDef.nodes || [];
            const pending = [];
            for (let i = 0; i < nodeIds.length; i++) {
                pending.push(this.buildNodeHierarchy(nodeIds[i], scene));
            }
            yield Promise.all(pending);
            // Removes dangling associations, associations that reference a node that
            // didn't make it into the scene.
            const reduceAssociations = (node) => {
                const reducedAssociations = new Map();
                for (const [key, value] of this.associations) {
                    if (key instanceof Three__namespace.Material || key instanceof Three__namespace.Texture) {
                        reducedAssociations.set(key, value);
                    }
                }
                node.traverse((node) => {
                    const mappings = this.associations.get(node);
                    if (!!mappings) {
                        reducedAssociations.set(node, mappings);
                    }
                });
                return reducedAssociations;
            };
            this.associations = reduceAssociations(scene);
            return scene;
        });
    }
    getDependency(type, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = type + ":" + index;
            let dependency = this.getCache(cacheKey);
            if (!!!dependency) {
                switch (type) {
                    case "material":
                        dependency = this.loadMaterial(index);
                        break;
                    case "texture":
                        dependency = this.loadTexture(index);
                        break;
                    case "buffer":
                        dependency = this.loadBuffer(index);
                        break;
                    case "bufferView":
                        dependency = this.loadBufferView(index);
                        if (!!!dependency) {
                            for (const extension of Object.values(this.extensions)) {
                                if (extension instanceof BufferViewExtension) {
                                    dependency = extension.loadBufferView(index);
                                    if (!!!dependency) {
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    case "accessor":
                        dependency = this.loadAccessor(index);
                        break;
                    case "mesh":
                        dependency = this.loadMesh(index);
                        break;
                    case "camera":
                        dependency = this.loadCamera(index);
                        break;
                    case "skin":
                        dependency = this.loadSkin(index);
                        break;
                    case "node":
                        dependency = this.loadNode(index);
                        break;
                    case "animation":
                        dependency = this.loadAnimation(index);
                        break;
                    case "scene":
                        dependency = this.loadScene(index);
                        break;
                }
                if (!!dependency) {
                    this.addCache(cacheKey, dependency);
                }
            }
            const ret = (yield dependency);
            if (!!!ret) {
                doric.loge(`THREE.GLTFLoader.GetDependency: Unable to get ${type} at index ${index}`);
            }
            return ret;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
     * @param {number} materialIndex
     * @return {Promise<Material>}
     */
    loadMaterial(materialIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = this.extensions;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!materialDef) {
                return;
            }
            let materialType;
            const materialParams = {};
            const materialExtensions = materialDef.extensions || {};
            const pending = [];
            if (materialExtensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS]) {
                const sgExtension = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS];
                materialType = sgExtension.getMaterialType();
                pending.push(sgExtension.extendParams(materialParams, materialDef));
            }
            else if (materialExtensions[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
                const kmuExtension = extensions[EXTENSIONS.KHR_MATERIALS_UNLIT];
                materialType = kmuExtension.getMaterialType();
                pending.push(kmuExtension.extendParams(materialParams, materialDef));
            }
            else {
                // Specification:
                // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
                const metallicRoughness = materialDef.pbrMetallicRoughness || {};
                materialParams.color = new Three__namespace.Color(1.0, 1.0, 1.0);
                materialParams.opacity = 1.0;
                if (Array.isArray(metallicRoughness.baseColorFactor)) {
                    const array = metallicRoughness.baseColorFactor;
                    materialParams.color.fromArray(array);
                    materialParams.opacity = array[3];
                }
                if (metallicRoughness.baseColorTexture !== undefined) {
                    pending.push(this.assignTexture(materialParams, "map", metallicRoughness.baseColorTexture));
                }
                materialParams.metalness =
                    metallicRoughness.metallicFactor !== undefined
                        ? metallicRoughness.metallicFactor
                        : 1.0;
                materialParams.roughness =
                    metallicRoughness.roughnessFactor !== undefined
                        ? metallicRoughness.roughnessFactor
                        : 1.0;
                if (metallicRoughness.metallicRoughnessTexture !== undefined) {
                    pending.push(this.assignTexture(materialParams, "metalnessMap", metallicRoughness.metallicRoughnessTexture));
                    pending.push(this.assignTexture(materialParams, "roughnessMap", metallicRoughness.metallicRoughnessTexture));
                }
                const extensions = Object.values(this.extensions).filter((e) => e instanceof MeshExtension);
                for (const extension of extensions) {
                    materialType = extension.getMaterialType(materialIndex);
                    if (materialType) {
                        break;
                    }
                }
                if (!!!materialType) {
                    materialType = Three__namespace.MeshStandardMaterial;
                }
                pending.push(Promise.all(extensions.map((e) => {
                    return (e.extendMaterialParams &&
                        e.extendMaterialParams(materialIndex, materialParams));
                })));
            }
            if (materialDef.doubleSided === true) {
                materialParams.side = Three__namespace.DoubleSide;
            }
            const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;
            if (alphaMode === ALPHA_MODES.BLEND) {
                materialParams.transparent = true;
                // See: https://github.com/mrdoob/three.js/issues/17706
                materialParams.depthWrite = false;
            }
            else {
                materialParams.transparent = false;
                if (alphaMode === ALPHA_MODES.MASK) {
                    materialParams.alphaTest =
                        materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
                }
            }
            if (materialDef.normalTexture !== undefined &&
                materialType !== Three__namespace.MeshBasicMaterial) {
                pending.push(this.assignTexture(materialParams, "normalMap", materialDef.normalTexture));
                materialParams.normalScale = new Three__namespace.Vector2(1, 1);
                if (materialDef.normalTexture.scale !== undefined) {
                    const scale = materialDef.normalTexture.scale;
                    materialParams.normalScale.set(scale, scale);
                }
            }
            if (materialDef.occlusionTexture !== undefined &&
                materialType !== Three__namespace.MeshBasicMaterial) {
                pending.push(this.assignTexture(materialParams, "aoMap", materialDef.occlusionTexture));
                if (materialDef.occlusionTexture.strength !== undefined) {
                    materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;
                }
            }
            if (materialDef.emissiveFactor !== undefined &&
                materialType !== Three__namespace.MeshBasicMaterial) {
                materialParams.emissive = new Three__namespace.Color().fromArray(materialDef.emissiveFactor);
            }
            if (materialDef.emissiveTexture !== undefined &&
                materialType !== Three__namespace.MeshBasicMaterial) {
                pending.push(this.assignTexture(materialParams, "emissiveMap", materialDef.emissiveTexture));
            }
            return Promise.all(pending).then(() => {
                let material;
                if (!!!materialType) {
                    return;
                }
                if (materialType === GLTFMeshStandardSGMaterial) {
                    material = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS].createMaterial(materialParams);
                }
                else {
                    material = new materialType(materialParams);
                }
                if (materialDef.name)
                    material.name = materialDef.name;
                // baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.
                if (material.map)
                    material.map.encoding = Three__namespace.sRGBEncoding;
                if (material.emissiveMap)
                    material.emissiveMap.encoding = Three__namespace.sRGBEncoding;
                assignExtrasToUserData(material, materialDef);
                this.associations.set(material, { index: materialIndex });
                if (materialDef.extensions)
                    addUnknownExtensionsToUserData(extensions, material, materialDef);
                return material;
            });
        });
    }
    /**
     * Asynchronously assigns a texture to the given material parameters.
     * @param {Object} materialParams
     * @param {string} mapName
     * @param {Object} mapDef
     * @return {Promise<Texture>}
     */
    assignTexture(materialParams, mapName, mapDef) {
        return __awaiter(this, void 0, void 0, function* () {
            let texture = yield this.getDependency("texture", mapDef.index);
            // Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
            // However, we will copy UV set 0 to UV set 1 on demand for aoMap
            if (!!!texture) {
                doric.loge("THREE.GLTFLoader:assignTexture", mapDef.index, "null");
                return;
            }
            if (mapDef.texCoord !== undefined &&
                mapDef.texCoord != 0 &&
                !(mapName === "aoMap" && mapDef.texCoord == 1)) {
                doric.logw("THREE.GLTFLoader: Custom UV set " +
                    mapDef.texCoord +
                    " for texture " +
                    mapName +
                    " not yet supported.");
            }
            if (this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
                const transform = mapDef.extensions !== undefined
                    ? mapDef.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]
                    : undefined;
                if (transform) {
                    const gltfReference = this.associations.get(texture);
                    texture = this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM].extendTexture(texture, transform);
                    if (!!gltfReference) {
                        this.associations.set(texture, gltfReference);
                    }
                }
            }
            materialParams[mapName] = texture;
            return texture;
        });
    }
    loadTexture(textureIndex) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const textureDef = (_a = this.gltf.textures) === null || _a === void 0 ? void 0 : _a[textureIndex];
            if ((textureDef === null || textureDef === void 0 ? void 0 : textureDef.source) === undefined) {
                let dependency;
                for (const extension of Object.values(this.extensions)) {
                    if (extension instanceof TextureExtension) {
                        dependency = extension.loadTexture(textureIndex);
                        if (!!dependency) {
                            break;
                        }
                    }
                }
                return dependency;
            }
            const source = (_b = this.gltf.images) === null || _b === void 0 ? void 0 : _b[textureDef.source];
            if (!!!source) {
                return;
            }
            return this.loadTextureImage(textureIndex, source);
        });
    }
    loadTextureImage(textureIndex, source) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const textureDef = (_a = this.gltf.textures) === null || _a === void 0 ? void 0 : _a[textureIndex];
            if (!!!textureDef) {
                return;
            }
            const cacheKey = (source.uri || source.bufferView) + ":" + textureDef.sampler;
            if (!!this.textureCache[cacheKey]) {
                // See https://github.com/mrdoob/three.js/issues/21559.
                return this.textureCache[cacheKey];
            }
            let resource;
            if (source.bufferView !== undefined) {
                const arrayBuffer = yield this.getDependency("bufferView", source.bufferView);
                if (!!!arrayBuffer) {
                    doric.loge(`THREE.GLTFLoader: Image ${textureIndex} is missing bufferView ${source.bufferView}`);
                    return;
                }
                resource = new ArrayBufferResource(arrayBuffer);
            }
            else if (source.uri !== undefined) {
                const url = Three__namespace.LoaderUtils.resolveURL(decodeURIComponent(source.uri) || "", this.option.path);
                resource = new UnifiedResource(this.option.resType, url);
            }
            else {
                doric.loge(`THREE.GLTFLoader: Image ${textureIndex} is missing URI and bufferView,source is ${JSON.stringify(source)}`);
                return;
            }
            const texture = yield loadTexture(this, resource);
            texture.flipY = false;
            if (textureDef.name)
                texture.name = textureDef.name;
            const samplers = this.gltf.samplers || [];
            const sampler = samplers[textureDef.sampler] || {};
            texture.magFilter =
                WEBGL_FILTERS[sampler.magFilter] || Three__namespace.LinearFilter;
            texture.minFilter =
                WEBGL_FILTERS[sampler.minFilter] || Three__namespace.LinearMipmapLinearFilter;
            texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS] || Three__namespace.RepeatWrapping;
            texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT] || Three__namespace.RepeatWrapping;
            this.associations.set(texture, { index: textureIndex });
            this.textureCache[cacheKey] = texture;
            return texture;
        });
    }
}
function loadTexture(parser, resource) {
    return __awaiter(this, void 0, void 0, function* () {
        const texture = new Three__namespace.DataTexture();
        texture.format = Three__namespace.RGBAFormat;
        if (parser.option.asyncTexture) {
            parser.pendingTextures.push({
                texture,
                resource,
            });
            return texture;
        }
        else {
            const imageInfo = yield doric.imageDecoder(parser.option.bridgeContext).getImageInfo(resource);
            const imagePixels = yield doric.imageDecoder(parser.option.bridgeContext).decodeToPixels(resource);
            texture.image = {
                data: new Uint8ClampedArray(imagePixels),
                width: imageInfo.width,
                height: imageInfo.height,
            };
            texture.needsUpdate = true;
            return texture;
        }
    });
}

exports.GLTFLoader = GLTFLoader;
exports.KTX2Loader = KTX2Loader;
exports.MapControls = MapControls;
exports.OrbitControls = OrbitControls;
exports.loadGLTF = loadGLTF;
//# sourceMappingURL=bundle_doric-three.js.map
