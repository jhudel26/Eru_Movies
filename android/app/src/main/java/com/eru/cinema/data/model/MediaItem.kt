package com.eru.cinema.data.model

data class MediaItem(
    val id: String,
    val tmdbId: Long = 0,
    val imdbId: String? = null,
    val title: String,
    val type: String, // "movie" or "tv"
    val year: String = "",
    val rating: Double = 0.0,
    val poster: String = "",
    val backdrop: String = "",
    val overview: String = "",
    val genres: List<String> = emptyList(),
    val releaseDate: String? = null,
    val firstAirDate: String? = null,
    val slug: String = ""
)

data class HomeCatalog(
    val heroes: List<MediaItem>,
    val items: List<MediaItem>
)
