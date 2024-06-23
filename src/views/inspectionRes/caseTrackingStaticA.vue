<template>
	<div class="app-container case-tracking-StaticA" v-loading="loading">
		<h2>判核分析(全)</h2>
		<aside style="white-space: pre-line">
			僅列出「坑洞(全)、龜裂(重)」的案件。
		</aside>

		<!-- 資訊列表 -->
		<el-row :gutter="40">
			<el-col :span="8" v-for="dist in options.zipCodeArr" :key="dist.zipCode">
				<el-row class="panel-group">
					<el-col :span="6" class="panel-dist">
						<div class="dist-text">{{ dist.tenderName }}</div>
						<el-select v-model.number="listQuery.tenderRound[dist.zipCode]" class="tender-select"
							popper-class="type-select tender" size="small" @change="getList(dist.zipCode)">
							<el-option v-for="(val, type) in options.tenderRoundMap[dist.zipCode]" :key="type" :label="val.name"
								:value="Number(type)">{{ val.name }}</el-option>
						</el-select>
					</el-col>
					<el-col :span="18">
						<el-row type="flex" justify="space-around" align="center">
							<el-col :span="12">
								<div class="card-panel">
									<div class="card-panel-description">
										<div class="card-panel-text">總案件數</div>
										<count-to :start-val="0" :end-val="Number(static[dist.zipCode] ? static[dist.zipCode].total : 0)" :duration="500" class="card-panel-num text-large" />
									</div>
								</div>
							</el-col>
							<el-col :span="12">
								<div class="card-panel">
									<div class="card-panel-description">
										<div class="card-panel-text">7日內新增</div>
										<count-to :start-val="0" :end-val="Number(static[dist.zipCode] ? static[dist.zipCode].addCount : 0)" :duration="500" class="card-panel-num text-large" />
									</div>
								</div>
							</el-col>
						</el-row>
						<el-row type="flex" align="center">
							<el-col :span="6">
								<div class="card-panel small">
									<div class="card-panel-description">
										<div class="card-panel-text">派工中</div>
										<div class="card-panel-num">{{ Number(static[dist.zipCode] ? static[dist.zipCode].workCount : 0).toLocaleString() }}</div>
									</div>
								</div>
							</el-col>
							<el-col :span="6">
								<div class="card-panel small">
									<div class="card-panel-description">
										<div class="card-panel-text">已完工</div>
										<div class="card-panel-num">{{ Number(static[dist.zipCode] ? static[dist.zipCode].finCount : 0).toLocaleString() }}</div>
									</div>
								</div>
							</el-col>
							<el-col :span="6" class="card-panel-col">
								<div class="card-panel small">
									<div class="card-panel-description">
										<div class="card-panel-text">不需施作</div>
										<div class="card-panel-num">{{ Number(static[dist.zipCode] ? static[dist.zipCode].rejectCount : 0).toLocaleString() }}</div>
									</div>
								</div>
							</el-col>
							<el-col :span="6" class="card-panel-col">
								<div class="card-panel small">
									<div class="card-panel-description">
										<div class="card-panel-text">未審核</div>
										<div class="card-panel-num">{{ Number(static[dist.zipCode] ? static[dist.zipCode].unReportCount : 0).toLocaleString() }}</div>
									</div>
								</div>
							</el-col>
						</el-row>
						<el-row type="flex" style="justify-content: center;">
							<time-picker :hasYear="false" :shortcutType="'year'" :timeTabId.sync="timeTabId[dist.zipCode]" :dateRange.sync="dateRange" @search="getTimePickerList(dist.zipCode)" />
							<el-button icon="el-icon-search" type="success" size="mini" @click="getTimePickerList(dist.zipCode)" plain />
						</el-row>
					</el-col>
				</el-row>
			</el-col>
		</el-row>
	</div>
</template>

<script>
import CountTo from 'vue-count-to';
import moment from "moment";
import { getTenderRound } from "@/api/type";
import { getCaseTrackingStatic, getCaseTrackingStaticTime } from "@/api/inspection";
import TimePicker from '@/components/TimePicker';

