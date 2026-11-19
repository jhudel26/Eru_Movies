package com.eru.cinema.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.eru.cinema.data.api.TmdbService
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.navigation.EruRoutes
import com.eru.cinema.ui.components.MediaCard
import com.eru.cinema.ui.theme.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun SearchScreen(navController: NavController) {
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<MediaItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var searchJob by remember { mutableStateOf<Job?>(null) }
    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current

    fun doSearch(q: String) {
        searchJob?.cancel()
        if (q.isBlank()) {
            results = emptyList()
            isLoading = false
            return
        }
        searchJob = scope.launch {
            delay(500) // debounce
            isLoading = true
            try {
                results = TmdbService.search(q)
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isLoading = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EruBgDeep)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Search",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = EruTextPrimary
            )
        }

        // Search bar
        TextField(
            value = query,
            onValueChange = { q ->
                query = q
                doSearch(q)
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            placeholder = { Text("Search movies, shows...", color = EruTextMuted) },
            leadingIcon = {
                Icon(Icons.Default.Search, contentDescription = null, tint = EruTextMuted)
            },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = {
                        query = ""
                        results = emptyList()
                        focusManager.clearFocus()
                    }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear", tint = EruTextMuted)
                    }
                }
            },
            colors = TextFieldDefaults.colors(
                focusedContainerColor = EruSurface2,
                unfocusedContainerColor = EruSurface1,
                focusedTextColor = EruTextPrimary,
                unfocusedTextColor = EruTextPrimary,
                focusedIndicatorColor = EruTeal,
                unfocusedIndicatorColor = Color.Transparent,
                cursorColor = EruTeal
            ),
            shape = RoundedCornerShape(12.dp),
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { focusManager.clearFocus() })
        )

        Spacer(Modifier.height(12.dp))

        Box(modifier = Modifier.fillMaxSize()) {
            when {
                isLoading -> CircularProgressIndicator(
                    color = EruTeal,
                    modifier = Modifier.align(Alignment.Center)
                )
                query.isNotEmpty() && results.isEmpty() -> {
                    Text(
                        text = "No results for \"$query\"",
                        color = EruTextMuted,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                query.isEmpty() -> {
                    Text(
                        text = "Search for movies and TV shows",
                        color = EruTextMuted,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                else -> {
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(minSize = 130.dp),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 80.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        items(results, key = { it.id }) { item ->
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
}
