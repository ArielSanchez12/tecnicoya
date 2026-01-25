# 📱 Tutorial: Generar APK de TécnicoYa

Este tutorial te guiará paso a paso para generar el APK de la aplicación TécnicoYa y desplegar el backend en la nube.

---

## ⚠️ IMPORTANTE: ¿Qué debo subir a la nube?

| Componente | ¿Subir a Railway/Render? | Razón |
|------------|--------------------------|-------|
| **Backend** | ✅ **SÍ** | Es el servidor API. La app necesita conectarse para login, datos, chat, etc. |
| **Frontend** | ❌ **NO** | Se empaqueta **dentro del APK**. No es una página web. |

```
┌─────────────────────┐
│   APK (Celular)     │
│  ┌───────────────┐  │
│  │   Frontend    │  │  ← Código dentro del APK
│  └───────┬───────┘  │
└──────────│──────────┘
           │ Internet
           ▼
┌─────────────────────┐
│  Backend (Nube)     │  ← Solo esto va a Railway/Render
│  - API REST         │
│  - Socket.io (chat) │
│  - MongoDB Atlas    │
└─────────────────────┘
```

---

## 📋 Requisitos Previos

### En tu computadora:
1. **Node.js** (v18 o superior)
2. **Android Studio** (con Android SDK)
3. **Java JDK 17** o superior
4. **Capacitor CLI** (`npm install -g @capacitor/cli`)

### Variables de entorno (Windows):
```
ANDROID_HOME = C:\Users\TU_USUARIO\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Java\jdk-17
```

Agregar al PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

---

## 🚀 Parte 1: Desplegar Backend en la Nube

### Opción A: Railway (Recomendado - Gratis)

1. **Crear cuenta** en [railway.app](https://railway.app)

2. **Nuevo proyecto desde GitHub:**
   - Click en "New Project" → "Deploy from GitHub repo"
   - Conecta tu repositorio
   - Selecciona la carpeta `/backend`

3. **Configurar variables de entorno:**
   ```
   MONGODB_URI=mongodb+srv://mako_db_user:0Eh5UMq1Ih216g7M@cluster0.eotgxh1.mongodb.net/tecnicoya?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRETO=secret
   CLOUDINARY_NOMBRE_NUBE=dlmtqn8tz
   CLOUDINARY_API_KEY=723215725128618
   CLOUDINARY_API_SECRET=dcAC_4gF_atp00QnaX0gH1YMWW8
   PUERTO=3000
   ENTORNO=produccion
   NODE_ENV=production
   URL_FRONTEND=https://tu-backend.up.railway.app
   EMAIL_USER=riveraariel433@gmail.com
   EMAIL_PASS=mvjommvjzsanfgyl
   ```

   > **Nota sobre URL_FRONTEND:** Esta variable se usa para los links en correos electrónicos.
   > - Como tu app es **solo APK**, los correos ya usan **deep links** (`tecnicoya://app/...`) que abren la app directamente.
   > - Puedes poner la misma URL del backend como fallback para usuarios que abran el link desde un navegador web.

4. **Configurar comando de inicio:**
   - En Settings → Start Command: `node src/servidor.js`

5. **Railway reiniciará automáticamente** si el proceso se cae.

### Opción B: Render (Alternativa gratuita)

1. **Crear cuenta** en [render.com](https://render.com)

2. **New Web Service** → Conectar GitHub

3. **Configuración:**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node src/servidor.js`

4. **Agregar las mismas variables de entorno**

### Opción C: Vercel + Serverless (Para APIs ligeras)

No recomendado para Socket.io, pero funciona para REST.

---

## 📱 Parte 2: Preparar el Frontend para Android

### Paso 1: Actualizar URL del backend

Edita `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://TU-BACKEND-RAILWAY.up.railway.app/api',
  socketUrl: 'https://TU-BACKEND-RAILWAY.up.railway.app'
};
```

### Paso 2: Compilar el proyecto

```bash
cd frontend

# Instalar dependencias si no lo has hecho
npm install

# Compilar para producción
npm run build
# o
ionic build --prod
```

### Paso 3: Agregar plataforma Android

```bash
# Agregar Android (esto crea la carpeta android/)
npx cap add android

# Sincronizar los archivos web con Android
npx cap sync android
```

### Paso 4: Configurar AndroidManifest.xml

Después de ejecutar `cap add android`, edita:
`android/app/src/main/AndroidManifest.xml`

Reemplaza el contenido con esto:

```xml
<?xml version="1.0" encoding="utf-8"?>
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
            
            <!-- Deep Links específicos -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="tecnicoya" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
```

### Paso 5: Crear archivo de seguridad de red

Crea `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
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
</network-security-config>
```

### Paso 6: Crear file_paths.xml

Crea `android/app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="." />
    <cache-path name="my_cache_images" path="." />
    <files-path name="my_files" path="." />
</paths>
```

---

## 🔗 Parte 3: Configurar Deep Links

### En el Backend (correos.js)

Actualiza los links en los correos para usar el esquema de la app:

```javascript
// Para registro
const linkConfirmacion = `tecnicoya://app/login?verificado=true`;

// Para recuperar contraseña  
const linkRecuperacion = `tecnicoya://app/recuperar-contrasena?token=${token}`;
```

### En el Frontend

Crea o edita `frontend/src/app/app.component.ts` para manejar deep links:

```typescript
import { Component, OnInit } from '@angular/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.initializeDeepLinks();
  }

  initializeDeepLinks() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const url = new URL(event.url);
      const path = url.pathname || url.host;
      
      console.log('Deep link recibido:', event.url);
      
      // Manejar rutas específicas
      if (path.includes('login')) {
        this.router.navigate(['/login']);
      } else if (path.includes('recuperar-contrasena')) {
        const token = url.searchParams.get('token');
        this.router.navigate(['/recuperar-contrasena'], { 
          queryParams: { token } 
        });
      } else if (path.includes('servicio')) {
        const id = path.split('/').pop();
        this.router.navigate(['/servicio', id]);
      }
    });
  }
}
```

---

## 📦 Parte 4: Generar el APK

### Opción A: APK de Debug (para pruebas)

```bash
cd frontend

