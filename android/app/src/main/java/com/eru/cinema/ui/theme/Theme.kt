package com.eru.cinema.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = EruTeal,
    secondary = EruTealNeon,
    tertiary = EruTealDark,
    background = EruBgDeep,
    surface = EruSurface1,
    onPrimary = EruBgDeep,
    onSecondary = EruBgDeep,
    onBackground = EruTextPrimary,
    onSurface = EruTextPrimary
)

@Composable
fun ERUCinemaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = EruTypography,
        content = content
    )
}
