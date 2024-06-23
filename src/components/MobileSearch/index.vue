<template>
	<span class="mobile-search">
		<el-row class="filter-container hidden-md-and-up" style="display: flex; align-items: center; padding: 10px">
			<el-col
				:span="20"
				v-if="searchOpen"
				style="display: flex; flex-direction: column; align-items: center"
			>
				<!-- <el-radio-group
					v-if="listQueryProps.type"
					v-model="listQueryProps.type"
					size="mini"
					class="filter-item"
				>
					<el-radio-button v-for="(value, key) in searchType" :key="key" :label="key">{{ value }}</el-radio-button>
				</el-radio-group>

				<label class="filter-item">
					ID
					<el-input
						v-model="listQueryProps.targetId"
						style="width: 200px"
						placeholder="請輸入"
					/>
				</label> -->

				<slot name="search-type"/>
				<slot name="search-ID"/>

				<label v-if="hidden" class="filter-item">
					起
					<el-date-picker
						v-model="dateRangeProps[0]"
						style="width: 200px"
						:type="type"
						placeholder="開始日期"
						:picker-options="{ firstDayOfWeek: 1, disabledDate: pickerOptions.disabledDate }"
						:clearable="false"
					/>
				</label>
				<label v-if="hidden" class="filter-item">
					迄
					<el-date-picker
						v-model="dateRangeProps[1]"
						style="width: 200px"
						:type="type"
						placeholder="結束日期"
						:picker-options="{ firstDayOfWeek: 1, disabledDate: pickerOptions.disabledDate }"
						:clearable="false"
					/>
				</label>
				<div>
					<el-tag v-for="(t, i) in pickerOptions.shortcuts" :key="i" size="mini" style="margin-right: 2px">
						<el-button
							type="text"
							size="mini"
							style="padding: 0"
							@click="dateShortcuts(i, shortcutType)"
						>{{ t.text }}</el-button>
					</el-tag>
				</div>
			</el-col>
			<el-col :span="4">
				<el-button
					:class="['filter-item', 'search-button', { 'search-open' : searchOpen }]"
					:type="searchOpen ? 'primary' : 'info'"
					icon="el-icon-search"
					:circle="!searchOpen"
					:plain="!searchOpen"
					@click="searchMobile()"
				/>
			</el-col>
		</el-row>
	</span>
</template>

<script>
import "element-ui/lib/theme-chalk/display.css";
import moment from 'moment'
import {
	pickerOptions,
	dateShortcuts,
	dateWatcher,
} from "@/utils/pickerOptions";

export default {
	name: 'mobile-search',
	props: {
		type: {
			type: String,
			default: 'date'
		},
		hasWeek: {
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
		},
		hidden: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			searchOpen: false,
			pickerOptions: pickerOptions(this.shortcutType, this.hasWeek),
		}
	},
	computed: {
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
		dateRangeProps() {
			dateWatcher(this.dateRangeProps);
		},
	},
	methods: {
		searchMobile() {
			if (this.searchOpen) {
				this.searchOpen = false;
				this.$emit('update:pageCurrent', 1);
				this.$emit('search');
			} else {
				this.searchOpen = true;
			}
		},
		dateShortcuts(index, shortcutType) {
			this.timeTabIdProps = index;
			this.dateRangeProps = dateShortcuts(index, shortcutType, this.hasWeek);
			this.$emit('update:pageCurrent', 1);
			// this.$emit('search');
		}
	},
}
</script>

<style lang="sass">
.mobile-search
	button.el-button.search-button
		width: 50px
		height: 50px
		font-size: 25px
		position: absolute
		right: 10px
		top: 0
		margin-top: -50px
		transition: 0.1s, height 0.01s ease-out, border-radius 0s
		&.search-open
			position: absolute
			max-width: 100px
			height: 100%
			padding: 0
			margin-top: 0
			margin: auto
	</style>