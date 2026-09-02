package com.trh.gamesportal;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // =================================================================
        // NATIVE URL INTERCEPTOR: FORCES THE GOOGLE NATIVE SHEET PROMPT
        // =================================================================
        // Catches the request before the web view loads it, leaving your main site untouched!
        this.bridge.getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && url.contains("provider=google") && !url.contains("native-auth")) {
                    view.loadUrl("https://fnfaw.es");
                    return true; // Blocks the web view from loading the standard web login
                }
                return false; // Allows all other standard site navigation to pass through normally
            }
        });

        // =================================================================
        // YOUR WORKING BLACK STATUS BAR PATIO CODE (UNTOUCHED)
        // =================================================================
        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(android.graphics.Color.TRANSPARENT);

        View decorView = window.getDecorView();
        int flags = decorView.getSystemUiVisibility();
        flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR; 
        decorView.setSystemUiVisibility(flags);
    }
}
