package com.eru.cinema.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.ui.theme.EruTextMuted
import com.eru.cinema.ui.theme.EruTextPrimary

@Composable
fun ContentRow(
    title: String,
    items: List<MediaItem>,
    onItemClick: (MediaItem) -> Unit
) {
    if (items.isEmpty()) return
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = EruTextPrimary
            )
        }
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items, key = { it.id }) { item ->
                MediaCard(item = item, onClick = { onItemClick(item) })
            }
        }
        Spacer(Modifier.height(16.dp))
    }
}
