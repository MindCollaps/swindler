import svgLoader from 'vite-svg-loader';

export default defineNuxtConfig({
    app: {
        head: {
            meta: [
                {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
                },
            ],
        },
    },
    nitro: {
        experimental: {
            websocket: true,
        },
    },
    compatibilityDate: '2025-12-12',
    devtools: { enabled: true },
    modules: [
        '@nuxt/devtools',
        '@nuxt/eslint',
        '@nuxtjs/stylelint-module',
        '@pinia/nuxt',
        '@nuxt/image',
        '@vueuse/motion/nuxt',
        '@nuxt/icon',
        '@nuxt/fonts',
        '@nuxt/scripts',
    ],
    eslint: {
        checker: {
            configType: 'flat',
        },
    },
    stylelint: {
        files: ['app/**/*.scss', 'app/**/*.css', 'app/**/*.vue'],
        emitError: true,
        emitWarning: true,
        failOnWarning: false,
        failOnError: false,
        lintOnStart: false,
        cache: false,
    },
    devServer: {
        port: 8080,
    },
    typescript: {
        typeCheck: true,
    },
    vite: {
        define: {
            global: 'globalThis',
        },
        css: {
            preprocessorMaxWorkers: true,
            preprocessorOptions: {
                scss: {
                    additionalData: `@use "~/scss/colors.scss" as *;@use "~/scss/variables.scss" as *;`,
                },
            },
        },
        resolve: {
            alias: {
                '.prisma/client/index-browser': './node_modules/.prisma/client/index-browser.js',
            },
        },
        plugins: [
            svgLoader({
                defaultImport: 'url',
                svgoConfig: {
                    plugins: [
                        {
                            name: 'preset-default',
                            params: {
                                overrides: {
                                    removeViewBox: false,
                                    cleanupIds: false,
                                    mergePaths: false,
                                },
                            },
                        },
                        'convertStyleToAttrs',
                        'reusePaths',
                        'removeDimensions',
                        {
                            name: 'convertColors',
                            params: {
                                currentColor: true,
                            },
                        },
                    ],
                },
            }),
        ],
    },
});
