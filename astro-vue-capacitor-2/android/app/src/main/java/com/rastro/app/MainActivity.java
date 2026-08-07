package com.rastro.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Android 15+ (targetSdk 35+) enforces edge-to-edge, so the WebView draws
        // behind the status and navigation bars and our bottom tab bar ends up
        // underneath the system nav. Opt back into fitting the system windows so
        // the bars reserve their space and content never underlaps them.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
