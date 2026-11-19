package com.eru.cinema.data.api

/**
 * ERU Cinema — Direct Vidy Streaming Source Engine
 * Mirroring the Desktop App (Single Source: Vidy.st)
 */
object VidyEngine {
    private const val VIDY_BASE = "https://www.vidy.st"
    private const val ACCENT_COLOR = "2DD4BF" // ERU Teal (no # prefix)

    fun getStreamUrl(type: String, tmdbId: Long, season: Int = 1, episode: Int = 1): String {
        val accent = "color=$ACCENT_COLOR"
        return if (type.equals("tv", ignoreCase = true)) {
            "$VIDY_BASE/tv/$tmdbId/$season/$episode?$accent"
        } else {
            "$VIDY_BASE/movie/$tmdbId?$accent"
        }
    }
}
