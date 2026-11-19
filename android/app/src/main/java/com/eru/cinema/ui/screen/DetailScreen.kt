package com.eru.cinema.ui.screen

import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.eru.cinema.data.api.TmdbService
import com.eru.cinema.data.local.HistoryManager
import com.eru.cinema.data.local.WatchlistManager
import com.eru.cinema.data.model.Episode
import com.eru.cinema.data.model.MediaDetail
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.data.model.Season
import com.eru.cinema.navigation.EruRoutes
import com.eru.cinema.ui.components.ContentRow
import com.eru.cinema.ui.player.PlayerView
import com.eru.cinema.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetailScreen(
    navController: NavController,
    type: String,
    tmdbId: Long
) {
    val context = LocalContext.current
    var detail by remember { mutableStateOf<MediaDetail?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isWatchlisted by remember { mutableStateOf(WatchlistManager.isInWatchlist(context, "$type-$tmdbId")) }

    // Player state
    var showPlayer by remember { mutableStateOf(false) }
    var selectedSeason by remember { mutableStateOf(1) }
    var selectedEpisode by remember { mutableStateOf(1) }

    // TV episode list state
    var episodes by remember { mutableStateOf<List<Episode>>(emptyList()) }
    var loadingEpisodes by remember { mutableStateOf(false) }
    var expandedOverview by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()

    LaunchedEffect(type, tmdbId) {
        scope.launch {
            try {
                detail = TmdbService.getDetail(type, tmdbId)
                // Load first season episodes for TV
                if (type == "tv") {
                    val seasons = detail?.seasons ?: emptyList()
                    if (seasons.isNotEmpty()) {
                        selectedSeason = seasons.first().seasonNumber
                        loadingEpisodes = true
                        episodes = TmdbService.getSeason(tmdbId, selectedSeason)
                        loadingEpisodes = false
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isLoading = false
            }
        }
    }

    // Load episodes when season changes
    LaunchedEffect(selectedSeason) {
        if (type == "tv" && detail != null) {
            loadingEpisodes = true
            try {
                episodes = TmdbService.getSeason(tmdbId, selectedSeason)
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                loadingEpisodes = false
            }
        }
    }

    // Show player fullscreen
    if (showPlayer && detail != null) {
        PlayerView(
            item = detail!!.item,
            season = selectedSeason,
            episode = selectedEpisode,
            onNextEpisode = if (type == "tv") {
                {
                    val nextEp = selectedEpisode + 1
                    val hasNext = episodes.any { it.episodeNumber == nextEp }
                    if (hasNext) {
                        selectedEpisode = nextEp
                    }
                }
            } else null,
            onClose = { showPlayer = false }
        )
        return
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
            val d = detail
            if (d == null) {
                Text("Failed to load content", color = EruTextMuted, modifier = Modifier.align(Alignment.Center))
            } else {
                val item = d.item
                LazyColumn(modifier = Modifier.fillMaxSize()) {

                    // --- BACKDROP HEADER ---
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(300.dp)
                        ) {
                            AsyncImage(
                                model = item.backdrop.ifEmpty { item.poster },
                                contentDescription = item.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                            // Gradient overlay
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.verticalGradient(
                                            colors = listOf(
                                                Color.Black.copy(alpha = 0.3f),
                                                Color.Transparent,
                                                EruBgDeep.copy(alpha = 0.8f),
                                                EruBgDeep
                                            )
                                        )
                                    )
                            )
                            // Back button
                            IconButton(
                                onClick = { navController.popBackStack() },
                                modifier = Modifier
                                    .align(Alignment.TopStart)
                                    .statusBarsPadding()
                                    .padding(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                    contentDescription = "Back",
                                    tint = Color.White
                                )
                            }
                        }
                    }

                    // --- TITLE + META ---
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            // Poster thumbnail
                            if (item.poster.isNotEmpty()) {
                                AsyncImage(
                                    model = item.poster,
                                    contentDescription = item.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .width(90.dp)
                                        .height(130.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                )
                                Spacer(Modifier.width(14.dp))
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                // Type badge
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = EruTeal.copy(alpha = 0.15f),
                                    modifier = Modifier.padding(bottom = 6.dp)
                                ) {
                                    Text(
                                        text = if (item.type == "tv") "TV SERIES" else "MOVIE",
                                        color = EruTeal,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                                Text(
                                    text = item.title,
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Black,
                                    color = EruTextPrimary,
                                    lineHeight = 26.sp
                                )
                                Spacer(Modifier.height(6.dp))
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (item.year.isNotEmpty()) {
                                        Text(item.year, color = EruTextMuted, fontSize = 13.sp)
                                    }
                                    if (item.rating > 0) {
                                        Text("★ ${"%.1f".format(item.rating)}", color = EruGold, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                    if (d.runtime != null && d.runtime > 0) {
                                        Text("${d.runtime}m", color = EruTextMuted, fontSize = 13.sp)
                                    }
                                }
                                // Genres
                                if (d.genres.isNotEmpty()) {
                                    Spacer(Modifier.height(4.dp))
                                    Text(
                                        text = d.genres.take(3).joinToString(" • "),
                                        color = EruTextMuted,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    // --- OVERVIEW ---
                    item {
                        if (item.overview.isNotEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = item.overview,
                                    color = EruTextMuted,
                                    fontSize = 14.sp,
                                    maxLines = if (expandedOverview) Int.MAX_VALUE else 3,
                                    overflow = if (expandedOverview) TextOverflow.Visible else TextOverflow.Ellipsis,
                                    lineHeight = 20.sp
                                )
                                TextButton(
                                    onClick = { expandedOverview = !expandedOverview },
                                    contentPadding = PaddingValues(0.dp)
                                ) {
                                    Text(
                                        if (expandedOverview) "Show less" else "Read more",
                                        color = EruTeal,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }
                    }

                    // --- ACTION BUTTONS ---
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Watch Now
                            Button(
                                onClick = {
                                    selectedEpisode = 1
                                    if (type == "tv" && episodes.isNotEmpty()) {
                                        selectedEpisode = episodes.first().episodeNumber
                                    }
                                    HistoryManager.add(context, item, selectedSeason, selectedEpisode)
                                    showPlayer = true
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = EruTeal),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(vertical = 14.dp)
                            ) {
                                Icon(Icons.Default.PlayArrow, null, tint = EruBgDeep, modifier = Modifier.size(20.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Watch Now", color = EruBgDeep, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }

                            // Watchlist toggle
                            OutlinedButton(
                                onClick = {
                                    if (isWatchlisted) {
                                        WatchlistManager.remove(context, item.id)
                                    } else {
                                        WatchlistManager.add(context, item)
                                    }
                                    isWatchlisted = !isWatchlisted
                                },
                                modifier = Modifier.fillMaxWidth(),
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (isWatchlisted) EruTeal else EruBorder
                                ),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(vertical = 14.dp)
                            ) {
                                Icon(
                                    if (isWatchlisted) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                                    null,
                                    tint = if (isWatchlisted) EruTeal else EruTextPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    if (isWatchlisted) "In My List" else "Add to My List",
                                    color = if (isWatchlisted) EruTeal else EruTextPrimary,
                                    fontSize = 15.sp
                                )
                            }
                        }
                    }

                    // --- TV: Season selector + episodes ---
                    if (type == "tv" && d.seasons.isNotEmpty()) {
                        item {
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = "Episodes",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = EruTextPrimary,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                            )

                            // Season selector chips
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.padding(vertical = 8.dp)
                            ) {
                                items(d.seasons) { season ->
                                    FilterChip(
                                        selected = season.seasonNumber == selectedSeason,
                                        onClick = { selectedSeason = season.seasonNumber },
                                        label = { Text("S${season.seasonNumber}", fontSize = 13.sp) },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = EruTeal.copy(alpha = 0.2f),
                                            selectedLabelColor = EruTeal,
                                            containerColor = EruSurface1,
                                            labelColor = EruTextMuted
                                        ),
                                        border = FilterChipDefaults.filterChipBorder(
                                            enabled = true,
                                            selected = season.seasonNumber == selectedSeason,
                                            selectedBorderColor = EruTeal,
                                            borderColor = EruBorder
                                        )
                                    )
                                }
                            }
                        }

                        if (loadingEpisodes) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().height(80.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = EruTeal, modifier = Modifier.size(28.dp))
                                }
                            }
                        } else {
                            items(episodes, key = { "ep-${it.seasonNumber}-${it.episodeNumber}" }) { episode ->
                                EpisodeItem(
                                    episode = episode,
                                    isSelected = selectedEpisode == episode.episodeNumber && selectedSeason == episode.seasonNumber,
                                    onPlay = {
                                        selectedSeason = episode.seasonNumber
                                        selectedEpisode = episode.episodeNumber
                                        HistoryManager.add(context, item, episode.seasonNumber, episode.episodeNumber)
                                        showPlayer = true
                                    }
                                )
                            }
                        }
                    }

                    // --- Similar content ---
                    if (d.similar.isNotEmpty()) {
                        item {
                            Spacer(Modifier.height(16.dp))
                            ContentRow(
                                title = "More Like This",
                                items = d.similar,
                                onItemClick = { sim ->
                                    navController.navigate(EruRoutes.detail(sim.type, sim.tmdbId))
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

@Composable
private fun EpisodeItem(
    episode: Episode,
    isSelected: Boolean,
    onPlay: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clickable { onPlay() },
        color = if (isSelected) EruSurface3 else EruSurface1,
        shape = RoundedCornerShape(10.dp),
        border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, EruTeal) else null
    ) {
        Row(
            modifier = Modifier.padding(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Episode thumbnail
            if (episode.stillPath.isNotEmpty()) {
                AsyncImage(
                    model = episode.stillPath,
                    contentDescription = episode.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .width(100.dp)
                        .height(60.dp)
                        .clip(RoundedCornerShape(6.dp))
                )
            } else {
                Box(
                    modifier = Modifier
                        .width(100.dp)
                        .height(60.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(EruSurface2),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.PlayArrow, null, tint = EruTextMuted, modifier = Modifier.size(28.dp))
                }
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${episode.episodeNumber}. ${episode.name}",
                    color = if (isSelected) EruTeal else EruTextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (episode.runtime != null) {
                    Text(
                        text = "${episode.runtime}m",
                        color = EruTextMuted,
                        fontSize = 11.sp
                    )
                }
                if (episode.overview.isNotEmpty()) {
                    Spacer(Modifier.height(3.dp))
                    Text(
                        text = episode.overview,
                        color = EruTextMuted,
                        fontSize = 12.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        lineHeight = 16.sp
                    )
                }
            }
        }
    }
}
