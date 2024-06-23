<template>
	<div class="app-container case-tracking-Static" v-loading="loading">
		<h2>判核分析</h2>
		<aside style="white-space: pre-line">
			僅列出「坑洞(全)、龜裂(重)」的案件。
		</aside>
		<div class="filter-container">
			<div v-if="listQuery.tenderRound > 0" class="filter-item">
				<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>合約</span>
					</div>
					<el-select v-model.number="listQuery.tenderRound" class="tender-select" popper-class="type-select tender">
						<el-option v-for="(val, type) in options.tenderRoundMap" :key="type" :label="val.name" :value="Number(type)">
							<div :style="`color: #${Math.floor(val.tenderId*16777215).toString(16).substr(0, 8)}`">{{ val.name }}</div>
						</el-option>
					</el-select>
				</div>
			</div>
			<el-button v-if="listQuery.tenderRound > 0" type="primary" @click="getList()">搜尋</el-button>
		</div>

		<!-- 資訊列表 -->
		<div class="panel-group">
			<el-row :gutter="40" type="flex" justify="space-around" align="center">
				<el-col :span="12" class="card-panel-col">
					<div class="card-panel">
						<!-- <div class="card-panel-icon-wrapper icon-form">
							<i class="el-icon-tickets" />
						</div> -->
						<div class="card-panel-description">
							<div class="card-panel-text">總案件數</div>
							<count-to :start-val="0" :end-val="Number(static.total) || 0" :duration="500" class="card-panel-num text-large" />
							<!-- <div class="card-panel-num text-large">{{ Number(static.total || 0).toLocaleString() }}</div> -->
						</div>
					</div>
				</el-col>
				<el-col :span="12" class="card-panel-col">
					<div class="card-panel">
						<!-- <div class="card-panel-icon-wrapper icon-star">
							<i class="el-icon-star-on" />
						</div> -->
						<div class="card-panel-description">
							<div class="card-panel-text">新增案件數(7日內)</div>
							<count-to :start-val="0" :end-val="Number(static.addCount) || 0" :duration="500" class="card-panel-num text-large" />
							<!-- <div class="card-panel-num text-large">{{ Number(static.addCount || 0).toLocaleString() }}</div> -->
						</div>
					</div>
				</el-col>
			</el-row>
			<el-row :gutter="40" type="flex" align="center">
				<el-col :span="6" class="card-panel-col">
					<div class="card-panel">
						<div class="card-panel-icon-wrapper icon-right">
							<i class="el-icon-caret-right" />
						</div>
						<div class="card-panel-description">
							<div class="card-panel-text">派工中</div>
							<div class="card-panel-num">{{ Number(static.workCount || 0).toLocaleString() }}</div>
						</div>
					</div>
					</el-col>
				<el-col :span="6" class="card-panel-col">
					<div class="card-panel">
						<div class="card-panel-icon-wrapper icon-succuss">
							<i class="el-icon-success" />
						</div>
						<div class="card-panel-description">
							<div class="card-panel-text">已完工</div>
							<div class="card-panel-num">{{ Number(static.finCount || 0).toLocaleString() }}</div>
						</div>
					</div>
				</el-col>
				<el-col :span="6" class="card-panel-col">
					<div class="card-panel">
						<div class="card-panel-icon-wrapper icon-error">
							<i class="el-icon-error" />
						</div>
						<div class="card-panel-description">
							<div class="card-panel-text">不需施作(含改判)</div>
							<div class="card-panel-num">{{ Number(static.rejectCount || 0).toLocaleString() }}</div>
						</div>
					</div>
				</el-col>
				<el-col :span="6" class="card-panel-col">
					<div class="card-panel">
						<div class="card-panel-icon-wrapper icon-warning">
							<i class="el-icon-warning" />
						</div>
						<div class="card-panel-description">
							<div class="card-panel-text">未審核</div>
							<div class="card-panel-num">{{ Number(static.unReportCount || 0).toLocaleString() }}</div>
						</div>
					</div>
				</el-col>
			</el-row>
		</div>
		<br>

		<!-- 暫不施作案件 -->
		<h4>不需施作(含改判)案件</h4>
		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			style="width: 100%"
		>
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				:width="value.width"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			/>
		</el-table>
	</div>
</template>

<script>
import CountTo from 'vue-count-to';
import moment from "moment";
import { getTenderRound, getDTypeMap } from "@/api/type";
import { getCaseTrackingStatic } from "@/api/inspection";

