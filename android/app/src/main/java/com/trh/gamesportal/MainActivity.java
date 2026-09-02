package com.trh.gamesportal;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
// ADDED FOR GOOGLE POP-UP: Imports the native authentication plugin layer class
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // =================================================================
        // GOOGLE NATIVE AUTHENTICATION PLUG INITIALIZATION
        // =================================================================
        registerPlugin(GoogleAuth.class);

        // =================================================================
        // KEEPING YOUR CUSTOM BLACK STATUS BAR PATCHES INTACT
        // =================================================================
        // 1. Grab full manual control of the physical app layout window
        Window window = getWindow();
        
        // 2. Clear out legacy translucent overlays to let our colors track cleanly
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        // 3. Keep the background area behind the icons clean and transparent
        window.setStatusBarColor(android.graphics.Color.TRANSPARENT);

        // 4. FORCE SYSTEM BAR ICONS TO TURN BLACK
        View decorView = window.getDecorView();
        int flags = decorView.getSystemUiVisibility();
        
        // This specific bit flag forces the clock, battery, and Wi-Fi icons to go deep black
        flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR; 
        
        decorView.setSystemUiVisibility(flags);
    }
}
