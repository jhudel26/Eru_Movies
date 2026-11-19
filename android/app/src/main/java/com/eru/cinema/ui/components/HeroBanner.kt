package com.eru.cinema.ui.components

import androidx.compose.animation.core.tween
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.ui.theme.*
import kotlinx.coroutines.delay

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HeroBanner(
    items: List<MediaItem>,
    onPlayClick: (MediaItem) -> Unit,
    onInfoClick: (MediaItem) -> Unit
) {
    if (items.isEmpty()) return

    val pagerState = rememberPagerState(pageCount = { items.size })

    // Auto-scroll every 5 seconds
    LaunchedEffect(pagerState) {
        while (true) {
            delay(5000)
            val nextPage = (pagerState.currentPage + 1) % items.size
            pagerState.animateScrollToPage(nextPage, animationSpec = tween(600))
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(480.dp)
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            val item = items[page]
            HeroBannerItem(
                item = item,
                onPlayClick = { onPlayClick(item) },
                onInfoClick = { onInfoClick(item) }
            )
        }

        // Page indicator dots
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            repeat(items.size) { index ->
                Box(
                    modifier = Modifier
                        .size(if (pagerState.currentPage == index) 20.dp else 6.dp, 6.dp)
                        .clip(CircleShape)
                        .background(
                            if (pagerState.currentPage == index) EruTeal
                            else Color.White.copy(alpha = 0.4f)
                        )
                )
            }
        }
    }
}

@Composable
private fun HeroBannerItem(
    item: MediaItem,
    onPlayClick: () -> Unit,
    onInfoClick: () -> Unit
) {
    Box(modifier = Modifier.fillMaxSize()) {
        // Backdrop Image
        AsyncImage(
            model = item.backdrop.ifEmpty { item.poster },
            contentDescription = item.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        // Dark gradient overlay from bottom
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            EruBgDeep.copy(alpha = 0.4f),
                            EruBgDeep.copy(alpha = 0.85f),
                            EruBgDeep
                        ),
                        startY = 0f
                    )
                )
        )

        // Content overlay
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 20.dp, end = 20.dp, bottom = 32.dp)
        ) {
            // Type badge
            Surface(
                shape = RoundedCornerShape(4.dp),
                color = EruTeal.copy(alpha = 0.15f),
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text(
                    text = if (item.type == "tv") "TV SERIES" else "MOVIE",
                    color = EruTeal,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
            }

            // Title
            Text(
                text = item.title,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                color = EruTextPrimary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 32.sp
            )

            Spacer(Modifier.height(6.dp))

            // Meta row
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (item.year.isNotEmpty()) {
                    Text(text = item.year, color = EruTextMuted, fontSize = 13.sp)
                }
                if (item.rating > 0) {
                    Text(text = "★ ${"%.1f".format(item.rating)}", color = EruGold, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(Modifier.height(4.dp))

            // Overview
            Text(
                text = item.overview,
                color = EruTextMuted,
                fontSize = 13.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 18.sp
            )

            Spacer(Modifier.height(16.dp))

            // Action buttons
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = onPlayClick,
                    colors = ButtonDefaults.buttonColors(containerColor = EruTeal),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 10.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = EruBgDeep, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Watch Now", color = EruBgDeep, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
                OutlinedButton(
                    onClick = onInfoClick,
                    border = androidx.compose.foundation.BorderStroke(1.dp, EruBorder),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
                ) {
                    Icon(Icons.Default.Info, contentDescription = null, tint = EruTextPrimary, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("More Info", color = EruTextPrimary, fontSize = 14.sp)
                }
            }
        }
    }
}
