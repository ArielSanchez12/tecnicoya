/**
 * Script de configuración de Android para TécnicoYa
 * Ejecutar después de: npx cap add android
 * Uso: node scripts/setup-android.js
 */

const fs = require('fs');
const path = require('path');

const androidPath = path.join(__dirname, '..', 'android');
const resPath = path.join(androidPath, 'app', 'src', 'main', 'res');
const xmlPath = path.join(resPath, 'xml');

// Verificar que existe la carpeta android
if (!fs.existsSync(androidPath)) {
  console.error('❌ La carpeta android no existe. Ejecuta primero: npx cap add android');
  process.exit(1);
}

// Crear carpeta xml si no existe
if (!fs.existsSync(xmlPath)) {
  fs.mkdirSync(xmlPath, { recursive: true });
  console.log('✅ Carpeta xml creada');
}

// Contenido del network_security_config.xml
const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.0.0</domain>
    </domain-config>
</network-security-config>`;

// Contenido del file_paths.xml
const filePaths = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="." />
    <cache-path name="my_cache_images" path="." />
    <files-path name="my_files" path="." />
</paths>`;

// Crear network_security_config.xml
const networkConfigPath = path.join(xmlPath, 'network_security_config.xml');
fs.writeFileSync(networkConfigPath, networkSecurityConfig);
console.log('✅ network_security_config.xml creado');

// Crear file_paths.xml
const filePathsPath = path.join(xmlPath, 'file_paths.xml');
fs.writeFileSync(filePathsPath, filePaths);
console.log('✅ file_paths.xml creado');

// Leer y modificar AndroidManifest.xml
const manifestPath = path.join(androidPath, 'app', 'src', 'main', 'AndroidManifest.xml');

const newManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permisos de Internet (Socket.io, API) -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Permisos de Ubicación -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    
    <!-- Permisos de Cámara -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    
    <!-- Permisos de Almacenamiento/Galería -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    
    <!-- Permisos de Notificaciones -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    
    <!-- Permiso para mantener conexión Socket.io -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            
            <!-- Intent principal -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep Links para la app -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <!-- Links desde emails y web -->
                <data android:scheme="https" android:host="tecnicoya.app" />
                <data android:scheme="https" android:host="*.tecnicoya.app" />
                <data android:scheme="tecnicoya" android:host="app" />
            </intent-filter>
            
            <!-- Deep Links específicos con esquema personalizado -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="tecnicoya" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>`;

fs.writeFileSync(manifestPath, newManifest);
console.log('✅ AndroidManifest.xml actualizado con permisos y deep links');

console.log('\n🎉 Configuración de Android completada!');
console.log('\nPróximos pasos:');
console.log('1. npx cap sync android');
console.log('2. npx cap open android');
console.log('3. Build → Build APK en Android Studio');
