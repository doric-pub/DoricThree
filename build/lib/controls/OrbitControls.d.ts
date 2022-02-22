import { EventDispatcher, Matrix4, MOUSE, OrthographicCamera, PerspectiveCamera, Spherical, TOUCH, Vector2, Vector3 } from "three";
declare enum STATE {
    NONE = -1,
    ROTATE = 0,
    DOLLY = 1,
    PAN = 2,
    TOUCH_ROTATE = 3,
    TOUCH_PAN = 4,
    TOUCH_DOLLY_PAN = 5,
    TOUCH_DOLLY_ROTATE = 6
}
export declare class OrbitControls extends EventDispatcher {
    object: OrthographicCamera | PerspectiveCamera;
    domElement: HTMLElement;
    enabled: boolean;
    target: Vector3;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    keys: {
        LEFT: string;
        UP: string;
        RIGHT: string;
        BOTTOM: string;
    };
    mouseButtons: {
        LEFT: MOUSE;
        MIDDLE: MOUSE;
        RIGHT: MOUSE;
    };
    touches: {
        ONE: TOUCH;
        TWO: TOUCH;
    };
    target0: Vector3;
    position0: Vector3;
    zoom0: number;
    _domElementKeyEvents: any;
    spherical: Spherical;
    sphericalDelta: Spherical;
    scale: number;
    panOffset: Vector3;
    zoomChanged: boolean;
    rotateStart: Vector2;
    rotateEnd: Vector2;
    rotateDelta: Vector2;
    panStart: Vector2;
    panEnd: Vector2;
    panDelta: Vector2;
    dollyStart: Vector2;
    dollyEnd: Vector2;
    dollyDelta: Vector2;
    pointers: PointerEvent[];
    pointerPositions: Record<number, Vector2>;
    state: STATE;
    update: () => boolean;
    constructor(object: OrthographicCamera | PerspectiveCamera, domElement: HTMLElement);
    getPolarAngle(): number;
    getAzimuthalAngle(): number;
    getDistance(): number;
    listenToKeyEvents(domElement: HTMLElement): void;
    saveState(): void;
    reset(): void;
    dispose(): void;
    getAutoRotationAngle(): number;
    getZoomScale(): number;
    rotateLeft(angle: number): void;
    rotateUp(angle: number): void;
    panLeft: (distance: number, objectMatrix: Matrix4) => void;
    panUp: (distance: number, objectMatrix: Matrix4) => void;
    pan: (deltaX: number, deltaY: number) => void;
    dollyOut(dollyScale: number): void;
    dollyIn(dollyScale: number): void;
    handleMouseDownRotate(event: MouseEvent): void;
    handleMouseDownDolly(event: MouseEvent): void;
    handleMouseDownPan(event: MouseEvent): void;
    handleMouseMoveRotate(event: MouseEvent): void;
    handleMouseMoveDolly(event: MouseEvent): void;
    handleMouseMovePan(event: MouseEvent): void;
    handleMouseUp(event: MouseEvent): void;
    handleMouseWheel(event: WheelEvent): void;
    handleKeyDown(event: KeyboardEvent): void;
    handleTouchStartRotate(): void;
    handleTouchStartPan(): void;
    handleTouchStartDolly(): void;
    handleTouchStartDollyPan(): void;
    handleTouchStartDollyRotate(): void;
    handleTouchMoveRotate(event: PointerEvent): void;
    handleTouchMovePan(event: PointerEvent): void;
    handleTouchMoveDolly(event: PointerEvent): void;
    handleTouchMoveDollyPan(event: PointerEvent): void;
    handleTouchMoveDollyRotate(event: PointerEvent): void;
    handleTouchEnd(): void;
    onPointerDown(event: PointerEvent): void;
    onPointerMove(event: PointerEvent): void;
    onPointerUp(event: PointerEvent): void;
    onPointerCancel(event: PointerEvent): void;
    onMouseDown(event: MouseEvent): void;
    onMouseMove(event: MouseEvent): void;
    onMouseUp(event: MouseEvent): void;
    onMouseWheel(event: WheelEvent): void;
    onKeyDown(event: KeyboardEvent): void;
    onTouchStart(event: PointerEvent): void;
    onTouchMove(event: PointerEvent): void;
    onTouchEnd(): void;
    onContextMenu(event: MouseEvent): void;
    addPointer(event: PointerEvent): void;
    removePointer(event: PointerEvent): void;
    trackPointer(event: PointerEvent): void;
    getSecondPointerPosition(event: PointerEvent): Vector2;
}
export declare class MapControls extends OrbitControls {
    constructor(object: OrthographicCamera | PerspectiveCamera, domElement: HTMLElement);
}
export {};
