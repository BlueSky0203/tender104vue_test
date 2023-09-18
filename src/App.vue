<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style lang="sass">
.type-select 
	.el-select-dropdown__item
		padding: 0 5px
		text-align: center
	&.tender .el-select-dropdown__item
		text-align: left
</style>