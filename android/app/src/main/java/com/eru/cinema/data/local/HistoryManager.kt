package com.eru.cinema.data.local

import android.content.Context
import com.eru.cinema.data.model.MediaItem
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

data class HistoryItem(
    val item: MediaItem,
    val season: Int = 1,
    val episode: Int = 1,
    val timestamp: Long = System.currentTimeMillis()
)

object HistoryManager {
    private const val PREFS_NAME = "eru_history"
    private const val KEY_ITEMS = "history_items"
    private val gson = Gson()

    fun getAll(context: Context): List<HistoryItem> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_ITEMS, null) ?: return emptyList()
        val type = object : TypeToken<List<HistoryItem>>() {}.type
        return try {
            gson.fromJson<List<HistoryItem>>(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun add(context: Context, item: MediaItem, season: Int = 1, episode: Int = 1) {
        val list = getAll(context).toMutableList()
        list.removeAll { it.item.id == item.id }
        list.add(0, HistoryItem(item = item, season = season, episode = episode, timestamp = System.currentTimeMillis()))
        if (list.size > 40) {
            list.removeAt(list.lastIndex)
        }
        save(context, list)
    }

    fun remove(context: Context, itemId: String) {
        val list = getAll(context).toMutableList()
        list.removeAll { it.item.id == itemId }
        save(context, list)
    }

    fun clear(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(KEY_ITEMS).apply()
    }

    private fun save(context: Context, items: List<HistoryItem>) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_ITEMS, gson.toJson(items)).apply()
    }
}
