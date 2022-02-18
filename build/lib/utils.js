import { log, loge, logw, Resource } from "doric";
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
//# sourceMappingURL=utils.js.map