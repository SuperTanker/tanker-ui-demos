package io.tanker.notepad;

import android.app.Activity;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Toast;

import io.tanker.notepad.session.ApiClient;
import io.tanker.notepad.session.Session;

public class BaseActivity extends AppCompatActivity {
    protected ApiClient mApiClient;
    protected Session mSession;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mSession = Session.getInstance(getApplicationContext());
        // Temp hack before we move everything into the session:
        mApiClient = mSession.getApiClient();
    }

    protected void showToast(String message) {
        runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_LONG).show());
    }

    protected void hideKeyboard() {
        View view = getCurrentFocus();
        InputMethodManager inputMethodManager = (InputMethodManager) getSystemService(Activity.INPUT_METHOD_SERVICE);
        inputMethodManager.hideSoftInputFromWindow(view.getWindowToken(), 0);
    }
}
