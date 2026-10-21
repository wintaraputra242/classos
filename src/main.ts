import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import 'remixicon/fonts/remixicon.css'
import { setupTwemoji } from './plugins/twemoji'
// import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// ✅ Emoji konsisten di semua browser/OS — lihat plugins/twemoji.ts
setupTwemoji()

// registerSW({ immediate: true })
