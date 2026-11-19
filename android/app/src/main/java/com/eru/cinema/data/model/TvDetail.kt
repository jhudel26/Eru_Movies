package com.eru.cinema.data.model

data class Season(
    val seasonNumber: Int,
    val episodeCount: Int,
    val name: String,
    val overview: String = "",
    val posterPath: String = ""
)

data class Episode(
    val episodeNumber: Int,
    val seasonNumber: Int,
    val name: String,
    val overview: String = "",
    val stillPath: String = "",
    val airDate: String? = null,
    val runtime: Int? = null
)

data class TvDetail(
    val id: Long,
    val seasons: List<Season>
)
