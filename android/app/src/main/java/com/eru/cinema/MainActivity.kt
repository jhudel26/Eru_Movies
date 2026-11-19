package com.eru.cinema

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.eru.cinema.navigation.EruNavGraph
import com.eru.cinema.navigation.EruRoutes
import com.eru.cinema.ui.theme.*
import kotlinx.coroutines.delay

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
    var showSplash by remember { mutableStateOf(true) }
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

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
                if (showBars) {
                    TopAppBar(
                        title = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Image(
                                    painter = painterResource(id = R.drawable.eru_logo),
                                    contentDescription = "ERU Brand",
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "ERU",
                                        fontWeight = FontWeight.Black,
                                        fontSize = 19.sp,
                                        color = EruTeal,
                                        lineHeight = 20.sp
                                    )
                                    Text(
                                        text = "Entertainment Retrieval Unlimited",
                                        fontWeight = FontWeight.Medium,
                                        fontSize = 9.sp,
                                        color = EruTextMuted,
                                        letterSpacing = 0.4.sp,
                                        lineHeight = 11.sp
                                    )
                                }
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

        // Professional Animated Splash Screen
        AnimatedVisibility(
            visible = showSplash,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            SplashScreen(onFinished = { showSplash = false })
        }
    }
}

@Composable
fun SplashScreen(onFinished: () -> Unit) {
    var progress by remember { mutableStateOf(0f) }

    LaunchedEffect(Unit) {
        val duration = 2000L
        val stepTime = 40L
        val totalSteps = (duration / stepTime).toInt()
        for (i in 1..totalSteps) {
            delay(stepTime)
            progress = i.toFloat() / totalSteps.toFloat()
        }
        delay(200)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(EruBgDeep)
    ) {
        // Fullscreen splash image as requested
        Image(
            painter = painterResource(id = R.drawable.splashscreen),
            contentDescription = "ERU Cinema Splash",
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        // Gradient overlay for bottom branding
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color.Transparent,
                            EruBgDeep.copy(alpha = 0.7f),
                            EruBgDeep
                        )
                    )
                )
        )

        // Bottom Brand & Progress
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 48.dp)
                .padding(horizontal = 32.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Image(
                    painter = painterResource(id = R.drawable.eru_logo),
                    contentDescription = null,
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(8.dp))
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "ERU",
                        fontWeight = FontWeight.Black,
                        fontSize = 22.sp,
                        color = EruTeal
                    )
                    Text(
                        text = "Entertainment Retrieval Unlimited",
                        fontWeight = FontWeight.Medium,
                        fontSize = 10.sp,
                        color = EruTextMuted,
                        letterSpacing = 0.5.sp
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth(0.6f)
                    .height(3.dp)
                    .clip(RoundedCornerShape(2.dp)),
                color = EruTeal,
                trackColor = EruSurface2
            )
        }
    }
}
