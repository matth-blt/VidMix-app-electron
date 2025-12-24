module.exports = {
    packagerConfig: {
        name: 'VidMix',
        executableName: 'VidMix',
        appBundleId: 'com.vidmix.app',
        appCategoryType: 'public.app-category.video',
        asar: true
    },
    rebuildConfig: {},
    makers: [
        // macOS DMG
        {
            name: '@electron-forge/maker-dmg',
            config: {
                name: 'VidMix',
                format: 'ULFO'
            }
        },
        // macOS ZIP (for auto-update)
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin']
        },
        // Windows Squirrel installer
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'VidMix'
            }
        },
        // Linux DEB
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    name: 'vidmix',
                    productName: 'VidMix',
                    genericName: 'Video Tools',
                    description: 'Video encoding, YouTube downloading, and frame extraction',
                    categories: ['AudioVideo', 'Video']
                }
            }
        },
        // Linux RPM
        {
            name: '@electron-forge/maker-rpm',
            config: {
                options: {
                    name: 'vidmix',
                    productName: 'VidMix',
                    description: 'Video encoding, YouTube downloading, and frame extraction',
                    categories: ['AudioVideo', 'Video']
                }
            }
        }
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {}
        }
    ]
};
