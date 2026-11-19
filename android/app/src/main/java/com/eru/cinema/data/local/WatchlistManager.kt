package com.eru.cinema.data.local

import android.content.Context
import com.eru.cinema.data.model.MediaItem
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

object WatchlistManager {
    private const val PREFS_NAME = "eru_watchlist"
    private const val KEY_ITEMS = "watchlist_items"
    private val gson = Gson()

    fun getAll(context: Context): List<MediaItem> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_ITEMS, null) ?: return emptyList()
        val type = object : TypeToken<List<MediaItem>>() {}.type
        return try { gson.fromJson(json, type) } catch (e: Exception) { emptyList() }
    }

    fun add(context: Context, item: MediaItem) {
        val list = getAll(context).toMutableList()
        if (list.none { it.id == item.id }) {
            list.add(item)
            save(context, list)
        }
    }

    fun remove(context: Context, itemId: String) {
        val list = getAll(context).toMutableList()
        list.removeAll { it.id == itemId }
        save(context, list)
    }

    fun isInWatchlist(context: Context, itemId: String): Boolean {
        return getAll(context).any { it.id == itemId }
    }

    private fun save(context: Context, items: List<MediaItem>) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_ITEMS, gson.toJson(items)).apply()
    }
}
