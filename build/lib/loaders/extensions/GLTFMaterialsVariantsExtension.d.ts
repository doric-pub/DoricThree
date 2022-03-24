import { GLTFExtension } from "./GLTFExtensions";
export declare class GLTFMaterialsVariantsExtension extends GLTFExtension {
    name: string;
    variants: {
        name: string;
    }[];
    variantCallback: Array<(variantIndex: number) => Promise<void>>;
    markRefs: () => void;
    changeVariant(index: number): Promise<void>;
}
