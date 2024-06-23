<template>
	<span class="time-picker">
		<el-button-group v-if="!dateTimePickerVisible">
			<el-button
				v-for="(t, i) in pickerOptions.shortcuts"
				:key="i"
				type="primary"
				:plain="i != timeTabIdProps"
				size="mini"
				@click="dateShortcuts(i, shortcutType)"
			>{{ t.text }}</el-button>
		</el-button-group>
		<el-date-picker
			v-else
			class="filter-item"
			v-model="dateRangeProps"
			:type="type+'range'"
			range-separator="至"
			start-placeholder="開始日期"
			end-placeholder="結束日期"
			:picker-options="pickerOptions"
			:default-time="['00:00:00', '23:59:59']"
			:clearable="false"
			size="mini"
			style="width: 210px;"
			@change="timeTabIdProps = -1"
		/>
		<el-button
			:type="dateTimePickerVisible ? 'info' : 'primary'"
			plain
			size="mini"
			@click="dateTimePickerVisible = !dateTimePickerVisible"
		>{{ dateTimePickerVisible ? '返回' : '進階' }}</el-button>
	</span>
</template>

<script>
import { pickerOptions, dateShortcuts, dateWatcher } from "@/utils/pickerOptions";

export default {
	name: 'time-picker',
	props: {
		type: {
			type: String,
			default: 'date'
		},
		dateStart: {
			type: String,
			default: '2022/6/1'
		},
		timeTabId: {
			required: true,
			type: Number
		},
		disabledDate: {
			type: Boolean,
			default: true
		},
		hasWeek: {
			type: Boolean,
			default: true
		},
		hasYear: {
			type: Boolean,
			default: true
		},
		shortcutType: {
			type: String,
			default: 'year'
		},
		dateRange: {
			required: true,
			type: Array
		},
		pageCurrent: {
			type: Number,
			default: 1
		}
	},
	data() {
		return {
			dateTimePickerVisible: false,
			pickerOptions: pickerOptions(this.shortcutType, this.dateStart, this.hasWeek, this.hasYear, this.disabledDate),
		}
	},
	computed: {
		timeTabIdProps: {
			get() {
				return this.timeTabId
			},
			set(val) {
				this.$emit('update:timeTabId', val)
			}
		},
		dateRangeProps: {
			get() {
				return this.dateRange
			},
			set(val) {
				this.$emit('update:dateRange', val)
			}
		}
	},
	watch: {
		dateRangeProps(newValue, oldValue) {
			if(this.disabledDate) dateWatcher(this.dataStart, newValue);
		},
	},
	methods: {
		dateShortcuts(index, shortcutType) {
			this.timeTabIdProps = index;
			this.dateRangeProps = dateShortcuts(index, shortcutType, this.dataStart, this.hasWeek, this.hasYear);
			this.$emit('update:pageCurrent', 1);
			this.$emit('search');
		}
	},
}
</script>

<style lang="sass">
	.time-picker
		.el-input__icon.el-range__close-icon
			display: none
	.time-picker > *
		margin-right: 5px
</style>