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
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import coil.compose.AsyncImage
import com.eru.cinema.data.api.VidyEngine
import com.eru.cinema.data.model.Episode
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.ui.theme.*
import kotlinx.coroutines.delay

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun PlayerView(
    item: MediaItem,
    season: Int = 1,
    episode: Int = 1,
    episodes: List<Episode> = emptyList(),
    onSelectEpisode: ((season: Int, episode: Int) -> Unit)? = null,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity
    var currentSeason by remember(season) { mutableStateOf(season) }
    var currentEpisode by remember(episode) { mutableStateOf(episode) }
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var showControls by remember { mutableStateOf(true) }
    var showEpisodeDrawer by remember { mutableStateOf(false) }
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

    // Auto-hide controls after 4.5 seconds unless drawer is open
    LaunchedEffect(showControls, showEpisodeDrawer) {
        if (showControls && !showEpisodeDrawer) {
            delay(4500)
            showControls = false
        }
    }

    // Direct 1-source Vidy streaming URL mirroring the desktop app
    val streamUrl = remember(item.tmdbId, currentSeason, currentEpisode) {
        VidyEngine.getStreamUrl(item.type, item.tmdbId, currentSeason, currentEpisode)
    }

    // Check if next episode exists
    val nextEpisodeItem = remember(currentSeason, currentEpisode, episodes) {
        if (item.type == "tv" && episodes.isNotEmpty()) {
            episodes.firstOrNull { it.seasonNumber == currentSeason && it.episodeNumber == currentEpisode + 1 }
        } else null
    }

    BackHandler {
        if (showEpisodeDrawer) {
            showEpisodeDrawer = false
        } else if (customView != null) {
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
        // Direct Vidy Stream Player in Android WebView
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
                        mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
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

        // Tap listener on upper 70% of screen to reveal controls when hidden
        // (Bottom 30% is ALWAYS direct-to-WebView so Vidy's CC & Quality controls are NEVER blocked)
        if (!showControls && !showEpisodeDrawer) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.70f)
                    .align(Alignment.TopCenter)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {
                        showControls = true
                    }
            )
        }

        // 1. Minimalist Back Button (Top-Left)
        AnimatedVisibility(
            visible = showControls || showEpisodeDrawer,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(start = 16.dp, top = 16.dp)
        ) {
            IconButton(
                onClick = onClose,
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.55f))
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White.copy(alpha = 0.9f),
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        // 2. Episode Selector (Center-Right part of the screen)
        if (item.type == "tv" && episodes.isNotEmpty()) {
            AnimatedVisibility(
                visible = showControls || showEpisodeDrawer,
                enter = fadeIn() + slideInHorizontally(initialOffsetX = { it }),
                exit = fadeOut() + slideOutHorizontally(targetOffsetX = { it }),
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 16.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (showEpisodeDrawer) EruTeal else Color.Black.copy(alpha = 0.70f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, EruTeal.copy(alpha = 0.6f)),
                    modifier = Modifier.clickable {
                        showEpisodeDrawer = !showEpisodeDrawer
                    }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.VideoLibrary,
                            contentDescription = "Episode Selector",
                            tint = if (showEpisodeDrawer) EruBgDeep else EruTeal,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "Episodes",
                            color = if (showEpisodeDrawer) EruBgDeep else Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // 3. Next Episode Button (Above the status/scrubber bar at bottom-right)
        if (item.type == "tv" && nextEpisodeItem != null) {
            AnimatedVisibility(
                visible = showControls && !showEpisodeDrawer,
                enter = fadeIn() + slideInVertically(initialOffsetY = { it }),
                exit = fadeOut() + slideOutVertically(targetOffsetY = { it }),
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 16.dp, bottom = 68.dp) // Elevated cleanly above Vidy's bottom bar
            ) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = EruTeal,
                    shadowElevation = 6.dp,
                    modifier = Modifier.clickable {
                        val nextEpNum = currentEpisode + 1
                        currentEpisode = nextEpNum
                        onSelectEpisode?.invoke(currentSeason, nextEpNum)
                    }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = "Next Ep",
                            color = EruBgDeep,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(Modifier.width(4.dp))
                        Icon(
                            imageVector = Icons.Default.SkipNext,
                            contentDescription = "Next Episode",
                            tint = EruBgDeep,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }

        // Slide-In Episode Selection Drawer from Right Edge
        AnimatedVisibility(
            visible = showEpisodeDrawer,
            enter = slideInHorizontally(initialOffsetX = { it }) + fadeIn(),
            exit = slideOutHorizontally(targetOffsetX = { it }) + fadeOut(),
            modifier = Modifier.align(Alignment.CenterEnd)
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxHeight()
                    .width(320.dp),
                color = Color.Black.copy(alpha = 0.94f),
                border = androidx.compose.foundation.BorderStroke(1.dp, EruBorder)
            ) {
                Column(modifier = Modifier.fillMaxSize()) {
                    // Drawer Header
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 14.dp)
                    ) {
                        Column {
                            Text(
                                text = "Episodes",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "Season $currentSeason",
                                color = EruTeal,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        IconButton(onClick = { showEpisodeDrawer = false }, modifier = Modifier.size(32.dp)) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close",
                                tint = Color.White
                            )
                        }
                    }

                    HorizontalDivider(color = EruBorder)

                    // Episode List
                    LazyColumn(
                        contentPadding = PaddingValues(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(episodes, key = { "ep-${it.seasonNumber}-${it.episodeNumber}" }) { ep ->
                            val isCurrent = ep.episodeNumber == currentEpisode && ep.seasonNumber == currentSeason
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (isCurrent) EruSurface3 else EruSurface1,
                                border = if (isCurrent) androidx.compose.foundation.BorderStroke(1.dp, EruTeal) else null,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        currentEpisode = ep.episodeNumber
                                        currentSeason = ep.seasonNumber
                                        showEpisodeDrawer = false
                                        onSelectEpisode?.invoke(ep.seasonNumber, ep.episodeNumber)
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (ep.stillPath.isNotEmpty()) {
                                        AsyncImage(
                                            model = ep.stillPath,
                                            contentDescription = ep.name,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier
                                                .width(76.dp)
                                                .height(46.dp)
                                                .clip(RoundedCornerShape(4.dp))
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .width(76.dp)
                                                .height(46.dp)
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(EruSurface2),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.PlayArrow,
                                                contentDescription = null,
                                                tint = EruTextMuted,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }

                                    Spacer(Modifier.width(10.dp))

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "${ep.episodeNumber}. ${ep.name}",
                                            color = if (isCurrent) EruTeal else Color.White,
                                            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.SemiBold,
                                            fontSize = 13.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        if (ep.runtime != null) {
                                            Text(
                                                text = "${ep.runtime}m",
                                                color = EruTextMuted,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Subtle loading indicator when starting page
        if (isLoading) {
            LinearProgressIndicator(
                color = EruTeal,
                trackColor = Color.Transparent,
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
            )
        }
    }
}
