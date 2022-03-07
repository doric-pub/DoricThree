import { log, loge, logw, Resource, uniqueId } from "doric";
export const console = {
    error: (...args) => {
        loge(args);
    },
    warn: (...args) => {
        logw(args);
    },
    log: (...args) => {
        log(args);
    },
};
export class UnifiedResource extends Resource {
    constructor(type, identifier) {
        if (identifier.startsWith("./")) {
            identifier = identifier.replace("./", "");
        }
        else if (identifier.startsWith("data:")) {
            type = "base64";
        }
        super(type, identifier);
    }
}
export class ArrayBufferResource extends Resource {
    constructor(data) {
        super("arrayBuffer", uniqueId("buffer"));
        this.data = data;
    }
    toModel() {
        const ret = super.toModel();
        ret.data = this.data;
        return ret;
    }
}
//# sourceMappingURL=utils.js.map