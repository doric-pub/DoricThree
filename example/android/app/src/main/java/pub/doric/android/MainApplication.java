package pub.doric.android;

import android.app.Application;

import pub.doric.Doric;
import pub.doric.library.DangleLibrary;
import pub.doric.library.DoricGLTFPlayerLibrary;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        Doric.init(this);
        Doric.registerLibrary(new DangleLibrary());
        Doric.registerLibrary(new DoricGLTFPlayerLibrary());
    }
}
