package com.cleanframe.tv;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.media.tv.TvContract;
import android.media.tv.TvInputInfo;
import android.media.tv.TvInputManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** A lightweight Android TV home screen. The UI is a local web page (assets/web). */
public class MainActivity extends Activity {

    private static final String START = "file:///android_asset/web/index.html";
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true); // chrome://inspect on the Mac
        }
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true); // lets the local page fetch the weather
        s.setTextZoom(100);
        s.setUseWideViewPort(true);        // honour <meta viewport width=1920>
        s.setLoadWithOverviewMode(true);   // ...and zoom that 1920px page to fit the TV
        s.setSupportZoom(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                return !r.getUrl().toString().startsWith("file:///android_asset/");
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                return !url.startsWith("file:///android_asset/");
            }
        });
        web.addJavascriptInterface(new Bridge(), "TV");
        setContentView(web);
        hideSystemUi();
        web.loadUrl(START);
        web.requestFocus();
    }

    private void js(String code) {
        if (web != null) web.evaluateJavascript(code, null);
    }

    /** Remote Back -> Escape for the page; Back never closes the home screen. */
    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        if (e.getKeyCode() == KeyEvent.KEYCODE_BACK && web != null) {
            web.dispatchKeyEvent(new KeyEvent(e.getDownTime(), e.getEventTime(), e.getAction(),
                    KeyEvent.KEYCODE_ESCAPE, e.getRepeatCount(), e.getMetaState()));
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    @Override
    public void onBackPressed() { }

    /** Home pressed while already on the home screen: jump back to the start of the row. */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        js("window.homeReset && homeReset()");
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUi();
        if (web != null) {
            web.onResume();
            web.requestFocus();
            js("window.homeResume && homeResume()");
        }
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @SuppressWarnings("deprecation")
    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    /** Starts an activity on the UI thread (bridge calls arrive on a background thread). */
    private boolean start(final Intent i) {
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        if (i.resolveActivity(getPackageManager()) == null) return false;
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    android.util.Log.i("HomeTV", "Starting " + i);
                    startActivity(i);
                } catch (ActivityNotFoundException | SecurityException ex) {
                    android.util.Log.e("HomeTV", "Couldn't start " + i, ex);
                }
            }
        });
        return true;
    }

    private boolean launchPackage(String pkg) {
        PackageManager pm = getPackageManager();
        Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (i == null) i = pm.getLaunchIntentForPackage(pkg);
        return i != null && start(i);
    }

    private static String saveDrawable(Drawable d, File f, int w, int h) throws Exception {
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        d.setBounds(0, 0, w, h);
        d.draw(new Canvas(b));
        FileOutputStream os = new FileOutputStream(f);
        try { b.compress(Bitmap.CompressFormat.PNG, 100, os); } finally { os.close(); b.recycle(); }
        return "file://" + f.getAbsolutePath();
    }

    /** window.TV.* in the page */
    private class Bridge {

        @JavascriptInterface
        public boolean launch(String pkg) { return launchPackage(pkg); }

        @JavascriptInterface
        public boolean openSettings() { return start(new Intent(Settings.ACTION_SETTINGS)); }

        @JavascriptInterface
        public boolean openWifi() {
            return start(new Intent(Settings.ACTION_WIFI_SETTINGS)) || start(new Intent(Settings.ACTION_SETTINGS));
        }

        @JavascriptInterface
        public boolean appInfo(String pkg) {
            return start(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg)));
        }

        /** Installed apps: [{appId, name, banner, icon}] (banner/icon are file:// PNGs or "") */
        @JavascriptInterface
        public String apps() {
            PackageManager pm = getPackageManager();
            Map<String, ResolveInfo> found = new LinkedHashMap<>();
            java.util.Set<String> tvApps = new java.util.HashSet<>();
            String[] cats = { Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER };
            for (String cat : cats) {
                for (ResolveInfo ri : pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(cat), 0)) {
                    String pkg = ri.activityInfo.packageName;
                    if (cat.equals(Intent.CATEGORY_LEANBACK_LAUNCHER)) tvApps.add(pkg);
                    if (!pkg.equals(getPackageName()) && !found.containsKey(pkg)) found.put(pkg, ri);
                }
            }
            File dir = new File(getCacheDir(), "art");
            if (!dir.isDirectory()) dir.mkdirs();
            JSONArray out = new JSONArray();
            for (Map.Entry<String, ResolveInfo> e : found.entrySet()) {
                try {
                    String pkg = e.getKey();
                    ResolveInfo ri = e.getValue();
                    long updated = pm.getPackageInfo(pkg, 0).lastUpdateTime;
                    JSONObject o = new JSONObject();
                    o.put("appId", pkg);
                    o.put("name", String.valueOf(ri.loadLabel(pm)));
                    o.put("tv", tvApps.contains(pkg));

                    String banner = "";
                    File bf = new File(dir, pkg + ".banner.png");
                    File none = new File(dir, pkg + ".nobanner");
                    if (bf.isFile() && bf.lastModified() >= updated) {
                        banner = "file://" + bf.getAbsolutePath();
                    } else if (!(none.isFile() && none.lastModified() >= updated)) {
                        Drawable d = ri.activityInfo.loadBanner(pm);
                        if (d == null) d = ri.activityInfo.applicationInfo.loadBanner(pm);
                        if (d != null) banner = saveDrawable(d, bf, 480, 270);
                        else new FileOutputStream(none).close();
                    }
                    o.put("banner", banner);

                    File icf = new File(dir, pkg + ".icon.png");
                    String icon = (icf.isFile() && icf.lastModified() >= updated)
                            ? "file://" + icf.getAbsolutePath()
                            : saveDrawable(ri.activityInfo.loadIcon(pm), icf, 192, 192);
                    o.put("icon", icon);
                    out.put(o);
                } catch (Exception ignored) { }
            }
            return out.toString();
        }

        /** TV inputs (HDMI etc.): [{id, label, type}] */
        @JavascriptInterface
        public String inputs() {
            JSONArray out = new JSONArray();
            try {
                TvInputManager tim = (TvInputManager) getSystemService(Context.TV_INPUT_SERVICE);
                if (tim == null) return "[]";
                List<TvInputInfo> list = tim.getTvInputList();
                for (TvInputInfo info : list) {
                    if (info.getParentId() != null) continue; // skip HDMI-CEC child devices
                    if (Build.VERSION.SDK_INT >= 23 && info.isHidden(MainActivity.this)) continue;
                    JSONObject o = new JSONObject();
                    o.put("id", info.getId());
                    o.put("label", String.valueOf(info.loadLabel(MainActivity.this)));
                    o.put("type", info.getType());
                    o.put("passthrough", info.isPassthroughInput());
                    out.put(o);
                }
            } catch (Exception ignored) { }
            return out.toString();
        }

        @JavascriptInterface
        public boolean openInput(String id) {
            try {
                TvInputManager tim = (TvInputManager) getSystemService(Context.TV_INPUT_SERVICE);
                TvInputInfo info = tim == null ? null : tim.getTvInputInfo(id);
                Uri uri = info != null && info.isPassthroughInput()
                        ? TvContract.buildChannelUriForPassthroughInput(id)
                        : TvContract.buildChannelsUriForInput(id);
                if (start(new Intent(Intent.ACTION_VIEW, uri))) return true;
            } catch (Exception ignored) { }
            return openLiveTv();
        }

        /** Fallback: open the TV's own input/Live TV app. */
        @JavascriptInterface
        public boolean openLiveTv() {
            String[] apps = { "com.mediatek.wwtv.tvcenter", "com.google.android.tv", "com.android.tv" };
            for (String p : apps) if (launchPackage(p)) return true;
            return false;
        }
    }
}
