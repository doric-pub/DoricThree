import { Resource, resourceLoader } from "doric";
import { Cache, Loader } from "three";
import { UnifiedResource } from "../utils";
const loading = {};
export class FileLoader extends Loader {
    constructor(context, manager) {
        super(manager);
        this.responseType = "";
        this.mimeType = "";
        this.context = context;
    }
    load(res, onLoad, onProgress, onError) {
        let url = res instanceof Resource ? res.identifier : res.url;
        if (url === undefined)
            url = "";
        if (this.path !== undefined)
            url = this.path + url;
        url = this.manager.resolveURL(url);
        const cached = Cache.get(url);
        if (cached !== undefined) {
            this.manager.itemStart(url);
            setTimeout(() => {
                if (onLoad)
                    onLoad(cached);
                this.manager.itemEnd(url);
            }, 0);
            return cached;
        }
        // Check if request is duplicate
        if (loading[url] !== undefined) {
            loading[url].push({
                onLoad: onLoad,
                onProgress: onProgress,
                onError: onError,
            });
            return;
        }
        // Initialise array for duplicate requests
        loading[url] = [];
        loading[url].push({
            onLoad: onLoad,
            onProgress: onProgress,
            onError: onError,
        });
        // start the fetch
        let loadingResource;
        if (res instanceof Resource) {
            loadingResource = res;
        }
        else {
            loadingResource = new UnifiedResource(res.type, url);
        }
        resourceLoader(this.context)
            .load(loadingResource)
            .then((data) => {
            // Add to cache only on HTTP success, so that we do not cache
            // error response bodies as proper responses to requests.
            Cache.add(url, data);
            const callbacks = loading[url];
            delete loading[url];
            for (let i = 0, il = callbacks.length; i < il; i++) {
                const callback = callbacks[i];
                if (callback.onLoad)
                    callback.onLoad(data);
            }
            this.manager.itemEnd(url);
        })
            .catch((reason) => {
            // Abort errors and other errors are handled the same
            const callbacks = loading[url];
            delete loading[url];
            for (let i = 0, il = callbacks.length; i < il; i++) {
                const callback = callbacks[i];
                if (callback.onError)
                    callback.onError(reason);
            }
            this.manager.itemError(url);
            this.manager.itemEnd(url);
        });
        this.manager.itemStart(url);
    }
    setResponseType(value) {
        this.responseType = value;
        return this;
    }
    setMimeType(value) {
        this.mimeType = value;
        return this;
    }
}
//# sourceMappingURL=FileLoader.js.map