# Sincronizar cambios
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

En Android Studio:
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Opción B: APK de Release (para distribución)

1. **Generar keystore** (solo una vez):
```bash
keytool -genkey -v -keystore tecnicoya-release.keystore -alias tecnicoya -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configurar signing** en `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('tecnicoya-release.keystore')
            storePassword 'TU_PASSWORD'
            keyAlias 'tecnicoya'
            keyPassword 'TU_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Generar APK release:**
```bash
cd android
./gradlew assembleRelease
```

El APK firmado estará en: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🧪 Parte 5: Probar la App

### En emulador:
```bash
npx cap run android
```

### En dispositivo físico:
1. Habilita "Opciones de desarrollador" en tu teléfono
2. Activa "Depuración USB"
3. Conecta por USB
4. Ejecuta: `npx cap run android --target=TU_DEVICE_ID`

Para ver dispositivos conectados:
```bash
adb devices
```

---

## 🔧 Solución de Problemas

### Error: MongoDB se desconecta frecuentemente
- El backend ya tiene reconexión automática configurada
- En Railway/Render, el servicio se reinicia automáticamente

### Error: CORS en móvil
- Ya está configurado para permitir `capacitor://` e `ionic://`
- Si usas IP local para pruebas, ya están permitidas las IPs privadas

### Error: Socket.io no conecta en móvil
- Verifica que `socketUrl` en environment.prod.ts apunte al backend correcto
- Asegúrate de usar HTTPS en producción

### Error: Geolocalización no funciona
- Verifica que los permisos estén en AndroidManifest.xml
- El usuario debe aceptar los permisos en la app

### Error: Cámara/Galería no funciona
- Verifica file_paths.xml y FileProvider en AndroidManifest.xml
- Los permisos de Android 13+ requieren READ_MEDIA_IMAGES

---

## 📝 Checklist Final

- [ ] Backend desplegado en Railway/Render
- [ ] Variables de entorno configuradas
- [ ] environment.prod.ts actualizado con URL del backend
- [ ] `ionic build --prod` ejecutado
- [ ] `npx cap sync android` ejecutado
- [ ] AndroidManifest.xml con todos los permisos
- [ ] network_security_config.xml creado
- [ ] file_paths.xml creado
- [ ] APK generado y probado

---

## 🎉 ¡Listo!

Tu app TécnicoYa está lista para ser instalada en dispositivos Android.

Para publicar en Google Play Store, necesitarás:
1. Cuenta de desarrollador de Google Play ($25 una vez)
2. APK firmado con release keystore
3. Screenshots y descripción de la app
4. Política de privacidad (URL)
