package pub.doric.library;

import com.github.pengfeizhou.jscore.JSExecutor;
import com.github.pengfeizhou.jscore.JSIRuntime;
import com.github.pengfeizhou.jscore.JSValue;

import java.lang.reflect.Field;

import pub.doric.DoricContext;
import pub.doric.DoricNativeDriver;
import pub.doric.DoricSingleton;
import pub.doric.dangle.Dangle;
import pub.doric.dangle.GLView;
import pub.doric.engine.DoricJSEngine;
import pub.doric.engine.DoricNativeJSExecutor;
import pub.doric.extension.bridge.DoricPlugin;
import pub.doric.shader.ViewNode;

/**
 * @Description: ViewNode for GLTF file
 * @Author: pengfei.zhou
 * @CreateDate: 2022/2/15
 */

@DoricPlugin(name = "GLTF")
public class DoricGLTFNode extends ViewNode<GLView> {

    private String onPrepared;

    public DoricGLTFNode(DoricContext doricContext) {
        super(doricContext);
        try {
            Field field = JSIRuntime.class.getDeclaredField("jsiPtr");
            field.setAccessible(true);
            long jsiPtr = field.getLong(JSIRuntime.class);
            if (jsiPtr == 0L) {
                DoricNativeDriver doricNativeDriver = DoricSingleton.getInstance().getNativeDriver();
                DoricJSEngine doricJSEngine = doricNativeDriver.getDoricJSEngine();
                assert doricJSEngine != null;
                Dangle.getInstance().setJSHandler(doricJSEngine.getJSHandler());

                DoricNativeJSExecutor doricNativeJSExecutor = (DoricNativeJSExecutor) doricJSEngine.getDoricJSE();
                assert doricNativeJSExecutor != null;
                JSExecutor jsExecutor = doricNativeJSExecutor.getJSExecutor();
                assert jsExecutor != null;
                Field ptrField = jsExecutor.getClass().getDeclaredField("ptr");
                ptrField.setAccessible(true);
                long ptr = ptrField.getLong(jsExecutor);
                JSIRuntime.create(ptr);
            }
        } catch (NoSuchFieldException | IllegalAccessException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void blend(GLView view, String name, JSValue prop) {
        if ("onPrepared".equals(name)) {
            if (prop.isString()) {
                onPrepared = prop.asString().value();
            } else {
                onPrepared = null;
            }
        } else {
            super.blend(view, name, prop);
        }
    }

    @Override
    protected GLView build() {
        final GLView glView = new GLView(getContext());
        glView.setOnSurfaceAvailable(new GLView.OnSurfaceAvailable() {
            @Override
            public void invoke() {
                if (onPrepared != null) {
                    callJSResponse(onPrepared, glView.getDangleCtxId());
                }
            }
        });
        return glView;
    }
}
