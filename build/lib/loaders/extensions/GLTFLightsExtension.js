var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AttachmentExtension, EXTENSIONS } from "./GLTFExtensions";
import * as Three from "three";
import { createUniqueName } from "../GLTFUtils";
import { loge } from "doric/lib/src/util/log";
/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
export class GLTFLightsExtension extends AttachmentExtension {
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
        return __awaiter(this, void 0, void 0, function* () {
            const lightIndex = (_d = (_c = (_b = (_a = this.gltf.nodes) === null || _a === void 0 ? void 0 : _a[index]) === null || _b === void 0 ? void 0 : _b.extensions) === null || _c === void 0 ? void 0 : _c[this.name]) === null || _d === void 0 ? void 0 : _d.light;
            if (lightIndex === undefined)
                return undefined;
            const cacheKey = "light:" + lightIndex;
            let dependency = this.context.getCache(cacheKey);
            if (dependency) {
                return dependency;
            }
            const lightDef = (_g = (_f = (_e = this.gltf.extensions) === null || _e === void 0 ? void 0 : _e[this.name]) === null || _f === void 0 ? void 0 : _f.lights) === null || _g === void 0 ? void 0 : _g[lightIndex];
            const color = new Three.Color(0xffffff);
            if (lightDef.color !== undefined)
                color.fromArray(lightDef.color);
            const range = lightDef.range !== undefined ? lightDef.range : 0;
            let ret;
            switch (lightDef.type) {
                case "directional":
                    {
                        const lightNode = new Three.DirectionalLight(color);
                        lightNode.target.position.set(0, 0, -1);
                        lightNode.add(lightNode.target);
                        ret = lightNode;
                    }
                    break;
                case "point":
                    {
                        const lightNode = new Three.PointLight(color);
                        lightNode.distance = range;
                        lightNode.decay = 2;
                        ret = lightNode;
                    }
                    break;
                case "spot":
                    {
                        const lightNode = new Three.SpotLight(color);
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
//# sourceMappingURL=GLTFLightsExtension.js.map