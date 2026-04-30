import { defineConfig } from 'vitepress'

export default defineConfig({
    vite: {
        configFile: false,
        resolve: {
            preserveSymlinks: true,
        },
    },
    title: 'Vitest Code Coverage Report',
    description:
        'Modern self-hosted viewer for Vitest / Istanbul / V8 coverage-final.json — donuts, folder tree, source drill-down and insights.',
    cleanUrls: true,
    lastUpdated: true,
    lang: 'en-US',
    head: [
        ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
        ['meta', { name: 'theme-color', content: '#4f46e5' }],
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:title', content: 'Vitest Code Coverage Report' }],
        [
            'meta',
            {
                property: 'og:description',
                content:
                    'Modern self-hosted viewer for Vitest / Istanbul / V8 coverage-final.json with donuts, folder tree, source drill-down and insights.',
            },
        ],
        ['meta', { property: 'og:image', content: '/hero.svg' }],
    ],
    themeConfig: {
        logo: { light: '/logo.svg', dark: '/logo-dark.svg' },
        siteTitle: 'Vitest Coverage Report',
        nav: [
            { text: 'Guide', link: '/guide/getting-started' },
            { text: 'CLI', link: '/guide/cli' },
            { text: 'Changelog', link: '/changelog' },
            {
                text: 'v1.2.6',
                items: [
                    {
                        text: 'NPM',
                        link: 'https://www.npmjs.com/package/vitest-code-coverage-report',
                    },
                    {
                        text: 'Releases',
                        link: 'https://github.com/andreiculda/vitest-code-coverage-report/releases',
                    },
                ],
            },
        ],
        sidebar: {
            '/guide/': [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'What is it?', link: '/guide/introduction' },
                        { text: 'Getting Started', link: '/guide/getting-started' },
                    ],
                },
                {
                    text: 'Usage',
                    items: [
                        { text: 'CLI Reference', link: '/guide/cli' },
                        { text: 'Configuration', link: '/guide/configuration' },
                        { text: 'Features', link: '/guide/features' },
                    ],
                },
                {
                    text: 'Hosting',
                    items: [
                        { text: 'Deploy the docs', link: '/guide/deploy-docs' },
                    ],
                },
            ],
        },
        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/andreiculda/vitest-code-coverage-report',
            },
            {
                icon: 'npm',
                link: 'https://www.npmjs.com/package/vitest-code-coverage-report',
            },
        ],
        search: {
            provider: 'local',
        },
        editLink: {
            pattern:
                'https://github.com/andreiculda/vitest-code-coverage-report/edit/main/docs/:path',
            text: 'Edit this page on GitHub',
        },
        footer: {
            message: 'Released under the GPL-3.0-or-later License.',
        },
    },
})
