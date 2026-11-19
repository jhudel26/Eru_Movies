package com.eru.cinema.ui.player

import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.ActivityInfo
import android.graphics.Bitmap
import android.os.Build
import android.os.Message
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.*
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.eru.cinema.data.api.VidyEngine
import com.eru.cinema.data.model.MediaItem
import kotlinx.coroutines.delay

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun PlayerView(
    item: MediaItem,
    season: Int = 1,
    episode: Int = 1,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var showBackArrow by remember { mutableStateOf(true) }
    var customView by remember { mutableStateOf<View?>(null) }
    var customViewCallback by remember { mutableStateOf<WebChromeClient.CustomViewCallback?>(null) }

    // Lock screen orientation to Landscape and enable Immersive Fullscreen (Edge-to-Edge)
    DisposableEffect(Unit) {
        val originalOrientation = activity?.requestedOrientation ?: ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE

        val window = activity?.window
        if (window != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                window.attributes.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }

            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

            WindowCompat.setDecorFitsSystemWindows(window, false)
            val controller = WindowCompat.getInsetsController(window, window.decorView)
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            controller.hide(WindowInsetsCompat.Type.systemBars())
        }

        onDispose {
            activity?.requestedOrientation = originalOrientation
            val win = activity?.window
            if (win != null) {
                win.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                val controller = WindowCompat.getInsetsController(win, win.decorView)
                controller.show(WindowInsetsCompat.Type.systemBars())
            }
        }
    }

    // Minimal back arrow automatically fades away after 2.5 seconds
    LaunchedEffect(Unit) {
        delay(2500)
        showBackArrow = false
    }

    // Direct 1-source Vidy streaming URL mirroring the desktop app
    val streamUrl = remember(item.tmdbId, season, episode) {
        VidyEngine.getStreamUrl(item.type, item.tmdbId, season, episode)
    }

    BackHandler {
        if (customView != null) {
            customViewCallback?.onCustomViewHidden()
            customView = null
        } else {
            onClose()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Direct Vidy Stream Player in Android WebView (Zero touch interference)
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )

                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        mediaPlaybackRequiresUserGesture = false
                        allowFileAccess = false
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        useWideViewPort = true
                        loadWithOverviewMode = true
                        setSupportZoom(false)
                        userAgentString = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                    }

                    webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(
                            view: WebView?,
                            request: WebResourceRequest?
                        ): WebResourceResponse? {
                            val url = request?.url?.toString() ?: return null
                            if (AdBlocker.isAd(url)) {
                                return AdBlocker.createEmptyResponse()
                            }
                            return super.shouldInterceptRequest(view, request)
                        }

                        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                            isLoading = true
                            super.onPageStarted(view, url, favicon)
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            isLoading = false
                            super.onPageFinished(view, url)
                        }
                    }

                    webChromeClient = object : WebChromeClient() {
                        override fun onCreateWindow(
                            view: WebView?,
                            isDialog: Boolean,
                            isUserGesture: Boolean,
                            resultMsg: Message?
                        ): Boolean {
                            return false
                        }

                        override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                            customView = view
                            customViewCallback = callback
                        }

                        override fun onHideCustomView() {
                            customView = null
                            customViewCallback = null
                        }
                    }

                    loadUrl(streamUrl)
                    webViewInstance = this
                }
            },
            update = { webView ->
                if (webView.url != streamUrl) {
                    webView.loadUrl(streamUrl)
                }
            }
        )

        // Native HTML5 fullscreen if triggered
        if (customView != null) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { customView!! }
            )
        }

        // Tiny, minimalist floating back arrow in top-left that fades away after 2.5s
        AnimatedVisibility(
            visible = showBackArrow,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(start = 16.dp, top = 16.dp)
        ) {
            IconButton(
                onClick = onClose,
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.5f))
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White.copy(alpha = 0.9f),
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        // Subtle loading indicator when starting page
        if (isLoading) {
            LinearProgressIndicator(
                color = Color(0xFF00E5BC),
                trackColor = Color.Transparent,
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
            )
        }
    }
}
