<template lang="html">
  <div class="tile is-parent is-paddingless is-2 hero is-fullheight" id="op-pane">
    <article class="tile is-child notification is-black">
      <p class="title" id="op-title">{{isEditing ? "OPERATION_PANE.EDITING":"OPERATION_PANE.DEFAULT" | translate }}</p>
      <p class="subtitle level" v-if="isEditing">
        <a class="level-left button is-danger is-small" @click="deleteOperation()"><icon fa="trash" /> <span>{{"DELETE" | translate}}</span></a>
        <a class="level-right button is-link is-small" @click="inheritOperation()"><icon fa="link" /> <span>{{"OPERATION_PANE.INHERIT" | translate}}</span></a>
      </p>
      <div class="content" id="op-content">
        <custom-field class="flex" fa="calendar">
          <input class="input " type="text"
            :placeholder="settings.dateFormat"
            v-model="newOperation.date"
            @keydown.up="addOneDay"
            @keydown.down="subtractOneDay"
            @keyup.enter="isEditing? confirmEdition():addOperation()">
        </custom-field>

        <custom-field class="flex" :fa="operationCurrency">
          <input class="input " type="number" placeholder="0.00" v-model="newOperation.amount" @keyup.enter="isEditing? confirmEdition():addOperation()">
        </custom-field>

        <custom-field class="flex" fa="bank" type="select is-primary">
          <select id="op-account" name="op-account" v-model="newOperation.selectedAccount">
            <option v-for="account in accounts" :value="account">{{account.name}}</option>
          </select>
        </custom-field>

        <div class="field has-addons flex" data='op-add-btn'>
          <div class="control">
            <a class="button is-primary is-tag" id="op-type-btn">
              <icon :fa="'fa-' + newOperation.type"/>
            </a>
          </div>
          <div class="control select is-primary" style="margin:0; flex:1">
            <select name="op-type" id="op-type" v-model="newOperation.type">
                <option value="" disabled>{{"OPERATION_TYPE.DEFAULT" | translate }}</option>
                <option value="credit-card">{{"OPERATION_TYPE.CREDIT_CARD" | translate }}</option>
                <option value="pencil-square-o">{{"OPERATION_TYPE.CHECK" | translate }}</option>
                <option value="money">{{"OPERATION_TYPE.CASH" | translate }}</option>
                <option value="exchange">{{"OPERATION_TYPE.TRANSFER" | translate }}</option>
                <option value="refresh">{{"OPERATION_TYPE.INTERNAL_TRANSFER" | translate }}</option>
                <option value="share">{{"OPERATION_TYPE.PERMANENT_TRANSFER" | translate }}</option>
                <option value="desktop">{{"OPERATION_TYPE.ELECTRONIC" | translate }}</option>
                <option value="paypal">PayPal</option>
                <option value="inbox">{{"OPERATION_TYPE.DEPOSIT" | translate }}</option>
                <option value="bank">{{"OPERATION_TYPE.BANK_CHARGE" | translate }}</option>
                <option value="stop-circle-o">{{"OPERATION_TYPE.DIRECT_LEVY" | translate }}</option>
              </select>
          </div>
        </div>

        <custom-field class="flex" fa="building-o">
          <input class="input typeahead " id="op-benef" type="text" :placeholder="'OPERATION_PANE.PLACEHOLDERS.BENEFICIARY' | translate" v-model="newOperation.beneficiary" @keyup.enter="isEditing? confirmEdition():addOperation()"/>
        </custom-field>

        <custom-field class="flex" fa="flag">
          <input class="input typeahead " id="op-cat" type="text" :placeholder="'OPERATION_PANE.PLACEHOLDERS.CATEGORY' | translate" v-model="newOperation.category" @keyup.enter="isEditing? confirmEdition():addOperation()"/>
        </custom-field>

        <custom-field class="flex" fa="tag">
          <input class="input typeahead " id="op-label" type="text" :placeholder="'OPERATION_PANE.PLACEHOLDERS.LABEL' | translate" v-model="newOperation.label" @keyup.enter="isEditing? confirmEdition():addOperation()"/>
        </custom-field>

        <div class="field is-grouped">
          <p class="control">{{"State" | translate }} :</p>
          <p class="control">
            <a class="button is-outlined is-primary is-small" @click="toggleState(newOperation.state)" v-model="newOperation.state" @keyup.enter="isEditing? confirmEdition():addOperation()">
              <icon size="is-small" :fa="newOperation.state"/>
            </a>
          </p>
          <div class="control field has-addons flex">
            <p class="control">
              <a  class="button is-outlined is-dark is-small" >
                <icon size="is-small" fa="fa-circle-o"/>
              </a>
            </p>
            <p class="control">
              <a  class="button is-outlined is-dark is-small" >
                <icon size="is-small" fa="fa-circle"/>
              </a>
            </p>
            <p class="control">
              <a  class="button is-outlined is-dark is-small" >
                <icon size="is-small" fa="fa-check-circle"/>
              </a>
            </p>
            <small v-model="helper"></small>
          </div>
        </div>

        <div class="level">
            <a class="level-left button is-small is-info is-outlined" id="op-add-btn" @click="isEditing? confirmEdition():addOperation()">
              <span id='op-confirm'>{{isEditing ? "OPERATION_PANE.EDIT":"OPERATION_PANE.ADD" | translate }}</span>
              <icon size="is-small" fa="fa-check-square-o"/>
            </a>
            <a class="level-right button is-small is-danger is-outlined" @click="cancelOperation()">
              <span>{{"CANCEL" | translate }}</span>
              <icon size="is-small" fa="fa-times"/>
            </a>
        </div>
      </div>
    </article>
  </div>
