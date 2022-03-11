import { GestureContainer, Ref } from "doric";
import { DangleView, DangleWebGLRenderingContext } from "dangle";
import THREE from "three";
export declare class ThreeView extends DangleView {
    onInited?: (renderer: THREE.WebGLRenderer) => void;
    touchable: boolean;
    gl?: DangleWebGLRenderingContext;
    gestureRef?: Ref<GestureContainer>;
    transparentBackground: boolean;
    isDirty(): boolean;
    private eventListeners;
    private addEventListener;
    private _gestureContainer?;
    constructor();
    private bindTouchingEvents;
    set gesture(v: GestureContainer);
    get gesture(): GestureContainer;
}
