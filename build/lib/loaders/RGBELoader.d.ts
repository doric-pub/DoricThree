import { BridgeContext, Resource } from "doric";
import { DataTexture } from "three";
export declare class RGBELoader {
    type: import("three").TextureDataType;
    load(context: BridgeContext, resource: Resource): Promise<DataTexture | undefined>;
}
