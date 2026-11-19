package com.eru.cinema.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.eru.cinema.ui.screen.DetailScreen
import com.eru.cinema.ui.screen.HomeScreen
import com.eru.cinema.ui.screen.MoviesScreen
import com.eru.cinema.ui.screen.SearchScreen
import com.eru.cinema.ui.screen.SettingsScreen
import com.eru.cinema.ui.screen.TvScreen
import com.eru.cinema.ui.screen.WatchlistScreen

object EruRoutes {
    const val HOME = "home"
    const val MOVIES = "movies"
    const val TV = "tv"
    const val SEARCH = "search"
    const val WATCHLIST = "watchlist"
    const val SETTINGS = "settings"
    const val DETAIL = "detail/{type}/{tmdbId}"
    fun detail(type: String, tmdbId: Long) = "detail/$type/$tmdbId"
}

@Composable
fun EruNavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = EruRoutes.HOME
    ) {
        composable(EruRoutes.HOME) {
            HomeScreen(navController = navController)
        }
        composable(EruRoutes.MOVIES) {
            MoviesScreen(navController = navController)
        }
        composable(EruRoutes.TV) {
            TvScreen(navController = navController)
        }
        composable(EruRoutes.SEARCH) {
            SearchScreen(navController = navController)
        }
        composable(EruRoutes.WATCHLIST) {
            WatchlistScreen(navController = navController)
        }
        composable(EruRoutes.SETTINGS) {
            SettingsScreen(navController = navController)
        }
        composable(EruRoutes.DETAIL) { backStackEntry ->
            val type = backStackEntry.arguments?.getString("type") ?: "movie"
            val tmdbId = backStackEntry.arguments?.getString("tmdbId")?.toLongOrNull() ?: 0L
            DetailScreen(
                navController = navController,
                type = type,
                tmdbId = tmdbId
            )
        }
    }
}
