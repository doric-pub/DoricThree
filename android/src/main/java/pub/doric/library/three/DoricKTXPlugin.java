package pub.doric.library.three;


import com.facebook.soloader.SoLoader;
import com.github.pengfeizhou.jscore.JSObject;
import com.github.pengfeizhou.jscore.JavaValue;

import java.nio.ByteBuffer;

import pub.doric.DoricContext;
import pub.doric.async.AsyncResult;
import pub.doric.extension.bridge.DoricMethod;
import pub.doric.extension.bridge.DoricPlugin;
import pub.doric.extension.bridge.DoricPromise;
import pub.doric.plugin.DoricJavaPlugin;
import pub.doric.resource.DoricArrayBufferResource;
import pub.doric.resource.DoricResource;
import pub.doric.utils.DoricLog;

/**
 * @Description: Decode KTX file
 * @Author: pengfei.zhou
 * @CreateDate: 2022/3/18
 */
@DoricPlugin(name = "ktx2")
public class DoricKTXPlugin extends DoricJavaPlugin {
    static {
        SoLoader.loadLibrary("doric_ktx");
    }

    public DoricKTXPlugin(DoricContext doricContext) {
        super(doricContext);
    }

    @DoricMethod
    public void decode(JSObject jsObject, final DoricPromise promise) {
        final JSObject resource = jsObject.getProperty("resource").asObject();
        final long extensionFlag = jsObject.getProperty("extensionFlag").asNumber().toLong();
        DoricResource doricResource = getDoricContext().getDriver().getRegistry().getResourceManager().load(
                getDoricContext(),
                resource);

        if (doricResource instanceof DoricArrayBufferResource) {
            ByteBuffer byteBuffer = ((DoricArrayBufferResource) doricResource).getValue().getByteBuffer();
            byte[] data = decodeKTX2(byteBuffer, extensionFlag);
            promise.resolve(new JavaValue(data));
        }
        if (doricResource != null) {
            doricResource.fetch().setCallback(new AsyncResult.Callback<byte[]>() {
                @Override
                public void onResult(byte[] rawData) {
                    ByteBuffer byteBuffer = ByteBuffer.allocateDirect(rawData.length);
                    byteBuffer.put(rawData);
                    byte[] data = decodeKTX2(byteBuffer, extensionFlag);
                    promise.resolve(new JavaValue(data));
                }

                @Override
                public void onError(Throwable t) {
                    t.printStackTrace();
                    DoricLog.e("Cannot load resource %s, %s", resource.toString(), t.getLocalizedMessage());
                    promise.reject(new JavaValue("Load error"));
                }

                @Override
                public void onFinish() {

                }
            });
        } else {
            DoricLog.e("Cannot find loader for resource %s", resource);
            promise.reject(new JavaValue("Load error"));
        }
    }

    public native byte[] decodeKTX2(ByteBuffer byteBuffer, long extensionFlag);
}
