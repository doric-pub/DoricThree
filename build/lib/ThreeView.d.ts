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
    eventListeners: Record<string, (event: Event) => void>;
    private addEventListener;
    constructor();
    set gesture(v: GestureContainer);
}
