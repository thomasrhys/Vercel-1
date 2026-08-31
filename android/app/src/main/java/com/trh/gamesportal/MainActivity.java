package com.trh.gamesportal;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Target the physical system window controls
        Window window = getWindow();
        
        // 2. Clear out any default white translucent or auto-theming status constraints safely
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        // 3. Force the physical bar background canvas array to pure-black #000000
        window.setStatusBarColor(0xFF000000);

        // 4. Force status icons (Clock, Battery, Wi-Fi) to turn bright white
        View decorView = window.getDecorView();
        int flags = decorView.getSystemUiVisibility();
        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR; // Removes light bar mode to force white text/icons
        decorView.setSystemUiVisibility(flags);
    }
}
