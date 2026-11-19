package com.eru.cinema.data.repository

import com.eru.cinema.data.api.TmdbService
import com.eru.cinema.data.model.Episode
import com.eru.cinema.data.model.HomeCatalog
import com.eru.cinema.data.model.MediaDetail
import com.eru.cinema.data.model.MediaItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MediaRepository(private val service: TmdbService) {

    suspend fun getHomeCatalog(): HomeCatalog = withContext(Dispatchers.IO) {
        service.getHomeCatalog()
    }

    suspend fun getMovies(page: Int = 1): List<MediaItem> = withContext(Dispatchers.IO) {
        service.getMovies(page)
    }

    suspend fun getTvShows(page: Int = 1): List<MediaItem> = withContext(Dispatchers.IO) {
        service.getTvShows(page)
    }

    suspend fun search(query: String): List<MediaItem> = withContext(Dispatchers.IO) {
        service.search(query)
    }

    suspend fun getDetail(type: String, tmdbId: Long): MediaDetail = withContext(Dispatchers.IO) {
        service.getDetail(type, tmdbId)
    }

    suspend fun getSeason(tvId: Long, season: Int): List<Episode> = withContext(Dispatchers.IO) {
        service.getSeason(tvId, season)
    }
}
