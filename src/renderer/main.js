import Vue from 'vue'
import axios from 'axios'

// CSS
import 'bulma/css/bulma.css'
import 'bulma-extensions/dist/bulma-extensions.min.css'
import 'font-awesome/css/font-awesome.css'
// Components
import App from '@/App'
// nodeModules
import jsonfile from 'jsonfile'
import path from 'path'
import i18njs from 'i18njs'
import moment from 'moment'
import {ipcRenderer} from 'electron'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

let globSettings = jsonfile.readFileSync(path.join(__static, 'settings.json'))

const lang = jsonfile.readFileSync(`${__static}/lang/${globSettings.language}_.json`)
i18njs.add(globSettings.language, '', lang)
i18njs.setLang(globSettings.language)

Vue.filter('translate', (value, option) => {
  if (!value) return ''
  value = value.toString()
  if (i18njs.has('.RENDERER.' + value)) return i18njs.get('.RENDERER.' + value, option)
  if (i18njs.has('.COMMON.' + value)) return i18njs.get('.COMMON.' + value, option)
  return i18njs.get(value, option)
})
Vue.filter('date', (value) => {
  let formattedMoment = moment(value).format(globSettings.dateFormat)
  return formattedMoment
})

/* eslint-disable no-new */
new Vue({
  components: { App },
  template: '<App/>',
  data: function () {
    return {
      settings: globSettings,
      accounts: [],
      unsaved: false,
      db: null
    }
  },
  methods: {
    // Functions
    updateSQL: function (sqlType) {
      switch (sqlType) {
        case 'dashboard':
          ipcRenderer.send('tab-update', 0)
          break
        case 'accounts-detail':
          ipcRenderer.send('tab-update', 1)
          break
        case 'recurrings':
          ipcRenderer.send('tab-update', 2)
          break
        default:
          ipcRenderer.send('tab-update', 0)
      }
    }
  },
  mounted: function () {
    // Sets locale
    moment.locale(globSettings.language)
  }
}).$mount('#app')
