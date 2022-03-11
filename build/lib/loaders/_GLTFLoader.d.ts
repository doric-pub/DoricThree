import { Resource, BridgeContext } from "doric";
import { LoadingManager, AnimationClip, BufferAttribute, Group, InterleavedBufferAttribute, Line, LineLoop, LineSegments, Loader, Mesh, MeshStandardMaterial, OrthographicCamera, PerspectiveCamera, Points, SkinnedMesh } from "three";
export declare type GLTF = {
    scene: THREE.Scene;
    scenes: THREE.Scene[];
    animations: THREE.AnimationClip[];
    cameras: THREE.Camera[];
    asset?: {
        version: [number];
    };
    parser: GLTFParser;
    userData: {};
};
export declare function loadGLTF(context: BridgeContext, resource: Resource): Promise<GLTF>;
export declare class GLTFLoader extends Loader {
    doricContext: BridgeContext;
    constructor(doricContext: BridgeContext, manager?: LoadingManager);
    load(resource: Resource, onLoad: (gltf: GLTF) => void, onProgress: any, onError: (error: Error) => void): void;
    setDRACOLoader(dracoLoader: any): this;
    setDDSLoader(): void;
    setKTX2Loader(ktx2Loader: any): this;
    setMeshoptDecoder(meshoptDecoder: any): this;
    register(callback: any): this;
    unregister(callback: any): this;
    parse(data: any, resType: any, path: any, onLoad: any, onError: any): void;
    parseAsync(data: any, path: any): Promise<unknown>;
}
declare class GLTFParser {
    doricContext: BridgeContext;
    constructor(doricContext: any, json?: {}, options?: {});
    setExtensions(extensions: any): void;
    setPlugins(plugins: any): void;
    parse(onLoad: any, onError: any): void;
    /**
     * Marks the special nodes/meshes in json for efficient parse.
     */
    _markDefs(): void;
    /**
     * Counts references to shared node / Object3D resources. These resources
     * can be reused, or "instantiated", at multiple nodes in the scene
     * hierarchy. Mesh, Camera, and Light instances are instantiated and must
     * be marked. Non-scenegraph resources (like Materials, Geometries, and
     * Textures) can be reused directly and are not marked here.
     *
     * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
     */
    _addNodeRef(cache: any, index: any): void;
    /** Returns a reference to a shared resource, cloning it if necessary. */
    _getNodeRef(cache: any, index: any, object: any): any;
    _invokeOne(func: any): any;
    _invokeAll(func: any): any[];
    /**
     * Requests the specified dependency asynchronously, with caching.
     * @param {string} type
     * @param {number} index
     * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
     */
    getDependency(type: any, index: any): any;
    /**
     * Requests all dependencies of the specified type asynchronously, with caching.
     * @param {string} type
     * @return {Promise<Array<Object>>}
     */
    getDependencies(type: any): any;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     * @param {number} bufferIndex
     * @return {Promise<ArrayBuffer>}
     */
    loadBuffer(bufferIndex: any): Promise<unknown>;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     * @param {number} bufferViewIndex
     * @return {Promise<ArrayBuffer>}
     */
    loadBufferView(bufferViewIndex: any): any;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
     * @param {number} accessorIndex
     * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
     */
    loadAccessor(accessorIndex: any): Promise<BufferAttribute | InterleavedBufferAttribute> | Promise<null>;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
     * @param {number} textureIndex
     * @return {Promise<THREE.Texture>}
     */
    loadTexture(textureIndex: any): any;
    loadTextureImage(textureIndex: any, source: any, loader: any): any;
    /**
     * Asynchronously assigns a texture to the given material parameters.
     * @param {Object} materialParams
     * @param {string} mapName
     * @param {Object} mapDef
     * @return {Promise<Texture>}
     */
    assignTexture(materialParams: any, mapName: any, mapDef: any): any;
    /**
     * Assigns final material to a Mesh, Line, or Points instance. The instance
     * already has a material (generated from the glTF material options alone)
     * but reuse of the same glTF material may require multiple threejs materials
     * to accommodate different primitive types, defines, etc. New materials will
     * be created if necessary, and reused from a cache.
     * @param  {Object3D} mesh Mesh, Line, or Points instance.
     */
    assignFinalMaterial(mesh: any): void;
    getMaterialType(): typeof MeshStandardMaterial;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
     * @param {number} materialIndex
     * @return {Promise<Material>}
     */
    loadMaterial(materialIndex: any): Promise<any>;
    /** When Object3D instances are targeted by animation, they need unique names. */
    createUniqueName(originalName: any): string;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
     *
     * Creates BufferGeometries from primitives.
     *
     * @param {Array<GLTF.Primitive>} primitives
     * @return {Promise<Array<BufferGeometry>>}
     */
    loadGeometries(primitives: any): Promise<any[]>;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
     * @param {number} meshIndex
     * @return {Promise<Group|Mesh|SkinnedMesh>}
     */
    loadMesh(meshIndex: any): Promise<Group | Points<any, any> | Line<any, any> | Mesh<any, any> | SkinnedMesh<any, any> | LineSegments<any, any> | LineLoop<any, any>>;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
     * @param {number} cameraIndex
     * @return {Promise<THREE.Camera>}
     */
    loadCamera(cameraIndex: any): Promise<OrthographicCamera | PerspectiveCamera | undefined> | undefined;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
     * @param {number} skinIndex
     * @return {Promise<Object>}
     */
    loadSkin(skinIndex: any): any;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
     * @param {number} animationIndex
     * @return {Promise<AnimationClip>}
     */
    loadAnimation(animationIndex: any): Promise<AnimationClip>;
    createNodeMesh(nodeIndex: any): any;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
     * @param {number} nodeIndex
     * @return {Promise<Object3D>}
     */
    loadNode(nodeIndex: any): Promise<any>;
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
     * @param {number} sceneIndex
     * @return {Promise<Group>}
     */
    loadScene(sceneIndex: any): Promise<Group>;
}
export {};
