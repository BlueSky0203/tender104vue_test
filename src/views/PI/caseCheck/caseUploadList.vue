<template>
	<div class="app-container PI-case-upload-list" v-loading="loading">
		<h2>案件上傳結果</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>查報來源</span>
					</div>
					<el-select v-model.number="listQuery.caseType" popper-class="type-select">
						<el-option label="自巡" :value="1" />
						<el-option label="其他" :value="2" />
					</el-select>
				</div>
			</div>
			<el-select class="filter-item" v-model.number="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<span class="filter-item time-picker">
				<div style="font-size: 12px; color: #909399">成案日期</div>
				<el-date-picker
					class="filter-item"
					v-model="searchDate"
					type="date"
					placeholder="日期"
					:picker-options="pickerOptions"
					:clearable="false"
					@change="timeTabId = -1"
				/>
			</span>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>

			<el-button v-if="list.length > 0" class="filter-item" type="danger" icon="el-icon-delete" @click="delCase(0)">刪除</el-button>
			<!-- <el-button v-if="list.length == 0" class="filter-item" type="success" icon="el-icon-delete" @click="delCase(1)">恢復</el-button> -->
		</div>
		
		<h5 v-if="list.length != 0">查詢日期：{{ searchDateNow }}</h5>

		<aside>
			<span v-if="this.list.length != 0"> 案件數: {{ this.list.length }} </span>
		</aside>

		<!-- 案件列表 -->
		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			highlight-current-row
			:header-cell-style="{'background-color': '#F2F6FC'}"
			stripe
			style="width: 100%"
		>
			<el-table-column label="序號" type="index" width="55" align="center" />
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:width="['DistressSrc', 'organAssign'].includes(key) ? 75 : ['CaseDate', 'ReportDate'].includes(key) ? 150 : null"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column, $index }">
					<span v-if="[ 'UploadCaseNo' ].includes(column.property)">
						<el-link v-if="row[column.property]" :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link>
						<span v-else> - </span>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>

<script>
import moment from "moment";
import { getTypeMap } from "@/api/type";
import { getCaseList, delCaseList } from "@/api/PI";

export default {
	name: "PICaseUploadList",
	data() {
		return {
			loading: false,
			timeTabId: 1,
			showConfirm: false,
			showDemo: false,
			pickerOptions: {
				firstDayOfWeek: 1,
				shortcuts: [
					{
						text: "今日",
						onClick(picker) {
							const date = moment();
							picker.$emit("pick", date);
						},
					},
					{
						text: "昨日",
						onClick(picker) {
							const date = moment().subtract(1, "d");
							picker.$emit("pick", date);
						}
					},
					{
						text: "前日",
						onClick(picker) {
							const date = moment().subtract(2, "d");
							picker.$emit("pick", date);
						}
					}
				],
				disabledDate(date) {
					return moment(date).valueOf() >= moment().endOf("d").valueOf();
				},
			},
			searchDate: moment().startOf("d").subtract(1, "d"),
			searchDateNow: "",
			listQuery: {
				caseType: 1,
				zipCode: 104
			},
			headers: {
				UploadCaseNo: {
					name: "案件編號",
					sortable: true
				},
				DistressSrc: {
					name: "查報來源",
					sortable: false
				},
				CaseDate: {
					name: "成案日期",
					sortable: false,
				},
				ReportDate: {
					name: "通報日期",
					sortable: false,
				},
				DeviceType: {
					name: "設施類型",
					sortable: false
				},
				rDeviceType: {
					name: "認列類型",
					sortable: false
				},
				organAssign: {
					name: "機關交辦",
					sortable: false
				},
				CaseName: {
					name: "查報地點",
					sortable: false
				},
				CaseNo: {
					name: "來源編號",
					sortable: true
				},
				CaseType: {
					name: "損壞情形",
					sortable: false
				},
				BType: {
					name: "損壞態樣",
					sortable: false
				},
				BrokeType: {
					name: "損壞程度",
					sortable: false
				},
				// BrokeStatus: {
				// 	name: "損壞狀況",
				// 	sortable: false
				// },
				IsObserve: {
					name: "是否觀察",
					sortable: false
				}
			},
			list: [],
			districtList: {
				// 100: {
				// 	"name": "中正區",
				// },
				103: {
					"name": "大同區"
				},
				104: {
					"name": "中山區"
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
				BrokeType: {
					1: "輕",
					2: "中",
					3: "重"
				},
				// BrokeStatus: {
				// 	1: "觀察", //輕度
				// 	2: "短期改善", //中度
				// 	3: "立即改善", //重度
				// }
			}
		};
	},
	computed: { },
	created() {
		getTypeMap().then(response => {
			this.options.DeviceType = response.data.DeviceTypeMap;
			this.options.BType = response.data.BTypeMap;
		});
	},
	methods: {
		getList() {
			this.loading = true;

			let date = moment(this.searchDate).format("YYYY-MM-DD");
			this.searchDateNow = date;

			this.list = [];
			getCaseList({
				caseType: this.listQuery.caseType,
				zipCode: this.listQuery.zipCode,
				timeStart: date,
				timeEnd: moment(date).add(1, "d").format("YYYY-MM-DD"),
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.list = response.data.list;
					this.list.forEach(l => {
						if(l.ReportDate == undefined) l.ReportDate = l.CaseDate;
						l.DeviceType = Number(l.DeviceType);
						if(l.rDeviceType == undefined) l.rDeviceType = l.DeviceType;
						l.BType = Number(l.BType);
						l.BrokeType = Number(l.BrokeType);
						l.lat = Number(l.lat);
						l.lng = Number(l.lng);
					})
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		delCase(opType) {
			this.$confirm(`<p>確定刪除${this.searchDateNow} 共${this.list.length}件案件? <br/>(刪除後案件列表將<span style="color: #F56C6C">無法恢復</span>。)</p>`, "確認", { dangerouslyUseHTMLString: true, showClose: false }).then(() => {
				delCaseList( 0, {
					opType,
					timeStart: this.searchDateNow,
					timeEnd: moment(this.searchDateNow).add(1, "d").format("YYYY-MM-DD")
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						this.$message({
							message: "刪除成功",
							type: "success",
						});
						this.getList();
					} 
				}).catch(err => {
					console.log(err);
					this.getList();
				})
			})
		},
		formatter(row, column) {
			if([ 'organAssign', 'IsObserve' ].includes(column.property)) return row[column.property] == 1 ? '是' : '-';
			else if(['DeviceType', 'rDeviceType'].includes(column.property)) return this.options.DeviceType[row[column.property]];
			else if(column.property == 'BType') return this.options.BType[row[column.property]];
			else if(column.property == 'BrokeType') return this.options.BrokeType[row[column.property]];
			// else if(column.property == 'BrokeStatus') return this.options.BrokeStatus[row.BrokeType];
			else if(column.property.indexOf('Date') != -1) return row[column.property] ? this.formatTime(row[column.property]) : "-";
			else if(column.property.indexOf('Area') != -1) return Number(row[column.property]) ? row[column.property].toLocaleString() : "-";
			else return row[column.property] && row[column.property] != '0' ? row[column.property] : "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY/MM/DD");
		}
	}
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PI-case-upload-list
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
</style>