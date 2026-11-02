package cr.rbmsolutions.tv;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.view.View;

/** La flechita del modo puntero. No recibe toques: solo se dibuja encima de la página. */
public class CursorView extends View {
    float x = -1, y = -1, anillo = 0;
    final Paint relleno = new Paint(Paint.ANTI_ALIAS_FLAG), borde = new Paint(Paint.ANTI_ALIAS_FLAG), onda = new Paint(Paint.ANTI_ALIAS_FLAG);
    final Path flecha = new Path();
    final float d;

    public CursorView(Context c) {
        super(c);
        d = c.getResources().getDisplayMetrics().density;
        relleno.setColor(Color.WHITE);
        relleno.setShadowLayer(6 * d, 0, 2 * d, Color.argb(160, 0, 0, 0));
        borde.setColor(Color.parseColor("#1d4ed8"));
        borde.setStyle(Paint.Style.STROKE);
        borde.setStrokeWidth(2 * d);
        onda.setColor(Color.parseColor("#60a5fa"));
        onda.setStyle(Paint.Style.STROKE);
        onda.setStrokeWidth(3 * d);
        setLayerType(LAYER_TYPE_SOFTWARE, null);
        setClickable(false);
        setFocusable(false);
    }

    void centrar() { x = getWidth() > 0 ? getWidth() / 2f : 400; y = getHeight() > 0 ? getHeight() / 2f : 300; invalidate(); }
    void mover(float nx, float ny) { x = nx; y = ny; invalidate(); }
    void pulso() { anillo = 1; invalidate(); }

    @Override
    protected void onSizeChanged(int w, int h, int ow, int oh) { if (x < 0 || x > w || y > h) centrar(); }

    @Override
    protected void onDraw(Canvas c) {
        if (x < 0) return;
        if (anillo > 0) {
            onda.setAlpha((int) (255 * anillo));
            c.drawCircle(x, y, (1 - anillo) * 26 * d + 6 * d, onda);
            anillo -= 0.08f;
            postInvalidateOnAnimation();
        }
        float s = d * 1.25f;
        flecha.reset();
        flecha.moveTo(x, y);
        flecha.lineTo(x, y + 22 * s);
        flecha.lineTo(x + 6 * s, y + 16.5f * s);
        flecha.lineTo(x + 10 * s, y + 25 * s);
        flecha.lineTo(x + 14 * s, y + 23 * s);
        flecha.lineTo(x + 10 * s, y + 15 * s);
        flecha.lineTo(x + 17 * s, y + 15 * s);
        flecha.close();
        c.drawPath(flecha, relleno);
        c.drawPath(flecha, borde);
    }
}
