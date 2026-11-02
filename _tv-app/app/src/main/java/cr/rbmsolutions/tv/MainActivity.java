package cr.rbmsolutions.tv;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

/**
 * RBM TV: abre la página de inicio para televisor (rbmsolutionscr.com/tv/) y todas las demos.
 * Se maneja con el control remoto:
 *  - En las páginas de /tv/ (inicio y monitoreo) las flechas saltan de cuadro en cuadro.
 *  - En las demos aparece un puntero (flechita) que se mueve con las flechas; OK hace "clic".
 *  - Mantener OK (1 segundo) o el botón Menú cambia entre puntero y flechas.
 *  - Atrás vuelve a la página anterior y, al final, al inicio.
 */
public class MainActivity extends Activity {
    static final String INICIO = "https://rbmsolutionscr.com/tv/";
    static final String SIN_INTERNET = "file:///android_asset/sin-internet.html";

    WebView web;
    CursorView cursor;
    TextView aviso;
    boolean puntero = false;          // modo puntero activo
    boolean elegidoAMano = false;     // el usuario cambió el modo en esta página
    long okDesde = 0;                 // cuándo se apretó OK (para detectar "mantener")
    boolean okLargo = false;
    final Handler h = new Handler(Looper.getMainLooper());
    final Runnable ocultarAviso = () -> aviso.animate().alpha(0f).setDuration(400).start();
    final Runnable okMantenido = () -> { okLargo = true; cambiarModo(!puntero, true); };

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        FrameLayout raiz = new FrameLayout(this);
        raiz.setBackgroundColor(Color.parseColor("#060b18"));

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setUserAgentString(s.getUserAgentString() + " RBMTV/1.0");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String esq = u.getScheme() == null ? "" : u.getScheme();
                String host = u.getHost() == null ? "" : u.getHost();
                if (host.contains("wa.me") || host.contains("whatsapp") || esq.equals("tel") || esq.equals("mailto") || esq.equals("intent") || esq.equals("whatsapp")) {
                    mostrarAviso("Eso se abre en el celular: WhatsApp, llamadas y correo no están en el televisor");
                    return true;
                }
                return !(esq.equals("http") || esq.equals("https") || esq.equals("file"));
            }
            @Override
            public void onPageFinished(WebView v, String url) {
                if (!elegidoAMano) cambiarModo(!esPaginaTv(url), false);
            }
            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) v.loadUrl(SIN_INTERNET);
            }
        });
        // Las páginas de /tv/ pueden pedir el teclado de la pantalla (para escribir la contraseña)
        web.addJavascriptInterface(new Object() {
            @JavascriptInterface public void teclado() {
                runOnUiThread(() -> { web.requestFocus(); ((InputMethodManager) getSystemService(INPUT_METHOD_SERVICE)).showSoftInput(web, InputMethodManager.SHOW_FORCED); });
            }
        }, "RBMTV");
        raiz.addView(web, new FrameLayout.LayoutParams(-1, -1));

        cursor = new CursorView(this);
        cursor.setVisibility(View.GONE);
        raiz.addView(cursor, new FrameLayout.LayoutParams(-1, -1));

        aviso = new TextView(this);
        aviso.setTextColor(Color.WHITE);
        aviso.setTextSize(16);
        aviso.setPadding(36, 18, 36, 18);
        aviso.setBackgroundColor(Color.parseColor("#E60B1B4A"));
        aviso.setAlpha(0f);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
        lp.bottomMargin = 40;
        raiz.addView(aviso, lp);

        setContentView(raiz);
        if (b != null) web.restoreState(b); else web.loadUrl(INICIO);
    }

    @Override protected void onSaveInstanceState(Bundle b) { super.onSaveInstanceState(b); web.saveState(b); }
    @Override protected void onPause() { super.onPause(); web.onPause(); CookieManager.getInstance().flush(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); }

    static boolean esPaginaTv(String url) {
        return url == null || url.startsWith("file:") || url.contains("rbmsolutionscr.com/tv/") || url.endsWith("rbmsolutionscr.com/tv");
    }

    void cambiarModo(boolean p, boolean aMano) {
        if (aMano) elegidoAMano = true;
        if (puntero == p && !aMano) return;
        puntero = p;
        cursor.setVisibility(p ? View.VISIBLE : View.GONE);
        if (p && cursor.x < 0) cursor.centrar();
        if (aMano || p) mostrarAviso(p ? "Modo puntero: las flechas mueven la flechita y OK hace clic · mantené OK para cambiar"
                                       : "Modo flechas: las flechas saltan entre botones · mantené OK para cambiar");
    }

    void mostrarAviso(String t) {
        aviso.setText(t);
        aviso.animate().cancel();
        aviso.setAlpha(1f);
        h.removeCallbacks(ocultarAviso);
        h.postDelayed(ocultarAviso, 3500);
    }

    void clic(float x, float y) {
        long t = SystemClock.uptimeMillis();
        MotionEvent d = MotionEvent.obtain(t, t, MotionEvent.ACTION_DOWN, x, y, 0);
        d.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        web.dispatchTouchEvent(d);
        MotionEvent u = MotionEvent.obtain(t, t + 50, MotionEvent.ACTION_UP, x, y, 0);
        u.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        web.dispatchTouchEvent(u);
        d.recycle(); u.recycle();
        cursor.pulso();
    }

    void desplazar(int dx, int dy) {
        web.evaluateJavascript("(function(){var e=document.scrollingElement||document.body;var el=document.elementFromPoint(" + (int) (cursor.x / getResources().getDisplayMetrics().density) + "," + (int) (cursor.y / getResources().getDisplayMetrics().density) + ");"
                + "while(el&&el!==document.body){var cs=getComputedStyle(el);if((/(auto|scroll)/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight&&" + dy + "!==0)||(/(auto|scroll)/.test(cs.overflowX)&&el.scrollWidth>el.clientWidth&&" + dx + "!==0)){e=el;break;}el=el.parentElement;}"
                + "e.scrollBy({left:" + dx + ",top:" + dy + ",behavior:'smooth'});})()", null);
    }

    void atras() {
        String url = web.getUrl();
        if (web.canGoBack()) { web.goBack(); return; }
        if (url != null && !url.startsWith(INICIO)) { elegidoAMano = false; web.loadUrl(INICIO); return; }
        finish();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int k = e.getKeyCode();
        boolean abajo = e.getAction() == KeyEvent.ACTION_DOWN;

        if (k == KeyEvent.KEYCODE_BACK) { if (abajo && e.getRepeatCount() == 0) atras(); return true; }
        if (k == KeyEvent.KEYCODE_MENU) { if (abajo && e.getRepeatCount() == 0) cambiarModo(!puntero, true); return true; }

        boolean ok = k == KeyEvent.KEYCODE_DPAD_CENTER || k == KeyEvent.KEYCODE_ENTER || k == KeyEvent.KEYCODE_NUMPAD_ENTER;
        if (ok && !teclado()) {
            if (abajo) {
                if (e.getRepeatCount() == 0) { okLargo = false; okDesde = SystemClock.uptimeMillis(); h.postDelayed(okMantenido, 900); }
                return true;
            }
            h.removeCallbacks(okMantenido);
            if (okLargo) return true;
            if (puntero) clic(cursor.x, cursor.y);
            else {   // en modo flechas OK le llega a la página como Enter
                long t = SystemClock.uptimeMillis();
                web.dispatchKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER, 0));
                web.dispatchKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER, 0));
            }
            return true;
        }

        if (puntero && !teclado()) {
            int dx = 0, dy = 0;
            if (k == KeyEvent.KEYCODE_DPAD_LEFT) dx = -1;
            else if (k == KeyEvent.KEYCODE_DPAD_RIGHT) dx = 1;
            else if (k == KeyEvent.KEYCODE_DPAD_UP) dy = -1;
            else if (k == KeyEvent.KEYCODE_DPAD_DOWN) dy = 1;
            if (dx != 0 || dy != 0) {
                if (abajo) {
                    float d = getResources().getDisplayMetrics().density;
                    float paso = (9 + Math.min(e.getRepeatCount() * 3, 36)) * d;
                    int borde = (int) (40 * d);
                    float nx = cursor.x + dx * paso, ny = cursor.y + dy * paso;
                    int w = cursor.getWidth(), hh = cursor.getHeight();
                    if (ny < borde && dy < 0) desplazar(0, -220);
                    if (ny > hh - borde && dy > 0) desplazar(0, 220);
                    if (nx < borde && dx < 0) desplazar(-220, 0);
                    if (nx > w - borde && dx > 0) desplazar(220, 0);
                    cursor.mover(Math.max(2, Math.min(w - 2, nx)), Math.max(2, Math.min(hh - 2, ny)));
                }
                return true;
            }
        }
        return super.dispatchKeyEvent(e);
    }

    /** Si el teclado de la pantalla está escribiendo en un campo, las teclas son para el campo. */
    boolean teclado() {
        return false;
    }
}
