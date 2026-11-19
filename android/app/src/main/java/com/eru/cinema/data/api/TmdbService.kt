package com.eru.cinema.data.api

import com.eru.cinema.data.model.Episode
import com.eru.cinema.data.model.HomeCatalog
import com.eru.cinema.data.model.MediaDetail
import com.eru.cinema.data.model.MediaItem
import com.eru.cinema.data.model.Season
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
    private const val API_KEY = "c1dd4a7d9aab18675dc3720ab5a99436"
    private const val POSTER_BASE = "https://image.tmdb.org/t/p/w500"
    private const val BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280"
    private const val STILL_BASE = "https://image.tmdb.org/t/p/w300"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    private fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    private fun isAvailable(dateStr: String?): Boolean {
        if (dateStr.isNullOrEmpty()) return false
        return dateStr <= today()
    }

    private fun fetchJson(url: String): JsonObject? {
        return try {
            val req = Request.Builder().url(url).build()
            val resp = client.newCall(req).execute()
            val body = resp.body?.string() ?: return null
            gson.fromJson(body, JsonObject::class.java)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun getHomeCatalog(): HomeCatalog = withContext(Dispatchers.IO) {
        val t = today()
        val movies = fetchMediaList(
            "$BASE_URL/discover/movie?api_key=$API_KEY&with_release_type=4|5&release_date.lte=$t&sort_by=popularity.desc&page=1",
            "movie"
        )
        val tv = fetchMediaList(
            "$BASE_URL/discover/tv?api_key=$API_KEY&first_air_date.lte=$t&sort_by=popularity.desc&page=1",
            "tv"
        )
        val trending = fetchMediaList("$BASE_URL/trending/all/day?api_key=$API_KEY", null)
        val heroes = trending.filter {
            val date = if (it.type == "movie") it.releaseDate else it.firstAirDate
            isAvailable(date) && it.backdrop.isNotEmpty()
        }.take(8)
        HomeCatalog(heroes = heroes, items = (movies + tv).sortedByDescending { it.rating })
    }

    suspend fun getMovies(page: Int = 1): List<MediaItem> = withContext(Dispatchers.IO) {
        val t = today()
        fetchMediaList(
            "$BASE_URL/discover/movie?api_key=$API_KEY&with_release_type=4|5&release_date.lte=$t&sort_by=popularity.desc&page=$page",
            "movie"
        )
    }

    suspend fun getTvShows(page: Int = 1): List<MediaItem> = withContext(Dispatchers.IO) {
        val t = today()
        fetchMediaList(
            "$BASE_URL/discover/tv?api_key=$API_KEY&first_air_date.lte=$t&sort_by=popularity.desc&page=$page",
            "tv"
        )
    }

    suspend fun search(query: String): List<MediaItem> = withContext(Dispatchers.IO) {
        if (query.isBlank()) return@withContext emptyList()
        val enc = java.net.URLEncoder.encode(query, "UTF-8")
        fetchMediaList(
            "$BASE_URL/search/multi?api_key=$API_KEY&query=$enc&page=1",
            null
        ).filter {
            val date = if (it.type == "movie") it.releaseDate else it.firstAirDate
            isAvailable(date)
        }
    }

    suspend fun getDetail(type: String, tmdbId: Long): MediaDetail = withContext(Dispatchers.IO) {
        val path = if (type == "movie") "movie" else "tv"
        val json = fetchJson("$BASE_URL/$path/$tmdbId?api_key=$API_KEY") ?: return@withContext run {
            MediaDetail(
                item = MediaItem(id = "$type-$tmdbId", tmdbId = tmdbId, title = "Unknown", type = type),
                genres = emptyList()
            )
        }

        val genreArr = json.getAsJsonArray("genres") ?: com.google.gson.JsonArray()
        val genres = genreArr.map { it.asJsonObject.get("name").asString }

        val title = when {
            json.has("title") && !json.get("title").isJsonNull -> json.get("title").asString
            json.has("name") && !json.get("name").isJsonNull -> json.get("name").asString
            else -> "Untitled"
        }
        val releaseDate = if (json.has("release_date") && !json.get("release_date").isJsonNull) json.get("release_date").asString else null
        val firstAirDate = if (json.has("first_air_date") && !json.get("first_air_date").isJsonNull) json.get("first_air_date").asString else null
        val date = if (type == "movie") releaseDate else firstAirDate
        val year = if (!date.isNullOrEmpty() && date.length >= 4) date.substring(0, 4) else ""
        val rating = if (json.has("vote_average") && !json.get("vote_average").isJsonNull) json.get("vote_average").asDouble else 0.0
        val posterPath = if (json.has("poster_path") && !json.get("poster_path").isJsonNull) json.get("poster_path").asString else null
        val backdropPath = if (json.has("backdrop_path") && !json.get("backdrop_path").isJsonNull) json.get("backdrop_path").asString else null
        val overview = if (json.has("overview") && !json.get("overview").isJsonNull) json.get("overview").asString else ""
        val runtime = if (type == "movie" && json.has("runtime") && !json.get("runtime").isJsonNull) json.get("runtime").asInt else null

        val seasons: List<Season> = if (type == "tv") {
            val seasonsArr = json.getAsJsonArray("seasons") ?: com.google.gson.JsonArray()
            seasonsArr.mapNotNull { elem ->
                val s = elem.asJsonObject
                val sNum = if (s.has("season_number")) s.get("season_number").asInt else return@mapNotNull null
                if (sNum == 0) return@mapNotNull null // skip specials
                val epCount = if (s.has("episode_count")) s.get("episode_count").asInt else 0
                val sName = if (s.has("name") && !s.get("name").isJsonNull) s.get("name").asString else "Season $sNum"
                val sOverview = if (s.has("overview") && !s.get("overview").isJsonNull) s.get("overview").asString else ""
                val sPoster = if (s.has("poster_path") && !s.get("poster_path").isJsonNull) "$POSTER_BASE${s.get("poster_path").asString}" else ""
                Season(seasonNumber = sNum, episodeCount = epCount, name = sName, overview = sOverview, posterPath = sPoster)
            }
        } else emptyList()

        // Similar content
        val similarJson = fetchJson("$BASE_URL/$path/$tmdbId/similar?api_key=$API_KEY")
        val similar = if (similarJson != null) {
            val results = similarJson.getAsJsonArray("results") ?: com.google.gson.JsonArray()
            buildList {
                for (elem in results) {
                    if (size >= 12) break
                    val obj = elem.asJsonObject
                    val sId = obj.get("id").asLong
                    val sTitle = when {
                        obj.has("title") && !obj.get("title").isJsonNull -> obj.get("title").asString
                        obj.has("name") && !obj.get("name").isJsonNull -> obj.get("name").asString
                        else -> continue
                    }
                    val sPoster = if (obj.has("poster_path") && !obj.get("poster_path").isJsonNull) "$POSTER_BASE${obj.get("poster_path").asString}" else ""
                    val sBackdrop = if (obj.has("backdrop_path") && !obj.get("backdrop_path").isJsonNull) "$BACKDROP_BASE${obj.get("backdrop_path").asString}" else ""
                    val sRating = if (obj.has("vote_average")) obj.get("vote_average").asDouble else 0.0
                    val sRelDate = if (obj.has("release_date") && !obj.get("release_date").isJsonNull) obj.get("release_date").asString else null
                    val sAirDate = if (obj.has("first_air_date") && !obj.get("first_air_date").isJsonNull) obj.get("first_air_date").asString else null
                    val sDate = if (type == "movie") sRelDate else sAirDate
                    val sYear = if (!sDate.isNullOrEmpty() && sDate.length >= 4) sDate.substring(0, 4) else ""
                    add(MediaItem(
                        id = "$type-$sId", tmdbId = sId, title = sTitle, type = type,
                        year = sYear, rating = sRating, poster = sPoster, backdrop = sBackdrop,
                        releaseDate = sRelDate, firstAirDate = sAirDate, slug = sId.toString()
                    ))
                }
            }
        } else emptyList()

        val item = MediaItem(
            id = "$type-$tmdbId", tmdbId = tmdbId, title = title, type = type,
            year = year, rating = rating,
            poster = if (posterPath != null) "$POSTER_BASE$posterPath" else "",
            backdrop = if (backdropPath != null) "$BACKDROP_BASE$backdropPath" else "",
            overview = overview, genres = genres,
            releaseDate = releaseDate, firstAirDate = firstAirDate, slug = tmdbId.toString()
        )
        MediaDetail(item = item, genres = genres, runtime = runtime, seasons = seasons, similar = similar)
    }

    suspend fun getSeason(tvId: Long, season: Int): List<Episode> = withContext(Dispatchers.IO) {
        val json = fetchJson("$BASE_URL/tv/$tvId/season/$season?api_key=$API_KEY") ?: return@withContext emptyList()
        val episodes = json.getAsJsonArray("episodes") ?: return@withContext emptyList()
        episodes.map { elem ->
            val ep = elem.asJsonObject
            val epNum = if (ep.has("episode_number")) ep.get("episode_number").asInt else 0
            val name = if (ep.has("name") && !ep.get("name").isJsonNull) ep.get("name").asString else "Episode $epNum"
            val overview = if (ep.has("overview") && !ep.get("overview").isJsonNull) ep.get("overview").asString else ""
            val still = if (ep.has("still_path") && !ep.get("still_path").isJsonNull) "$STILL_BASE${ep.get("still_path").asString}" else ""
            val airDate = if (ep.has("air_date") && !ep.get("air_date").isJsonNull) ep.get("air_date").asString else null
            val runtime = if (ep.has("runtime") && !ep.get("runtime").isJsonNull) ep.get("runtime").asInt else null
            Episode(episodeNumber = epNum, seasonNumber = season, name = name, overview = overview, stillPath = still, airDate = airDate, runtime = runtime)
        }
    }

    private fun fetchMediaList(url: String, forcedType: String?): List<MediaItem> {
        return try {
            val json = fetchJson(url) ?: return emptyList()
            val results = json.getAsJsonArray("results") ?: return emptyList()
            buildList {
                for (elem in results) {
                    val obj = elem.asJsonObject
                    val mediaType = forcedType ?: obj.get("media_type")?.asString ?: "movie"
                    if (mediaType == "person") continue

                    val id = obj.get("id").asLong
                    val title = when {
                        obj.has("title") && !obj.get("title").isJsonNull -> obj.get("title").asString
                        obj.has("name") && !obj.get("name").isJsonNull -> obj.get("name").asString
                        else -> "Untitled"
                    }
                    val relDate = if (obj.has("release_date") && !obj.get("release_date").isJsonNull) obj.get("release_date").asString else null
                    val airDate = if (obj.has("first_air_date") && !obj.get("first_air_date").isJsonNull) obj.get("first_air_date").asString else null
                    val date = if (mediaType == "movie") relDate else airDate
                    if (!isAvailable(date)) continue

                    val year = if (!date.isNullOrEmpty() && date.length >= 4) date.substring(0, 4) else ""
                    val rating = if (obj.has("vote_average")) obj.get("vote_average").asDouble else 0.0
                    val posterPath = if (obj.has("poster_path") && !obj.get("poster_path").isJsonNull) obj.get("poster_path").asString else null
                    val backdropPath = if (obj.has("backdrop_path") && !obj.get("backdrop_path").isJsonNull) obj.get("backdrop_path").asString else null
                    val overview = if (obj.has("overview") && !obj.get("overview").isJsonNull) obj.get("overview").asString else ""

                    add(MediaItem(
                        id = "$mediaType-$id", tmdbId = id, title = title, type = mediaType,
                        year = year, rating = rating,
                        poster = if (posterPath != null) "$POSTER_BASE$posterPath" else "",
                        backdrop = if (backdropPath != null) "$BACKDROP_BASE$backdropPath" else "",
                        overview = overview, releaseDate = relDate, firstAirDate = airDate, slug = id.toString()
                    ))
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}
