package com.eru.cinema.data.model

import com.google.gson.annotations.SerializedName

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

data class StreamServer(
    val id: String,
    val name: String,
    val url: String,
    val quality: String = "HD"
)

data class StreamEmbedResponse(
    val embedUrl: String?,
    val servers: List<StreamServer>
)
