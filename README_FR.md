![VidMix Banner](https://github.com/user-attachments/assets/20b08280-e972-41db-af05-7f7e5fdec0eb)

# 🎬 VidMix

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33.x-47848F?logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)

Une application Electron moderne pour l'encodage vidéo, le téléchargement YouTube et l'extraction de frames.

## 📋 Fonctionnalités

- ✅ **Encodage Vidéo** - Encode avec H.264, H.265, VP9, AV1, ProRes, FFV1
- ✅ **Téléchargement YouTube** - Télécharge via yt-dlp (mode meilleure qualité auto)
- ✅ **Extraction de Frames** - Extrait les frames en PNG, TIFF ou JPEG
- ✅ **Infos Média** - Analyse détaillée des métadonnées via FFprobe
- ✅ **Assistant Premier Lancement** - Détection auto des binaires et téléchargement en un clic
- ✅ **Multi-Plateforme** - macOS, Windows et Linux

## 🚀 Installation

### Pour les Utilisateurs (Installeurs)
Téléchargez la dernière version depuis la page [Releases](https://github.com/matth-blt/VidMix-app-electron/releases) :
- **macOS** : Installeur `.dmg`
- **Windows** : Installeur NSIS `.exe` (choix du répertoire d'installation)
- **Linux** : `.deb`, `.rpm` ou `AppImage`

### Pour les Développeurs

#### Prérequis
- **Node.js 18+**
- **npm**

#### Installation
```bash
git clone https://github.com/matth-blt/VidMix-app-electron.git
cd VidMix-app-electron
npm install
npm start
```

## 📦 Structure du Projet

```
VidMix-app-electron/
├── main.js              # Processus principal Electron
├── preload.js           # Script preload fenêtre principale
├── renderer.js          # Renderer fenêtre principale
├── index.html           # Interface principale
├── setup.html           # Interface assistant de configuration
├── setup-renderer.js    # Logique assistant de configuration
├── setup-preload.js     # Preload assistant de configuration
├── forge.config.js      # Config Electron Forge
├── electron-builder.json # Config Electron Builder
├── css/
│   ├── app.css          # Styles principaux
│   ├── setup.css        # Styles assistant
│   ├── splash.css       # Styles écran de démarrage
│   ├── panel.css        # Styles composant panel
│   └── mediainfo.css    # Styles infos média
├── js/
│   ├── vidsencoder.js   # Module encodeur vidéo
│   ├── ytdownloader.js  # Module téléchargeur YouTube
│   ├── extract.js       # Module extracteur de frames
│   └── settings.js      # Module paramètres
└── tests/
    ├── setup.test.js    # Tests unitaires
    └── preview-setup.js # Script prévisualisation assistant
```

## 🎨 Fonctionnalités Détaillées

### 1️⃣ Vidsencoder
Encode des vidéos avec plusieurs codecs et conteneurs.
- **Codecs** : x264, x265, AV1, VP9, ProRes, FFV1 (Sans perte)
- **Conteneurs** : MKV, MP4, MOV, WebM
- **Options** : Mise à l'échelle, préréglages qualité
- **Progression** : Barre de progression en temps réel avec ETA

### 2️⃣ YTDownloader
Télécharge des vidéos YouTube avec options avancées.
- **Mode Auto** : Meilleure vidéo + audio fusionnés automatiquement
- **Mode Manuel** : Choix des formats vidéo/audio spécifiques
- **Toggles** : Vidéo seule, audio seul ou les deux
- **Métadonnées** : Miniatures, chapitres, sous-titres intégrés

### 3️⃣ Extracteur de Frames
Extrait toutes les images d'une vidéo.
- **Formats** : PNG (sans perte), TIFF (archive), JPEG (léger)
- **Organisation** : Création auto d'un dossier avec le nom de la vidéo
- **Qualité** : Filtres de mise à l'échelle haute qualité

### 4️⃣ Infos Média
Analyse les fichiers média avec FFprobe.
- Résolution, durée, FPS
- Codecs vidéo/audio
- Débit, taille du fichier, format pixel

## 🛠️ Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Démarrer en mode développement |
| `npm test` | Lancer les tests Jest |
| `npm run preview-setup` | Prévisualiser l'assistant |
| `npm run package` | Empaqueter l'app (Electron Forge) |
| `npm run make` | Créer les installeurs (Electron Forge) |
| `npm run build` | Builder toutes plateformes (Electron Builder) |
| `npm run build:mac` | Builder macOS (.dmg, .zip) |
| `npm run build:win` | Builder Windows (NSIS .exe) |
| `npm run build:linux` | Builder Linux (.deb, .rpm, AppImage) |

## 🔧 Binaires Requis

VidMix détecte et télécharge automatiquement ces binaires :
- **FFmpeg** - Encodage/décodage vidéo
- **FFprobe** - Analyse média
- **yt-dlp** - Téléchargement YouTube

Les binaires peuvent être installés système (Homebrew, apt, etc.) ou téléchargés via Paramètres.

## 🤝 Contribution

1. Fork le dépôt
2. Créer une branche feature (`git checkout -b feature/super-feature`)
3. Commit les changements (`git commit -m 'Ajouter feature'`)
4. Push sur la branche (`git push origin feature/super-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Licence MIT - voir [LICENSE](LICENSE) pour les détails.

## 🙏 Remerciements

- [FFmpeg](https://ffmpeg.org/) - Traitement vidéo
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Téléchargement YouTube
- [Electron](https://www.electronjs.org/) - Framework desktop
- [Enhancr](https://github.com/mafiosnik777/enhancr) - UI/UX Inspiration
