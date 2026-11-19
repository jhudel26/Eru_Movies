package com.eru.cinema

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.eru.cinema.navigation.EruNavGraph
import com.eru.cinema.navigation.EruRoutes
import com.eru.cinema.ui.theme.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ERUCinemaTheme {
                MainApp()
            }
        }
    }
}

data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val bottomNavItems = listOf(
        BottomNavItem(EruRoutes.HOME, "Home", Icons.Default.Explore),
        BottomNavItem(EruRoutes.MOVIES, "Movies", Icons.Default.Movie),
        BottomNavItem(EruRoutes.TV, "TV Shows", Icons.Default.Tv),
        BottomNavItem(EruRoutes.SEARCH, "Search", Icons.Default.Search),
        BottomNavItem(EruRoutes.WATCHLIST, "My List", Icons.Default.Bookmark)
    )

    // Hide top and bottom bars on detail & settings screens
    val isDetailScreen = currentRoute?.startsWith("detail") == true
    val isSettingsScreen = currentRoute == EruRoutes.SETTINGS
    val showBars = !isDetailScreen && !isSettingsScreen

    Scaffold(
        topBar = {
            if (showBars) {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "ERU",
                                fontWeight = FontWeight.Black,
                                fontSize = 21.sp,
                                color = EruTeal
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "CINEMA",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = Color.White
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = EruBgDeep,
                        titleContentColor = Color.White
                    ),
                    actions = {
                        IconButton(onClick = { navController.navigate(EruRoutes.SETTINGS) }) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = "Settings",
                                tint = EruTextMuted
                            )
                        }
                    }
                )
            }
        },
        bottomBar = {
            if (showBars) {
                NavigationBar(
                    containerColor = EruSurface1,
                    contentColor = Color.White,
                    tonalElevation = 8.dp
                ) {
                    bottomNavItems.forEach { item ->
                        val selected = currentRoute == item.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                if (currentRoute != item.route) {
                                    navController.navigate(item.route) {
                                        popUpTo(navController.graph.findStartDestination().id) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = item.label,
                                    tint = if (selected) EruTeal else EruTextMuted
                                )
                            },
                            label = {
                                Text(
                                    text = item.label,
                                    fontSize = 11.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (selected) EruTeal else EruTextMuted
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = EruTeal,
                                selectedTextColor = EruTeal,
                                unselectedIconColor = EruTextMuted,
                                unselectedTextColor = EruTextMuted,
                                indicatorColor = EruTeal.copy(alpha = 0.15f)
                            )
                        )
                    }
                }
            }
        },
        containerColor = EruBgDeep
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(EruBgDeep)
        ) {
            EruNavGraph(navController = navController)
        }
    }
}
