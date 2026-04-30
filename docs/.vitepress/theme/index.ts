import DefaultTheme from 'vitepress/theme'
import { inject } from '@vercel/analytics'
import './style.css'

export default {
    extends: DefaultTheme,
    enhanceApp() {
        inject()
    },
}
