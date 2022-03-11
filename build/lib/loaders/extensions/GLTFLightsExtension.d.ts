import { AttachmentExtension } from "./GLTFExtensions";
/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
export declare class GLTFLightsExtension extends AttachmentExtension {
    name: string;
    cache: {
        refs: {};
        uses: {};
    };
    markRefs: () => void;
    createNodeAttachment(index: number): Promise<any>;
}
