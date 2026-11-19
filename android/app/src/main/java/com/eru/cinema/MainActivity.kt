package com.eru.cinema

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eru.cinema.data.api.StreamResolver
import com.eru.cinema.data.api.TmdbService
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.data.model.StreamServer
import com.eru.cinema.ui.components.MediaCard
import com.eru.cinema.ui.player.PlayerView
import com.eru.cinema.ui.theme.ERUCinemaTheme
import com.eru.cinema.ui.theme.EruBgDeep
import com.eru.cinema.ui.theme.EruSurface1
import com.eru.cinema.ui.theme.EruTeal
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ERUCinemaTheme {
                MainApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp() {
    var selectedTab by remember { mutableStateOf(0) } // 0: Discover, 1: Movies, 2: TV Shows
    var mediaItems by remember { mutableStateOf<List<MediaItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }

    // Player state
    var activeServers by remember { mutableStateOf<List<StreamServer>?>(null) }

    val scope = rememberCoroutineScope()

    fun loadContent(tab: Int) {
        isLoading = true
        scope.launch {
            try {
                mediaItems = when (tab) {
                    0 -> TmdbService.getHomeCatalog().items
                    1 -> TmdbService.getMovies()
                    2 -> TmdbService.getTvShows()
                    else -> emptyList()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(selectedTab) {
        loadContent(selectedTab)
    }

    if (activeServers != null) {
        PlayerView(
            servers = activeServers!!,
            onClose = { activeServers = null }
        )
    } else {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "ERU",
                                fontWeight = FontWeight.Black,
                                fontSize = 20.sp,
                                color = EruTeal
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "CINEMA",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = Color.White
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = EruBgDeep,
                        titleContentColor = Color.White
                    ),
                    actions = {
                        IconButton(onClick = { /* Search Dialog */ }) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "Search",
                                tint = Color.White
                            )
                        }
                    }
                )
            },
            bottomBar = {
                NavigationBar(
                    containerColor = EruSurface1,
                    contentColor = Color.White
                ) {
                    NavigationBarItem(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        icon = { Icon(Icons.Default.Explore, contentDescription = "Discover") },
                        label = { Text("Discover") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = EruTeal,
                            selectedTextColor = EruTeal,
                            indicatorColor = EruTeal.copy(alpha = 0.15f)
                        )
                    )
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        icon = { Icon(Icons.Default.Movie, contentDescription = "Movies") },
                        label = { Text("Movies") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = EruTeal,
                            selectedTextColor = EruTeal,
                            indicatorColor = EruTeal.copy(alpha = 0.15f)
                        )
                    )
                    NavigationBarItem(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        icon = { Icon(Icons.Default.Tv, contentDescription = "TV Shows") },
                        label = { Text("TV Shows") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = EruTeal,
                            selectedTextColor = EruTeal,
                            indicatorColor = EruTeal.copy(alpha = 0.15f)
                        )
                    )
                }
            },
            containerColor = EruBgDeep
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(EruBgDeep)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        color = EruTeal,
                        modifier = Modifier.align(Alignment.Center)
                    )
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(minSize = 130.dp),
                        contentPadding = PaddingValues(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(mediaItems, key = { it.id }) { item ->
                            MediaCard(
                                item = item,
                                onClick = {
                                    // Open Player
                                    val embed = if (item.type == "movie") {
                                        StreamResolver.resolveMovie(item.tmdbId, item.imdbId)
                                    } else {
                                        StreamResolver.resolveTv(item.tmdbId, 1, 1, item.imdbId)
                                    }
                                    if (embed.servers.isNotEmpty()) {
                                        activeServers = embed.servers
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
