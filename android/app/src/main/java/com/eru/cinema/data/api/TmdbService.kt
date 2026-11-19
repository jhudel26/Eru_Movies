package com.eru.cinema.data.api

import com.eru.cinema.data.model.HomeCatalog
import com.eru.cinema.data.model.MediaItem
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

object TmdbService {
    private const val BASE_URL = "https://api.themoviedb.org/3"
    private const val API_KEY = "c1dd4a7d9aab18675dc3720ab5a99436" // Default fallback TMDB key
    private const val POSTER_BASE = "https://image.tmdb.org/t/p/w500"
    private const val BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280"

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    private fun getTodayString(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        return sdf.format(Date())
    }

    private fun isAvailable(dateStr: String?): Boolean {
        if (dateStr.isNullOrEmpty()) return false
        val today = getTodayString()
        return dateStr <= today
    }

    suspend fun getHomeCatalog(): HomeCatalog = withContext(Dispatchers.IO) {
        val today = getTodayString()

        // 1. Discover digitally available movies (Digital = 4, Physical = 5)
        val moviesUrl = "$BASE_URL/discover/movie?api_key=$API_KEY&with_release_type=4|5&release_date.lte=$today&sort_by=popularity.desc&page=1"
        // 2. Discover aired TV shows
        val tvUrl = "$BASE_URL/discover/tv?api_key=$API_KEY&first_air_date.lte=$today&sort_by=popularity.desc&page=1"
        // 3. Trending for Hero Carousel
        val trendingUrl = "$BASE_URL/trending/all/day?api_key=$API_KEY"

        val movies = fetchMediaList(moviesUrl, "movie")
        val tvShows = fetchMediaList(tvUrl, "tv")
        val trending = fetchMediaList(trendingUrl, null)

        val heroes = trending.filter { 
            val date = if (it.type == "movie") it.releaseDate else it.firstAirDate
            isAvailable(date) && it.backdrop.isNotEmpty()
        }.take(8)

        val combined = (movies + tvShows).sortedByDescending { it.rating }

        HomeCatalog(heroes = heroes, items = combined)
    }

    suspend fun getMovies(): List<MediaItem> = withContext(Dispatchers.IO) {
        val today = getTodayString()
        val url = "$BASE_URL/discover/movie?api_key=$API_KEY&with_release_type=4|5&release_date.lte=$today&sort_by=popularity.desc&page=1"
        fetchMediaList(url, "movie")
    }

    suspend fun getTvShows(): List<MediaItem> = withContext(Dispatchers.IO) {
        val today = getTodayString()
        val url = "$BASE_URL/discover/tv?api_key=$API_KEY&first_air_date.lte=$today&sort_by=popularity.desc&page=1"
        fetchMediaList(url, "tv")
    }

    suspend fun search(query: String): List<MediaItem> = withContext(Dispatchers.IO) {
        if (query.isBlank()) return@withContext emptyList()
        val url = "$BASE_URL/search/multi?api_key=$API_KEY&query=${java.net.URLEncoder.encode(query, "UTF-8")}&page=1"
        fetchMediaList(url, null).filter {
            val date = if (it.type == "movie") it.releaseDate else it.firstAirDate
            isAvailable(date)
        }
    }

    private fun fetchMediaList(url: String, forcedType: String?): List<MediaItem> {
        try {
            val req = Request.Builder().url(url).build()
            val resp = client.newCall(req).execute()
            val body = resp.body?.string() ?: return emptyList()
            val json = gson.fromJson(body, JsonObject::class.java)
            val results = json.getAsJsonArray("results") ?: return emptyList()

            val items = mutableListOf<MediaItem>()
            for (elem in results) {
                val obj = elem.asJsonObject
                val mediaType = forcedType ?: obj.get("media_type")?.asString ?: "movie"
                if (mediaType == "person") continue

                val id = obj.get("id").asLong
                val title = if (obj.has("title")) obj.get("title").asString 
                            else if (obj.has("name")) obj.get("name").asString 
                            else "Untitled"

                val relDate = if (obj.has("release_date")) obj.get("release_date")?.asString else null
                val airDate = if (obj.has("first_air_date")) obj.get("first_air_date")?.asString else null
                val date = if (mediaType == "movie") relDate else airDate

                // Exclude future unreleased content
                if (!isAvailable(date)) continue

                val year = if (!date.isNullOrEmpty() && date.length >= 4) date.substring(0, 4) else ""
                val rating = if (obj.has("vote_average")) obj.get("vote_average").asDouble else 0.0
                val posterPath = if (obj.has("poster_path") && !obj.get("poster_path").isJsonNull) obj.get("poster_path").asString else null
                val backdropPath = if (obj.has("backdrop_path") && !obj.get("backdrop_path").isJsonNull) obj.get("backdrop_path").asString else null
                val overview = if (obj.has("overview") && !obj.get("overview").isJsonNull) obj.get("overview").asString else ""

                items.add(
                    MediaItem(
                        id = "$mediaType-$id",
                        tmdbId = id,
                        title = title,
                        type = mediaType,
                        year = year,
                        rating = rating,
                        poster = if (posterPath != null) "$POSTER_BASE$posterPath" else "",
                        backdrop = if (backdropPath != null) "$BACKDROP_BASE$backdropPath" else "",
                        overview = overview,
                        releaseDate = relDate,
                        firstAirDate = airDate,
                        slug = id.toString()
                    )
                )
            }
            return items
        } catch (e: Exception) {
            e.printStackTrace()
            return emptyList()
        }
    }
}