</template>

<script>
import icon from '@/components/common/icon'
import customField from '@/components/common/customField'

import {ipcRenderer} from 'electron'
import jsonfile from 'jsonfile'
import moment from 'moment'
import path from 'path'
import Vue from 'vue'

export default {
  name: 'operation-pane',
  components: {
    icon,
    customField
  },
  data: function () {
    return {
      isEditing: false,
      states: ['fa-circle-o', 'fa-circle', 'fa-check-circle'],
      helper: '-',
      settings: this.$root.settings,
      newOperation: {
        date: moment().format(this.$root.settings.dateFormat),
        selectedAccount: this.$root.accounts[0] || {currency: this.$root.settings.defaultCurrency},
        type: 'credit-card',
        state: 'fa-circle-o'
      }
    }
  },
  computed: {
    operationCurrency: function () {
      return this.newOperation.selectedAccount.currency
    },
    accounts: function () {
      return this.$root.accounts || null
    }
  },
  methods: {
    toggleState: function (state) {
      this.newOperation.state = this.states[(this.states.indexOf(state) === 2) ? 0 : this.states.indexOf(state) + 1]
    },

    addOneDay: function () {
      this.newOperation.date = moment(this.newOperation.date, this.$root.settings.dateFormat).add(1, 'days').format(this.$root.settings.dateFormat)
    },

    subtractOneDay: function () {
      this.newOperation.date = moment(this.newOperation.date, this.$root.settings.dateFormat).subtract(1, 'days').format(this.$root.settings.dateFormat)
    },

    addOperation: function () {
      // Go to right tab
      this.$root.$emit('toggle-tab', 1)
      // Format data
      let data = [
        this.newOperation.date,
        this.newOperation.state,
        this.newOperation.beneficiary,
        this.newOperation.category,
        this.newOperation.label,
        this.newOperation.amount,
        this.newOperation.type
      ]

      if (!this.settings.beneficiaries.find(b => b === this.newOperation.beneficiary) && this.newOperation.beneficiary !== '' && this.newOperation.beneficiary !== null) {
        this.settings.beneficiaries.push(this.newOperation.beneficiary)
      }
      if (!this.settings.labels.find(b => b === this.newOperation.label) && this.newOperation.label !== '' && this.newOperation.label !== null) {
        this.settings.labels.push(this.newOperation.label)
      }
      if (!this.settings.categories.find(b => b === this.newOperation.category) && this.newOperation.category !== '' && this.newOperation.category !== null) {
        this.settings.categories.push(this.newOperation.category)
      }
      jsonfile.writeFile(path.join(__static, 'settings.json'), this.settings, {
        spaces: 2
      }, function (err) {
        if (err != null) {
          console.error(err)
        }
      })
      this.$root.db.insertOperation(this.newOperation.selectedAccount.name, data, this.$root.settings.dateFormat)
      this.cleanOperation()
      this.$root.$emit('add-operation')
      this.$root.$emit('show-unsaved-tag')
    },

    inheritOperation: function () {
      let oldOperation = Vue.util.extend({}, this.newOperation)
      this.newOperation = {
        date: moment().format(this.$root.settings.dateFormat),
        state: 'fa-circle-o',
        beneficiary: oldOperation.beneficiary,
        category: oldOperation.category,
        label: oldOperation.label,
        amount: oldOperation.amount,
        type: oldOperation.type,
        selectedAccount: oldOperation.selectedAccount
      }
      this.isEditing = false
      this.$root.$emit('edit-operation:cancel')
    },

    deleteOperation: function () {
      let confirm
      const options = {
        type: 'warning',
        title: Vue.filter('translate')('WARNING'),
        message: Vue.filter('translate')('OPERATION_PANE.CONFIRM'),
        buttons: [Vue.filter('translate')('CONTINUE'), Vue.filter('translate')('CANCEL')],
        cancelId: 1
      }
      confirm = ipcRenderer.sendSync('warning', options)
      if (confirm === 0) {
        this.$root.db.deleteOperation(this.newOperation.id)
        this.endOperation('confirm')
        this.$root.$emit('show-unsaved-tag')
      }
    },

    endOperation: function (type) {
      this.cleanOperation()
      this.$root.$emit('edit-operation:' + type)
    },

    cleanOperation: function () {
      this.isEditing = false
      this.newOperation = {
        date: moment().format(this.$root.settings.dateFormat),
        selectedAccount: this.accounts[0],
        type: 'credit-card',
        state: 'fa-circle-o'
      }
    },

    cancelOperation: function () {
      this.endOperation('cancel')
    },

    editOperation: function (op) {
      this.newOperation = op
      this.newOperation.selectedAccount = this.accounts.find(a => a.name === op.selectedAccount.name)
      this.isEditing = true
    },
    confirmEdition: function () {
      if (this.newOperation.id) {
        let data = [
          this.newOperation.selectedAccount.name,
          this.newOperation.date,
          this.newOperation.state,
          this.newOperation.beneficiary,
          this.newOperation.category,
          this.newOperation.label,
          this.newOperation.amount,
          this.newOperation.type
        ]
        if (!this.settings.beneficiaries.find(b => b === this.newOperation.beneficiary) && this.newOperation.beneficiary !== '') {
          this.settings.beneficiaries.push(this.newOperation.beneficiary)
        }
        if (!this.settings.labels.find(b => b === this.newOperation.label) && this.newOperation.label !== '') {
          this.settings.labels.push(this.newOperation.label)
        }
        if (!this.settings.categories.find(b => b === this.newOperation.category) && this.newOperation.category !== '') {
          this.settings.categories.push(this.newOperation.category)
        }
        jsonfile.writeFile(path.join(__static, 'settings.json'), this.settings, {
          spaces: 2
        }, function (err) {
          if (err != null) {
            console.error(err)
          }
        })
        this.$root.db.editOperation(this.newOperation.id, data, this.$root.settings.dateFormat)
        this.endOperation('confirm')
      } else {
        console.warn('NO ID ON EDITION !')
      }
      // TODO : add typeahead categories (HTMLEventHandler.js:100)
    }
  },
  created: function () {
    this.$root.$on('update-accounts', function () { this.newOperation.selectedAccount = this.$root.accounts[0] })
    this.$root.$on('edit-operation', this.editOperation)
    this.$root.$on('edit-operation:clean', this.cleanOperation)

    this.$root.$on('update-accounts-list:success', this.$forceUpdate)
    // Typeahead
    // const typeahead = require('typeahead') // eslint-disable-line
    // const beneficiaryInput = document.getElementById('op-benef')
    // beneficiaryInput.typeahead({
    //   hint: true,
    //   highlight: true,
    //   minLenght: 1
    // }, {
    //   name: 'beneficiaries',
    //   source: substringMatcher(this.settings.beneficiaries)
    // })
  }
}
</script>
