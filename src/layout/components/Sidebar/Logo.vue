<template>
  <div class="sidebar-logo-container" :class="{'collapse':collapse}">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo">
        <h1 v-else class="sidebar-title">{{ title }}</h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo">
        <h1 class="sidebar-title">{{ title }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script>
const defaultSettings = require('@/settings.js');

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      title: defaultSettings.title,
      logo: `favicon.ico`
    }
  },
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #2b2f3a;
  text-align: center;
  overflow: hidden;
  transition: 0.5s;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;

    & .sidebar-logo {
      display: none;
      width: 32px;
      height: 32px;
      vertical-align: middle;
			filter: invert(100%);
      // margin-right: 12px;
      // margin-left: -28px;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      letter-spacing: 4px;
      color: #fff;
      font-weight: 600;
      line-height: 50px;
      font-size: 16px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
      vertical-align: middle;
    }
  }

  &.collapse {
    .sidebar-logo {
      display: inline;
      margin-right: 0px;
      margin-left: 0px;
      position: absolute;
      left: 50%;
      transform: translate(-50%, 15%);
      z-index: 1;
    }
    .sidebar-guild {
      position: absolute;
      height: 15px;
      width: 32px;
      background-color: #ffe7b1;
      border-radius: 0 0 2px 2px;
      bottom: 3px;
      left: 50%;
      transform: translate(-50%, 60%);
      font-size: 10px;
      text-align: center;
      line-height: 18px;
      color: #666;
    }
  }
}
</style>
