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
  name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;
  // Object3D instance caches
  cache = { refs: {}, uses: {} };

  markRefs = () => {
    const nodeDefs = this.gltf.nodes || [];
    for (
      let nodeIndex = 0, nodeLength = nodeDefs.length;
      nodeIndex < nodeLength;
      nodeIndex++
    ) {
      const nodeDef = nodeDefs[nodeIndex];

      if (
        nodeDef.extensions &&
        nodeDef.extensions[this.name] &&
        nodeDef.extensions[this.name].light !== undefined
      ) {
        this.context._addNodeRef(
          this.cache,
          nodeDef.extensions[this.name].light
        );
      }
    }
  };
  async createNodeAttachment(index: number) {
    const lightIndex = this.gltf.nodes?.[index]?.extensions?.[this.name]?.light;
    if (lightIndex === undefined) return undefined;
    const cacheKey = "light:" + lightIndex;
    let dependency = this.context.getCache(cacheKey);
    if (dependency) {
      return dependency;
    }
    const lightDef = this.gltf.extensions?.[this.name]?.lights?.[lightIndex];
    const color = new Three.Color(0xffffff);
    if (lightDef.color !== undefined) color.fromArray(lightDef.color);

    const range = lightDef.range !== undefined ? lightDef.range : 0;
    let ret: Three.Light;
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
        throw new Error(
          "THREE.GLTFLoader: Unexpected light type: " + lightDef.type
        );
    }

    // Some lights (e.g. spot) default to a position other than the origin. Reset the position
    // here, because node-level parsing will only override position if explicitly specified.
    ret.position.set(0, 0, 0);

    if (lightDef.intensity !== undefined) ret.intensity = lightDef.intensity;

    ret.name = createUniqueName(lightDef.name || "light_" + lightIndex);
    dependency = Promise.resolve(ret);
    this.context.addCache(cacheKey, dependency);
    loge(`Create light`, ret.name);
    return dependency;
  }
}
