package com.eru.cinema.ui.player

import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import java.io.ByteArrayInputStream

object AdBlocker {
    private val AD_DOMAINS = hashSetOf(
        "adsterra.com",
        "propellerads.com",
        "popads.net",
        "popcash.net",
        "bet365.com",
        "1xbet.com",
        "onclickbright.com",
        "deloton.com",
        "exoclick.com",
        "trafficjunky.com",
        "ad-maven.com",
        "monetag.com",
        "wingsmob.com",
        "tagivi.com",
        "grop.net",
        "doubleclick.net",
        "googlesyndication.com"
    )

    fun isAd(url: String): Boolean {
        val lower = url.lowercase()
        return AD_DOMAINS.any { domain -> lower.contains(domain) }
    }

    fun createEmptyResponse(): WebResourceResponse {
        return WebResourceResponse(
            "text/plain",
            "UTF-8",
            ByteArrayInputStream(ByteArray(0))
        )
    }
}
