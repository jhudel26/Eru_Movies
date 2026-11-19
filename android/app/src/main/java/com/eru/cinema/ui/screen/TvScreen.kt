package com.eru.cinema.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.eru.cinema.data.api.TmdbService
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.navigation.EruRoutes
import com.eru.cinema.ui.components.MediaCard
import com.eru.cinema.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun TvScreen(navController: NavController) {
    var shows by remember { mutableStateOf<List<MediaItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                shows = TmdbService.getTvShows()
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
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "TV Shows",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = EruTextPrimary
                )
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = EruTeal)
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Adaptive(minSize = 130.dp),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 80.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(shows, key = { it.id }) { item ->
                        MediaCard(
                            item = item,
                            onClick = {
                                navController.navigate(EruRoutes.detail(item.type, item.tmdbId))
                            }
                        )
                    }
                }
            }
        }
    }
}
