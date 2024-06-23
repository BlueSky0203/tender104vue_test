<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
	mounted() {
		this.vhCheck();
		window.addEventListener('resize', this.vhCheck);
	},
	methods: {
		vhCheck() {
			let vh = window.innerHeight * 0.01;
			// Then we set the value in the --vh custom property to the root of the document
			document.documentElement.style.setProperty('--vh', `${vh}px`);
		}
	}
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