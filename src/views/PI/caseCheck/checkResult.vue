<template>
	<div class="app-container PI-case-check" v-loading="loading">
		<h2>稽核結果(自巡)</h2>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<span class="filter-item">
				<div style="font-size: 12px; color: #909399">通報日期</div>
				<time-picker class="filter-item" :hasWeek="false" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			</span>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>

			<el-popover
				placement="bottom"
				width="260"
				title="請選擇「輸出類型」?"
				v-model="showDlConfirm">
				<div style="text-align: center; margin: 0">
					<el-button-group>
						<el-button type="primary" @click="handleDownload()">稽核結果</el-button>
						<el-button type="primary" @click="downloadCaseList()">案件列表</el-button>
					</el-button-group>
				</div>
				<el-button
					slot="reference"
					class="filter-item"
					type="info"
					icon="el-icon-document"
					:disabled="resultList.length == 0"
				>輸出報表</el-button>
			</el-popover>
		</div>
		
		<h5 v-if="resultList.length != 0">查詢期間：{{ searchRange }}</h5>

		<!-- 資訊列表 -->
		<el-row :gutter="40" class="panel-group">
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-form">
						<svg-icon icon-class="form" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">廠商通報數</div>
						<div class="card-panel-num">{{ caseTotal }}</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-people">
						<svg-icon icon-class="people" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">監造抽查 (15%)</div>
						<div class="card-panel-num"> 
							路面: {{ checkNum.SV.AC.check || 0 }} <span class="fail-num">({{ checkNum.SV.AC.fail || 0 }})</span> / {{ checkNum.SV.AC.total || 0 }} 
							<br>
							設施: {{ checkNum.SV.facility.check || 0 }} <span class="fail-num">({{ checkNum.SV.facility.fail || 0 }})</span> / {{ checkNum.SV.facility.total || 0 }}
						</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-domain">
						<svg-icon icon-class="domain" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">機關抽查 (5%)</div>
						<div class="card-panel-num">
							路面: {{ checkNum.Organ.AC.check || 0 }} <span class="fail-num">({{ checkNum.Organ.AC.fail || 0 }})</span> / {{ checkNum.Organ.AC.total || 0 }} 
							<br>
							設施: {{ checkNum.Organ.facility.check || 0 }} <span class="fail-num">({{ checkNum.Organ.facility.fail || 0 }})</span> / {{ checkNum.Organ.facility.total || 0 }}
						</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-message-alert">
						<svg-icon icon-class="message-alert" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">不合格件數</div>
						<div class="card-panel-num">
							<span> {{ reasonTypeArr[1] }} <el-tooltip class="item" effect="dark" content="損壞情形說明與現況不符(PI1.2)" placement="bottom"><i class="icon-tooltip el-icon-warning" /></el-tooltip></span>	 / 
							<span> {{ reasonTypeArr[2] }} <el-tooltip class="item" effect="dark" content="損壞程度與現況不符(PI2.2)" placement="bottom"><i class="icon-tooltip el-icon-warning" /></el-tooltip></span>
						</div>
					</div>
				</div>
			</el-col>
		</el-row>

		<br />

		<!-- 抽查結果列表 -->
		<el-table
			empty-text="目前沒有資料"
			:data="resultList"
			border
			fit
			highlight-current-row
			:header-cell-style="{'background-color': '#F2F6FC'}"
			stripe
			style="width: 100%"
		>
			<el-table-column label="序號" type="index" width="100" align="center" />
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="column.property == 'UploadCaseNo'"> <el-link :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link></span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="不合格原因(監造)" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 32">{{ row.StateNotes.SV }}</span>
					<span v-else> - </span>
				</template>
			</el-table-column>
			<el-table-column label="不合格原因(機關)" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 64">{{ row.StateNotes.Organ }}</span>
					<span v-else> - </span>
				</template>
			</el-table-column>

			<!-- NOTE: 展示用，還未實作 -->
			<el-table-column label="操作" align="center">
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="info" plain size="mini" round disabled @click="showMap(row)">地圖</el-button>
				</template>
			</el-table-column>
		</el-table>
		<br>
	</div>
</template>

<script>
import moment from "moment";
import { getTypeMap } from "@/api/type";
import { getCaseList, getCheckResult } from "@/api/PI";
import TimePicker from '@/components/TimePicker';
import { dateWatcher } from "@/utils/pickerOptions";