export default {
	name: "caseTrackingStaticA",
	components: { CountTo, TimePicker },
	data() {
		return {
			dateRange: [moment().startOf("week").add(1, 'day').toDate(), moment().endOf("week").add(1, 'day').toDate()],
			timeTabId: {},
			loading: false,
			screenWidth: window.innerWidth,
			listQuery: {
				tenderRound: {}
			},
			static: {},
			list: [],
			options: {
				zipCodeArr: [],
				tenderRoundMap: {}
			}
		};
	},
	computed: {},
	watch: {},
	async created() {
		getTenderRound({
			excludeShadow: true
		}).then(async (response) => {
			this.options.zipCodeArr = [];
			this.options.tenderRoundMap = response.data.list.reduce((acc, cur) => {
				if (cur.tenderId <= 1001) return acc;

				const zipCode = cur.zipCodeSpec == 0 ? cur.zipCode : cur.zipCodeSpec;
				if (acc[zipCode] == undefined) {
					this.options.zipCodeArr.push({ tenderName: cur.tenderName.replace("區", ""), zipCode: cur.zipCode })
					acc[zipCode] = {};
					this.listQuery.tenderRound[zipCode] = {};
					this.timeTabId[zipCode] = -1;
				}

				let roundId = `${cur.tenderId}${String(cur.round).padStart(3, '0')}`;
				if (cur.zipCodeSpec != 0) roundId += `${cur.zipCodeSpec}`;

				acc[zipCode][roundId] = {
					id: cur.id,
					name: cur.title,
					tenderId: cur.tenderId,
					tenderName: cur.tenderName,
					isMain: cur.zipCodeSpec == 0,
					zipCode
				};
				return acc;
			}, {});

			for (const dist of this.options.zipCodeArr) {
				if (Object.keys(this.options.tenderRoundMap[dist.zipCode]).length > 0) {
					if (!Object.keys(this.options.tenderRoundMap[dist.zipCode]).includes(String(this.listQuery.tenderRound[dist.zipCode]))) {
						this.listQuery.tenderRound[dist.zipCode] = Number(Object.keys(this.options.tenderRoundMap[dist.zipCode])[Object.keys(this.options.tenderRoundMap[dist.zipCode]).length - 1]);
					}
					await this.getList(dist.zipCode);

				}
				if (Object.keys(this.options.tenderRoundMap[dist.zipCode]).length == 0) {
					this.options.tenderRoundMap[dist.zipCode] = { "-1": { id: -1 } };
					this.listQuery.tenderRound[dist.zipCode] = -1;
				}
			}
		});
	},
	mounted() { },
	methods: {
		async getList(zipCode) {
			this.loading = true;
			this.list = [];
			this.static[zipCode] = {};
			const tenderRound = this.options.tenderRoundMap[zipCode][this.listQuery.tenderRound[zipCode]];

			await getCaseTrackingStatic({
				surveyId: tenderRound.id
			}).then(response => {
				this.static[zipCode] = response.data.static;
				this.list[zipCode] = response.data.list;
				this.loading = false;
			}).catch(err => this.loading = false);

		},
		async getTimePickerList(zipCode) {
			this.loading = true;
			this.list = [];
			this.static[zipCode] = {};
			const tenderRound = this.options.tenderRoundMap[zipCode][this.listQuery.tenderRound[zipCode]];
			console.log(tenderRound);

			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).add(1, "days").format("YYYY-MM-DD");

			await getCaseTrackingStaticTime({
				surveyId: tenderRound.id,
				startDate: startDate,
				endDate: endDate
			}).then(response => {
				this.static[zipCode] = response.data.static;
				this.$forceUpdate()
				this.loading = false;
			}).catch(err => this.loading = false);

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
.case-tracking-StaticA
	.panel-group 
		border: 1px solid #C0C4CC
		border-radius: 8px
		margin-bottom: 10px
		overflow: hidden
		.panel-dist
			display: flex
			flex-direction: column
			justify-content: center
			height: 196px
			margin: auto 0
			box-shadow: inset -2px 0 2px rgba(#E6E8EB, 0.4)
			background-color: #D4D7DE
			.dist-text
				width: 100%
				writing-mode: vertical-lr
				color: #F5F7FA
				font-size: 46px
				line-height: 70px
				margin: 10px 0
			.el-select.tender-select
				width: 100%
				.el-input__inner
					padding-left: 10px
					text-align: center
					border-radius: 0
		.card-panel 
			height: 86px
			font-size: 12px
			position: relative
			color: #666
			border-color: rgba(0, 0, 0, .05)
			display: flex
			justify-content: space-around
			align-items: center
			&.small
				height: 56px
			.card-panel-description 
				float: right
				font-weight: bold
				text-align: center
				.card-panel-text 
					line-height: 16px
					color: rgba(0, 0, 0, 0.45)
					font-size: 16px
					margin-bottom: 6px
				.card-panel-num 
					font-size: 16px
					&.text-large
						font-size: 48px
</style>