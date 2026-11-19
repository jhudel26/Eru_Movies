package com.eru.cinema.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.eru.cinema.data.api.TmdbService
import com.eru.cinema.data.model.HomeCatalog
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.navigation.EruRoutes
import com.eru.cinema.ui.components.ContentRow
import com.eru.cinema.ui.components.HeroBanner
import com.eru.cinema.ui.theme.EruBgDeep
import com.eru.cinema.ui.theme.EruTeal
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(navController: NavController) {
    var catalog by remember { mutableStateOf<HomeCatalog?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                catalog = TmdbService.getHomeCatalog()
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isLoading = false
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(EruBgDeep)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                color = EruTeal,
                modifier = Modifier.align(Alignment.Center)
            )
        } else {
            val cat = catalog
            if (cat != null) {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    item {
                        HeroBanner(
                            items = cat.heroes,
                            onPlayClick = { item ->
                                navController.navigate(EruRoutes.detail(item.type, item.tmdbId))
                            },
                            onInfoClick = { item ->
                                navController.navigate(EruRoutes.detail(item.type, item.tmdbId))
                            }
                        )
                    }

                    // Trending Movies row
                    val trendingMovies = cat.items.filter { it.type == "movie" }.take(15)
                    if (trendingMovies.isNotEmpty()) {
                        item {
                            ContentRow(
                                title = "Trending Movies",
                                items = trendingMovies,
                                onItemClick = { item ->
                                    navController.navigate(EruRoutes.detail(item.type, item.tmdbId))
                                }
                            )
                        }
                    }

                    // Popular TV Shows row
                    val popularTv = cat.items.filter { it.type == "tv" }.take(15)
                    if (popularTv.isNotEmpty()) {
                        item {
                            ContentRow(
                                title = "Popular TV Shows",
                                items = popularTv,
                                onItemClick = { item ->
                                    navController.navigate(EruRoutes.detail(item.type, item.tmdbId))
                                }
                            )
                        }
                    }

                    // Top Rated combined
                    val topRated = cat.items.sortedByDescending { it.rating }.take(15)
                    if (topRated.isNotEmpty()) {
                        item {
                            ContentRow(
                                title = "Top Rated",
                                items = topRated,
                                onItemClick = { item ->
                                    navController.navigate(EruRoutes.detail(item.type, item.tmdbId))
                                }
                            )
                        }
                    }

                    item { Spacer(Modifier.height(80.dp)) }
                }
            }
        }
    }
}