export default {
	name: "PICaseCheck",
	components: { TimePicker },
	data() {
		return {
			loading: false,
			timeTabId: 1,
			showDlConfirm: false,
			caseTotal: 0,
			dateRange: [ moment().subtract(1, 'month').startOf("month").toDate(), moment().subtract(1, 'month').endOf("month").toDate() ],
			searchRange: "",
			zipCodeNow: 0,
			listQuery: {
				zipCode: 104
			},
			headers: {
				UploadCaseNo: {
					name: "案件編號",
					sortable: true
				},
				// CaseDate: {
				// 	name: "成案日期",
				// 	sortable: false,
				// },
				ReportDate: {
					name: "通報日期",
					sortable: false,
				},
				DeviceType: {
					name: "設施類型",
					sortable: true
				},
				organAssign: {
					name: "機關交辦",
					sortable: false
				},
				CaseName: {
					name: "地址",
					sortable: false
				},
				CaseNo: {
					name: "來源案號",
					sortable: true
				},
				// CaseType: {
				// 	name: "損壞情況",
				// 	sortable: false
				// },
				BType: {
					name: "損壞態樣",
					sortable: false
				},
				// BrokeType: {
				// 	name: "損壞程度",
				// 	sortable: false
				// },
				BrokeStatus: {
					name: "損壞狀況",
					sortable: false
				},
				PCIValue: {
					name: "PCI",
					sortable: false
				}
			},
			checkNum: {
				SV: { 
					AC: { check: 0, fail: 0, total: 0 }, 
					facility: { check: 0, fail: 0, total: 0 } 
				}, 
				Organ: { 
					AC: { check: 0, fail: 0, total: 0 }, 
					facility: { check: 0, fail: 0, total: 0 } 
				} 
			},
			resultList: [],
			districtList: {
				// 100: {
				// 	"name": "中正區"
				// },
				103: {
					"name": "大同區",
					"start": "2023/2/1"
				},
				104: {
					"name": "中山區",
					"start": "2022/6/1"
				},
				// 105: {
				// 	"name": "松山區"
				// },
				// 106: {
				// 	"name": "大安區"
				// },
				// 108: {
				// 	"name": "萬華區"
				// },
				// 110: {
				// 	"name": "信義區"
				// },
				// 111: {
				// 	"name": "士林區"
				// },
				// 112: {
				// 	"name": "北投區"
				// },
				// 114: {
				// 	"name": "內湖區"
				// },
				// 115: {
				// 	"name": "南港區"
				// },
				// 116: {
				// 	"name": "文山區"
				// }
			},
			options: {
				DeviceType: {},
				BType: {},
				// BrokeType: {
				// 	1: "輕度",
				// 	2: "中度",
				// 	3: "重度"
				// },
				BrokeStatus: {
					1: "觀察", //輕度
					2: "短期改善", //中度
					3: "立即改善", //重度
				},
				resultType: {
					1: "合格",
					2: "不合格"
				},
				reasonType: {
					1: "損壞情形說明與現況不符(PI1.2)",
					2: "損壞程度與現況不符(PI2.2)"
				},
			}
		};
	},
	computed: {
		reasonTypeArr() {
			let reasonTypeArr = { 1: 0, 2: 0 };
			this.resultList.forEach(l => {
				for(let type of Object.keys(this.options.reasonType)) {
					if((l.State & 32) && l.StateNotes.SV == this.options.reasonType[type]) reasonTypeArr[type]++;
					if((l.State & 64) && l.StateNotes.Organ == this.options.reasonType[type]) reasonTypeArr[type]++;
				}
			})
			return reasonTypeArr
		}
	},
	created() {
		getTypeMap().then(response => {
			this.options.DeviceType = response.data.DeviceTypeMap;
			this.options.BType = response.data.BTypeMap;
		});
		this.getList();
	},
	methods: {
		getList() {
			this.loading = true;
			dateWatcher(this.districtList[this.listQuery.zipCode].start, this.dateRange);
			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;
			this.resultList = [];
			this.checkNum = {
				unaccepted: { pass: 0, total: 0 },
				SV: { 
					AC: { check: 0, fail: 0, total: 0 }, 
					facility: { check: 0, fail: 0, total: 0 } 
				}, 
				Organ: { 
					AC: { check: 0, fail: 0, total: 0 }, 
					facility: { check: 0, fail: 0, total: 0 } 
				} 
			};

			getCheckResult({
				zipCode: this.listQuery.zipCode,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD")
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else this.resultList = response.data.list;

				this.zipCodeNow = this.listQuery.zipCode;
				this.caseTotal = response.data.caseTotal;
				Object.assign(this.checkNum, response.data.summary);
				this.checkNum.SV.AC.total = Math.round(this.caseTotal * 0.15 * 0.6, 0);
				this.checkNum.SV.facility.total = Math.round(this.caseTotal * 0.15 * 0.4, 0);
				this.checkNum.Organ.AC.total = Math.round(this.caseTotal * 0.05 * 0.6, 0);
				this.checkNum.Organ.facility.total = Math.round(this.caseTotal * 0.05 * 0.4, 0);

				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		formatter(row, column) {
			if(column.property == 'organAssign') return row[column.property] == 1 ? '是' : '-';
			else if(column.property == 'DeviceType') return this.options.DeviceType[row[column.property]];
			else if(column.property == 'BType') return this.options.BType[row[column.property]];
			// else if(column.property == 'BrokeType') return this.options.BrokeType[row[column.property]];
			else if(column.property == 'BrokeStatus') return this.options.BrokeStatus[row.BrokeType];
			else if(column.property.indexOf('Date') != -1) return row[column.property] ? this.formatTime(row[column.property]) : "-";
			else if(column.property.indexOf('Area') != -1) return Number(row[column.property]) ? row[column.property].toLocaleString() : "-";
			else return row[column.property] && row[column.property] != '0' ? row[column.property] : "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY/MM/DD");
		},
		handleDownload(list) {
			this.showDlConfirm = false;
			if(list == undefined) list = this.resultList;

			const tHeader = Object.values(this.headers).map(value => value.name).concat(["監造抽查", "機關抽查", "備註"]);
			const filterVal = Object.keys(this.headers).concat(["SVCheck", "OrganCheck", "Note"]);
			// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ];
			// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ];
			const dataList = JSON.parse(JSON.stringify(list)).map(l => {
				l.CaseDate = this.formatTime(l.CaseDate);
				l.ReportDate = this.formatTime(l.ReportDate);
				l.DeviceType = this.options.DeviceType[l.DeviceType];
				l.organAssign =  l.organAssign == 1 ? "是" : "";
				l.BType = this.options.BType[l.BType];
				// l.BrokeType = this.options.BrokeType[l.BrokeType];
				l.BrokeStatus = this.options.BrokeStatus[l.BrokeType];
				l.PCIValue = l.PCIValue == 0 ? "" : l.PCIValue;

				l.SVCheck = (l.State & 2) ? "V" : (l.State & 32) ? "X" : "";
				l.OrganCheck = (l.State & 4) ? "V" : (l.State & 64) ? "X" : "";

				l.Note = (l.State & 32) ? l.StateNotes.SV : (l.State & 64) ? l.StateNotes.Organ : "";
				return l
			}) 
			const data = this.formatJson(filterVal, dataList);

			import("@/vendor/Export2Excel").then((excel) => {
				excel.export_json_to_excel({
					header: tHeader,
					data
				});
			});
		},
		downloadCaseList() {
			this.showDlConfirm = false;
			this.loading = true;
			const startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			const endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");

			getCaseList({
				filterType: 1,
				caseType: 1,
				zipCode: this.zipCodeNow,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD")
			}).then(response => {
				this.handleDownload(response.data.list);
				this.loading = false;
			}).catch(err => {
				console.log(err);
				this.loading = false;
			})
		},
		formatJson(filterVal, jsonData) {
			return jsonData.map((v) => filterVal.map((j) => v[j]));
		},
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PI-case-check
	height: calc(100vh - 50px)
	overflow: scroll
	.filter-container 
		.el-select
			width: 110px
		.el-input__inner
			padding-left: 5px
			text-align: center
		.filter-item
			margin-right: 5px
		.time-picker 
			& > *
				margin-right: 5px
			.el-date-editor.el-input
				width: 165px
				.el-input__inner
					width: 155px
					padding: 0 10px
	.panel-group 
		position: sticky
		top: -20px
		display: flex
		align-items: center
		background-color: rgba(#fff, 1)
		box-shadow: 0 5px 5px rgba(#eee, 0.1)
		width: calc(100% + 40px)
		margin: 0 !important
		transform: translateX(-15px)
		padding: 5px
		// margin: 5px 0
		// margin-top: 18px
		z-index: 2
		.card-panel-col 
			position: relative
			margin: auto
		.card-panel 
			height: 125px
			font-size: 12px
			position: relative
			// overflow: hidden
			color: #666
			background: #fff
			box-shadow: 4px 4px 40px rgba(0, 0, 0, .05)
			border-color: rgba(0, 0, 0, .05)
			display: flex
			justify-content: space-around
			align-items: center
			&:hover 
				.card-panel-icon-wrapper 
					color: #fff
				.icon-form
					background: #40c9c6
				.icon-people
					background: #36a3f7
				.icon-domain
					background: #FF9800
				.icon-message-alert
					background: #f4516c
			.icon-form
				color: #40c9c6
			.icon-people
				color: #36a3f7
			.icon-domain
				color: #FF9800
			.icon-message-alert
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
					.fail-num
						color: #F56C6C
						// font-size: 20px
						vertical-align: text-top
				.icon-tooltip
					font-size: 16px
					color:  #606266
	.el-icon-edit
		color: #67C23A
		margin-bottom: 5px
		&:hover
			color: white
			background-color: #67C23A
			border-radius: 50%
	.el-icon-success
		margin-right: -10px
	.el-icon-error
		color: #F56C6C
	.el-select.edit-select
		width: 85px
		.el-input__inner
			padding-left: 3px
			padding-right: 10px
		.el-input__suffix
			right: 0
			margin-right: -3px
			transform: scale(0.7)
	.edit-number.el-input-number .el-input__inner
		padding: 0 10px
		text-align: left
	.btn-revoke
		padding: 5px 10px
		margin-left: 5px
	.el-dialog
		.el-dialog__body > div
			margin-top: 10px
		.el-select
			margin-top: 5px
			width: 250px
		.footer-btns
			display: flex
			justify-content: center
</style>