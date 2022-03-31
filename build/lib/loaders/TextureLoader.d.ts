import { Resource, BridgeContext } from "doric";
import { DataTexture } from "three";
export declare class TextureLoader {
    load(context: BridgeContext, resource: Resource): Promise<DataTexture>;
}
