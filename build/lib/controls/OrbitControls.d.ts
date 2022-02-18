import { EventDispatcher } from 'three';
declare class OrbitControls extends EventDispatcher {
    constructor(object: any, domElement: any);
}
declare class MapControls extends OrbitControls {
    constructor(object: any, domElement: any);
}
export { OrbitControls, MapControls };
