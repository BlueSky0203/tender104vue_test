<script>
export default {
	name: 'MenuItem',
	functional: true,
	props: {
		icon: {
			type: String,
			default: ''
		},
		title: {
			type: String,
			default: ''
		},
		vTag: {
			type: String,
			default: ''
		},
		isNew: {
			type: Boolean,
			default: false
		}
	},
	render(h, context) {
		const { icon, title, vTag, isNew } = context.props
		const vnodes = []

		if (icon) {
			if (icon.includes('el-icon')) {
				vnodes.push(<i class={[icon, 'sub-el-icon']} />)
			} else {
				vnodes.push(<svg-icon icon-class={icon}/>)
			}
		}

		if (title) {
			if (vTag) {
				vnodes.push(<span slot='title'>{(title)} <span class="item-marker vTag">({vTag})</span></span>)
			} else if (isNew) {
				vnodes.push(<span slot='title'>{(title)} <span class="item-marker new">NEW!!</span></span>)
			} else {
				vnodes.push(<span slot='title'>{(title)}</span>)
			}
		}

		return vnodes
	}
}
</script>

<style scoped lang="sass">
.sub-el-icon
	color: currentColor
	width: 1em
	height: 1em

.item-marker 
	font-style: italic
	font-size: 12px
	&.new
		font-weight: bold
		color: #E6A23C
	&.vTag
		text-decoration: underline
		color: #F56C6C
</style>