export default {
	name: "caseTrackingStatic",
	components: { CountTo },
	data() {
		return {
			loading: false,
			screenWidth: window.innerWidth,
			listQuery: {
				tenderRound: 91
			},
			headers: {
				CaseDetectionId: {
					name: "缺失Id",
					sortable: true,
				},
				DistressType: {
					name: "缺失類型",
					sortable: false
				},
				DistressLevel: {
					name: "損壞程度",
					sortable: false
				},
				FlowUName: {
					name: "回報人",
					sortable: false
				},
				FlowState: {
					name: "狀態",
					sortable: false
				},
				FlowDesc: {
					name: "原因",
					sortable: false
				}
			},
			static: {},
			list: [],
			options: {
				tenderRoundMap: {},
				DistressTypeFlat: {},
				DistressLevel: {
					1: "輕",
					2: "中",
					3: "重"
				},
				FlowStateMap: {
					1: '派工中',
					2: '完工',
					3: '不需施作',
					4: '改判'
				}
			}
		};
	},
	computed: { },
	watch: { },
	created() {
		getTenderRound({
			excludeShadow: true
		}).then(response => {
			this.options.tenderRoundMap = response.data.list.reduce((acc, cur) => {
				if(cur.tenderId <= 1001) return acc;

				let roundId = `${cur.tenderId}${String(cur.round).padStart(3, '0')}`;
				if(cur.zipCodeSpec != 0) roundId += `${cur.zipCodeSpec}`;

				let name = `${cur.tenderName}`;
				if(cur.title.length != 0) name += `_${cur.title}`;

				acc[roundId] = { 
					id: cur.id,
					name, 
					tenderId: cur.tenderId, 
					isMain: cur.zipCodeSpec == 0,
					zipCode: cur.zipCodeSpec == 0 ? cur.zipCode : cur.zipCodeSpec, 
					roundStart: cur.roundStart, 
					roundEnd: cur.roundEnd
				};
				return acc;
			}, {});

			if(Object.keys(this.options.tenderRoundMap).length > 0) {
				if(!Object.keys(this.options.tenderRoundMap).includes(String(this.listQuery.tenderRound))) {
					this.listQuery.tenderRound = this.$route.query.surveyId = Number(Object.keys(this.options.tenderRoundMap)[0]);
				}
			}
			if(Object.keys(this.options.tenderRoundMap).length == 0) {
				this.options.tenderRoundMap = { "-1": { id: -1 }};
				this.listQuery.tenderRound = -1;
			}
		});

		getDTypeMap().then(response => {
			this.options.DistressTypeFlat = Object.values(response.data.distressTypeMap).reduce((acc, cur) => {
				for (const key in cur) acc[key] = cur[key];
				return acc;
			}, {});
		})
	},
	mounted() { },
	methods: {
		getList() {
			this.loading = true;
			this.list = [];
			this.caseInfo = {};
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];

			getCaseTrackingStatic({
				surveyId: tenderRound.id
			}).then(response => {
				this.static = response.data.static;
				this.list = response.data.list;
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		formatter(row, column) {
			if (["DistressType"].includes(column.property)) return this.options.DistressTypeFlat[row.DistressType];
			else if (["DistressLevel"].includes(column.property)) return this.options.DistressLevel[row.DistressLevel];
			else if (["FlowState"].includes(column.property)) return this.options.FlowStateMap[row.FlowState];
			else return row[column.property] || "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD");
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.case-tracking-Static
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select.tender-select
				width: 400px
				.el-input__inner
					padding-left: 10px
					text-align: left
	.panel-group 
		position: sticky
		top: -20px
		background-color: rgba(#fff, 1)
		box-shadow: 0 5px 5px rgba(#eee, 0.1)
		width: 100%
		margin: 0 !important
		// transform: translateX(-15px)
		padding: 5px
		z-index: 2
		.card-panel 
			height: 125px
			font-size: 12px
			position: relative
			color: #666
			background: #fff
			box-shadow: 4px 4px 40px rgba(0, 0, 0, .05)
			border-color: rgba(0, 0, 0, .05)
			display: flex
			justify-content: space-around
			align-items: center
			.card-panel-icon-wrapper i
				font-size: 48px
			&:hover 
				.card-panel-icon-wrapper 
					color: #fff
				.icon-form
					background: #40c9c6
				.icon-star
					background: #36a3f7
				.icon-succuss
					background: #FFE66D
				.icon-error
					background: #1A535C
				.icon-right
					background: #FF9800
				.icon-warning
					background: #f4516c
			.icon-form
				color: #40c9c6
			.icon-star
				color: #36a3f7
			.icon-succuss
				color: #FFE66D
			.icon-error
				color: #1A535C
			.icon-right
				color: #FF9800
			.icon-warning
				color: #f4516c
			.card-panel-icon-wrapper 
				float: left
				margin: 14px 0 0 14px
				padding: 16px
				transition: all 0.38s ease-out
				border-radius: 6px
			.card-panel-icon 
				float: left
				font-size: 48px
			.card-panel-description 
				float: right
				font-weight: bold
				margin: 26px
				margin-left: 0px
				.card-panel-text 
					line-height: 18px
					color: rgba(0, 0, 0, 0.45)
					font-size: 16px
					margin-bottom: 12px
				.card-panel-num 
					font-size: 18px
					&.text-large
						font-size: 72px
</style>