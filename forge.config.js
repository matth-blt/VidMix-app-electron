/**
 * @fileoverview Electron Forge Configuration
 * @description Build and packaging configuration for VidMix
 * @see https://www.electronforge.io/config/configuration
 */

module.exports = {
    /**
     * Electron Packager configuration
     * @type {Object}
     */
    packagerConfig: {
        name: 'VidMix',
        executableName: 'VidMix',
        appBundleId: 'com.vidmix.app',
        appCategoryType: 'public.app-category.video',
        asar: true
    },

    rebuildConfig: {},

    /**
     * Platform-specific installer makers
     * @type {Array}
     */
    makers: [
        {
            name: '@electron-forge/maker-dmg',
            config: {
                name: 'VidMix',
                format: 'ULFO'
            }
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin']
        },
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'VidMix'
            }
        },
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

    /**
     * Forge plugins
     * @type {Array}
     */
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {}
        }
    ]
};
