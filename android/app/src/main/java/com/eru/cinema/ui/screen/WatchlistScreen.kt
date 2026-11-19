package com.eru.cinema.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.navigation.NavController
import com.eru.cinema.data.local.WatchlistManager
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.navigation.EruRoutes
import com.eru.cinema.ui.components.MediaCard
import com.eru.cinema.ui.theme.EruBgDeep
import com.eru.cinema.ui.theme.EruTextMuted
import com.eru.cinema.ui.theme.EruTextPrimary

@Composable
fun WatchlistScreen(navController: NavController) {
    val context = LocalContext.current
    var items by remember { mutableStateOf<List<MediaItem>>(emptyList()) }
    val lifecycleOwner = LocalLifecycleOwner.current

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                items = WatchlistManager.getAll(context)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    LaunchedEffect(Unit) {
        items = WatchlistManager.getAll(context)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EruBgDeep)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "My List",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = EruTextPrimary
            )
            if (items.isNotEmpty()) {
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "(${items.size})",
                    fontSize = 16.sp,
                    color = EruTextMuted
                )
            }
        }

        if (items.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.BookmarkBorder,
                        contentDescription = null,
                        tint = EruTextMuted,
                        modifier = Modifier.size(56.dp)
                    )
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = "Your watchlist is empty",
                        color = EruTextPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "Save movies and TV shows to watch them later.",
                        color = EruTextMuted,
                        fontSize = 14.sp
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 130.dp),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 80.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(items, key = { it.id }) { item ->
                    Box(modifier = Modifier.fillMaxWidth()) {
                        MediaCard(
                            item = item,
                            onClick = {
                                navController.navigate(EruRoutes.detail(item.type, item.tmdbId))
                            }
                        )
                        IconButton(
                            onClick = {
                                WatchlistManager.remove(context, item.id)
                                items = WatchlistManager.getAll(context)
                            },
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = "Remove from watchlist",
                                tint = EruTextMuted.copy(alpha = 0.7f),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
