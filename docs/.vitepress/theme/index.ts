import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import { Analytics } from '@vercel/analytics/vue'
import './style.css'

export default {
    extends: DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'layout-bottom': () => h(Analytics)
        })
    }
}
