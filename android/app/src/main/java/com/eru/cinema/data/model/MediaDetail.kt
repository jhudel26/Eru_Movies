package com.eru.cinema.data.model

data class MediaDetail(
    val item: MediaItem,
    val genres: List<String>,
    val runtime: Int? = null,         // minutes for movies
    val seasons: List<Season> = emptyList(),  // TV only
    val similar: List<MediaItem> = emptyList()
)
