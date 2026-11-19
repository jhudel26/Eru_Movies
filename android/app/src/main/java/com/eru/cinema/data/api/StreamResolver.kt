package com.eru.cinema.data.api

import com.eru.cinema.data.model.StreamEmbedResponse
import com.eru.cinema.data.model.StreamServer

object StreamResolver {
    fun resolveMovie(tmdbId: Long, imdbId: String? = null): StreamEmbedResponse {
        val servers = mutableListOf<StreamServer>()

        // 1. Vidy.st
        servers.add(StreamServer("vidy", "Vidy Cinema (Fast)", "https://vidy.st/embed/movie/$tmdbId", "1080p"))

        // 2. VidSrc.cc
        servers.add(StreamServer("vidsrc-cc", "VidSrc Pro", "https://vidsrc.cc/v2/embed/movie/$tmdbId", "1080p"))

        // 3. 2Embed
        servers.add(StreamServer("2embed", "2Embed Server", "https://www.2embed.cc/embed/$tmdbId", "HD"))

        // 4. SuperEmbed
        if (!imdbId.isNullOrEmpty()) {
            servers.add(StreamServer("superembed", "SuperEmbed (Multi)", "https://multiembed.mov/?video_id=$imdbId", "4K"))
        } else {
            servers.add(StreamServer("superembed", "SuperEmbed (Multi)", "https://multiembed.mov/?video_id=$tmdbId&tmdb=1", "4K"))
        }

        // 5. Closeload
        servers.add(StreamServer("closeload", "Closeload HD", "https://closeload.com/embed/movie/$tmdbId", "HD"))

        return StreamEmbedResponse(
            embedUrl = servers.firstOrNull()?.url,
            servers = servers
        )
    }

    fun resolveTv(tmdbId: Long, season: Int, episode: Int, imdbId: String? = null): StreamEmbedResponse {
        val servers = mutableListOf<StreamServer>()

        // 1. Vidy.st
        servers.add(StreamServer("vidy", "Vidy Cinema (Fast)", "https://vidy.st/embed/tv/$tmdbId/$season/$episode", "1080p"))

        // 2. VidSrc.cc
        servers.add(StreamServer("vidsrc-cc", "VidSrc Pro", "https://vidsrc.cc/v2/embed/tv/$tmdbId/$season/$episode", "1080p"))

        // 3. 2Embed
        servers.add(StreamServer("2embed", "2Embed TV", "https://www.2embed.cc/embedtv/$tmdbId?s=$season&e=$episode", "HD"))

        // 4. SuperEmbed
        if (!imdbId.isNullOrEmpty()) {
            servers.add(StreamServer("superembed", "SuperEmbed TV", "https://multiembed.mov/?video_id=$imdbId&s=$season&e=$episode", "4K"))
        } else {
            servers.add(StreamServer("superembed", "SuperEmbed TV", "https://multiembed.mov/?video_id=$tmdbId&tmdb=1&s=$season&e=$episode", "4K"))
        }

        return StreamEmbedResponse(
            embedUrl = servers.firstOrNull()?.url,
            servers = servers
        )
    }
}
