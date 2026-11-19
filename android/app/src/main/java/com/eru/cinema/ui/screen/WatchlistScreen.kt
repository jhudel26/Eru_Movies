package com.eru.cinema.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.navigation.NavController
import com.eru.cinema.data.local.HistoryItem
import com.eru.cinema.data.local.HistoryManager
import com.eru.cinema.data.local.WatchlistManager
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.navigation.EruRoutes
import com.eru.cinema.ui.components.MediaCard
import com.eru.cinema.ui.theme.*

@Composable
fun WatchlistScreen(navController: NavController) {
    val context = LocalContext.current
    var selectedTab by remember { mutableStateOf(0) } // 0: Watchlist, 1: History
    var watchlistItems by remember { mutableStateOf<List<MediaItem>>(emptyList()) }
    var historyItems by remember { mutableStateOf<List<HistoryItem>>(emptyList()) }
    val lifecycleOwner = LocalLifecycleOwner.current

    fun reloadData() {
        watchlistItems = WatchlistManager.getAll(context)
        historyItems = HistoryManager.getAll(context)
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                reloadData()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    LaunchedEffect(Unit) {
        reloadData()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EruBgDeep)
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Library",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = EruTextPrimary
            )

            // Clear button for History tab
            if (selectedTab == 1 && historyItems.isNotEmpty()) {
                TextButton(onClick = {
                    HistoryManager.clear(context)
                    reloadData()
                }) {
                    Text("Clear All", color = Color(0xFFEF4444), fontSize = 13.sp)
                }
            }
        }

        // Tab Selector (Watchlist vs History)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                label = {
                    Text(
                        text = "My List (${watchlistItems.size})",
                        fontSize = 13.sp,
                        fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = EruTeal.copy(alpha = 0.2f),
                    selectedLabelColor = EruTeal,
                    containerColor = EruSurface1,
                    labelColor = EruTextMuted
                ),
                border = FilterChipDefaults.filterChipBorder(
                    enabled = true,
                    selected = selectedTab == 0,
                    selectedBorderColor = EruTeal,
                    borderColor = EruBorder
                )
            )

            FilterChip(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                label = {
                    Text(
                        text = "Watch History (${historyItems.size})",
                        fontSize = 13.sp,
                        fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = EruTeal.copy(alpha = 0.2f),
                    selectedLabelColor = EruTeal,
                    containerColor = EruSurface1,
                    labelColor = EruTextMuted
                ),
                border = FilterChipDefaults.filterChipBorder(
                    enabled = true,
                    selected = selectedTab == 1,
                    selectedBorderColor = EruTeal,
                    borderColor = EruBorder
                )
            )
        }

        Spacer(Modifier.height(8.dp))

        if (selectedTab == 0) {
            // --- WATCHLIST CONTENT ---
            if (watchlistItems.isEmpty()) {
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
                    items(watchlistItems, key = { it.id }) { item ->
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
                                    reloadData()
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
        } else {
            // --- WATCH HISTORY CONTENT ---
            if (historyItems.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.History,
                            contentDescription = null,
                            tint = EruTextMuted,
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = "No watch history",
                            color = EruTextPrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "Content you watch will appear here to resume anytime.",
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
                    items(historyItems, key = { "hist-${it.item.id}" }) { entry ->
                        Box(modifier = Modifier.fillMaxWidth()) {
                            MediaCard(
                                item = entry.item,
                                onClick = {
                                    navController.navigate(EruRoutes.detail(entry.item.type, entry.item.tmdbId))
                                }
                            )
                            // Season/Episode Tag
                            if (entry.item.type == "tv") {
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = EruBgDeep.copy(alpha = 0.9f),
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .padding(4.dp)
                                ) {
                                    Text(
                                        text = "S${entry.season} E${entry.episode}",
                                        color = EruTeal,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            // Delete from history
                            IconButton(
                                onClick = {
                                    HistoryManager.remove(context, entry.item.id)
                                    reloadData()
                                },
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .size(32.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Remove from history",
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
}
