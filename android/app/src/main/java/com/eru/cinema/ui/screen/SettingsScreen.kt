package com.eru.cinema.ui.screen

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.eru.cinema.data.local.HistoryManager
import com.eru.cinema.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(navController: NavController) {
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", fontWeight = FontWeight.Bold, color = EruTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = EruTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = EruBgDeep)
            )
        },
        containerColor = EruBgDeep
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // About Card (removed "Cinema")
            SettingsCard(title = "About ERU") {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SettingItem(icon = Icons.Default.Info, title = "App", value = "ERU (Entertainment Retrieval Unlimited)")
                    SettingItem(icon = Icons.Default.Info, title = "Version", value = "1.0.0 (Native Android)")
                    SettingItem(icon = Icons.Default.Security, title = "Ad Blocker", value = "Active (Integrated)")
                    SettingItem(icon = Icons.Default.PlayCircle, title = "Engine", value = "Vidy Player")
                }
            }

            // History Management
            SettingsCard(title = "Watch History") {
                Column(modifier = Modifier.padding(12.dp)) {
                    Button(
                        onClick = {
                            HistoryManager.clear(context)
                            Toast.makeText(context, "Watch history cleared", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EruSurface2),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.History, contentDescription = null, tint = EruTeal, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Clear Watch History", color = EruTextPrimary, fontSize = 14.sp)
                    }
                }
            }

            // Storage & Cache
            SettingsCard(title = "Storage") {
                Column(modifier = Modifier.padding(12.dp)) {
                    Button(
                        onClick = {
                            context.cacheDir.deleteRecursively()
                            Toast.makeText(context, "Cache cleared successfully", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EruSurface2),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Clear Image Cache", color = Color(0xFFEF4444), fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsCard(title: String, content: @Composable () -> Unit) {
    Column {
        Text(title, color = EruTeal, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 4.dp, bottom = 6.dp))
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = EruSurface1,
            border = androidx.compose.foundation.BorderStroke(1.dp, EruBorder)
        ) {
            content()
        }
    }
}

@Composable
private fun SettingItem(icon: ImageVector, title: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = EruTextMuted, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(10.dp))
        Text(title, color = EruTextPrimary, fontSize = 14.sp, modifier = Modifier.weight(1f))
        Text(value, color = EruTeal, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}
