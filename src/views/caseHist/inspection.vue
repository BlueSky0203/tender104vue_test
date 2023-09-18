<template>
	<div class="app-container iCase-list" v-loading="loading">
		<h2>分派紀錄</h2>
		<aside>「{{ districtList[zipCodeNow].name }}」資料初始為 {{ tenderStartDate }}</aside>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<el-select class="filter-item" v-model="listQuery.caseType" :disabled="Object.keys(options.caseType).length <= 1">
				<el-option v-for="type in options.caseTypeOrder" :key="type" :label="options.caseType[type].name" :value="Number(type)" />
			</el-select>
			<span class="filter-item">
				<div style="font-size: 12px; color: #909399">分派日期</div>
				<time-picker class="filter-item" :dateStart="districtList[listQuery.zipCode].start" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			</span>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
			<el-button
				class="filter-item"
				type="info"
				icon="el-icon-document"
				:circle="screenWidth<567"
				@click="handleDownload"
			>輸出報表</el-button>
		</div>
		
		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

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
			<el-table-column label="序號" type="index" width="100" align="center" />
			
			<!-- <el-table-column 
				v-for="header in Object.keys(headers['fixed'])" :prop="header" :label="headers[reportCate]['fixed'][header]"
			align="center" fixed/>-->
			<el-table-column
				v-for="(value, key) in headersFilter"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot="header" slot-scope="{ column }">
					<span v-if="column.property == 'actualFinishDate' && [11, 12].includes(caseTypeNow)">熱再生完工日期</span>
					<span v-else-if="column.property == 'actualFinishDate' && [2, 3].includes(caseTypeNow)">實際完工日期</span>
					<span v-else>{{ column.label }}</span>
				</template>
				<template slot-scope="{ row, column }">
					<span v-if="column.property == 'CaseNo'"> <el-link :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link></span>
					<span v-else-if="column.property == 'organAssign'">
						<span v-if="row[column.property] == 1">是</span>
						<span v-else> - </span>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>

			<!-- NOTE: 展示用，還未實作 -->
			<el-table-column label="操作" align="center">
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="info" plain size="mini" round disabled @click="showMap(row)">地圖</el-button>
				</template>
			</el-table-column>
		</el-table>

	</div>
</template>

<script>
import moment from "moment";
import { getCaseList } from "@/api/case";
import TimePicker from '@/components/TimePicker';
import { dateWatcher } from "@/utils/pickerOptions";

export default {
	name: "iCaseList",
	components: { TimePicker },
	data() {
		return {
			loading: false,
			timeTabId: 4,
			dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			dateRange: [ moment().year(2022).month(5).startOf("month").toDate(), moment().endOf("year").toDate() ],
			searchRange: "",
			zipCodeNow: 104,
			caseTypeNow: 11,
			listQuery: {
				caseType: 11,
				zipCode: 104
			},
			headers: {
				CaseNo: {
					name: "案號",
					sortable: false
				},
				BTName: {
					name: "損壞類別",
					sortable: false
				},
				BrokeType: {
					name: "損壞程度",
					sortable: false
				},
				organAssign: {
					name: "機關交辦",
					sortable: false
				},
				PCIValue: {
					name: "PCI",
					sortable: false
				},
				CaseName: {
					name: "地址",
					sortable: false
				},
				// CType1NO: {
				// 	name: "派工單號",
				// 	sortable: false,
				// },
				// CaseDate: {
				// 	name: "成案日期",
				// 	sortable: false,
				// },
				directDispatchDate: {
					name: "主任分派日期",
					sortable: false,
				},
				// dispatchDate: {
				// 	name: "分派日期",
				// 	sortable: false,
				// },
				dispatchArea: {
					name: "派工面積",
					sortable: false,
				}
			},
			list: [],
			districtList: {
				// 100: {
				// 	"name": "中正區",
				// 	"engName": "Zhongzheng"
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
				// 	"name": "松山區",
				// 	"engName": "Songshan"
				// },
				// 106: {
				// 	"name": "大安區",
				// 	"engName": "Da’an"
				// },
				// 108: {
				// 	"name": "萬華區",
				// 	"engName": "Wanhua",
				// },
				// 110: {
				// 	"name": "信義區",
				// 	"engName": "Xinyi"
				// },
				// 111: {
				// 	"name": "士林區",
				// 	"engName": "Shilin"
				// },
				// 112: {
				// 	"name": "北投區",
				// 	"engName": "Beitou"
				// },
				// 114: {
				// 	"name": "內湖區",
				// 	"engName": "Neihu"
				// },
				// 115: {
				// 	"name": "南港區",
				// 	"engName": "Nangang"
				// },
				// 116: {
				// 	"name": "文山區",
				// 	"engName": "Wenshan"
				// }
			},
			options: {
				caseType: {
					11: {
						name: "熱再生修復",
						unit: "㎡"
					},
					12: {
						name: "AC鉋鋪",
						unit: "㎡"
					},
					2: {
						name: "人行道",
						unit: "㎡"
					},
					3: {
						name: "側溝",
						unit: "m"
					}
				},
				caseTypeOrder: [11, 12, 2, 3],
				warrantyMap: {
					1: {		  						// AC路面
						15: 14,					  	// 坑洞: 14天 
						58: 14,				  		// 人孔高差: 14天
						"etc": 180					// AC路面: 其他 180天
					},
					2: { "etc": 180 },		// 人行道: 180天
					3: { "etc": 180 }			// 側溝屬於人行道: 180天
				},
				BrokeType: {
					1: "輕度",
					2: "中度",
					3: "重度"
				}
			},
			chart: null
		};
	},
	computed: {
		headersFilter() {
			let headersFilter = {};
			Object.keys(this.headers).forEach(key => {
				const props = this.headers[key];
				if(!props.hasOwnProperty('caseTypeFilter')) headersFilter[key] = props;
				else if(props.caseTypeFilter.includes(this.caseTypeNow)) headersFilter[key] = props;
			})
			return headersFilter
		},
		tenderStartDate() {
			return moment(this.districtList[this.zipCodeNow].start).format("yyyy年MM月")
		}
	},
	mounted() {
		// this.getList();
	},
	methods: {
		getList() {
			this.loading = true;
			dateWatcher(this.districtList[this.listQuery.zipCode].start, this.dateRange);

			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;
			this.caseTypeNow = this.listQuery.caseType;

			this.list = [];
			getCaseList({
				zipCode: this.listQuery.zipCode,
				reportType: 1,
				caseType: this.listQuery.caseType,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
			}).then((response) => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.zipCodeNow = this.listQuery.zipCode;
					this.list = response.data.list;
					this.list.forEach(l => {
						// 計算保固日期
						const days = this.options.warrantyMap[l.DeviceType][l.BType] != undefined ? this.options.warrantyMap[l.DeviceType][l.BType] : this.options.warrantyMap[l.DeviceType]["etc"];
						let finishDate = "";
						if([11, 12].includes(this.listQuery.caseType)) finishDate = moment(l.actualFinishDate).isAfter(l.markerFinishDate) ? l.actualFinishDate : l.markerFinishDate;
						if([2, 3].includes(this.listQuery.caseType)) finishDate = moment(l.actualFinishDate).isAfter(l.finishDate) ? l.actualFinishDate : l.finishDate;
						l.warrantyDate = this.formatTime(moment(finishDate).add(days, 'd'));
						
						l.estFinishDate = l.estFinishDate != '0' ? this.formatTime(l.estFinishDate) : '-';
						l.finishDate = l.finishDate != '0' ? this.formatTime(l.finishDate) : '-';
						l.actualFinishDate = l.actualFinishDate != '0' ? this.formatTime(l.actualFinishDate) : '-';
						l.markerFinishDate = l.markerFinishDate != '0' ? this.formatTime(l.markerFinishDate) : '-';

						l.dispatchArea = Math.floor(l.dispatchArea * 100) / 100;
						l.actualArea = Math.floor(l.actualArea * 100) / 100;
						l.markerArea = Math.floor(l.markerArea * 100) / 100;
					})
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		formatter(row, column) {
			if(column.property == 'BrokeType') return this.options.BrokeType[row[column.property]];
			else if(column.property.indexOf('Date')) return row[column.property] ? row[column.property] : "-";
			else if(column.property.indexOf('Area')) return Number(row[column.property]) ? row[column.property].toLocaleString() : "-";
			else return row[column.property];
		},
		formatTime(time) {
			const m = moment(time).utc();
			return m.isValid ? m.format("YYYY/MM/DD") : '-' ;
		},
		handleDownload() {
			let tHeader = Object.values(this.headersFilter).map(header => header.name);
			let filterVal = Object.keys(this.headersFilter);
			// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ]
			// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ]

			const dataList = JSON.parse(JSON.stringify(this.list)).map(l => {
				l.organAssign =  l.organAssign == 1 ? "是" : "";
				l.BrokeType = this.options.BrokeType[l.BrokeType];

				return l
			});

			const data = this.formatJson(filterVal, dataList);

			import("@/vendor/Export2Excel").then((excel) => {
				excel.export_json_to_excel({
					header: tHeader,
					data,
				});
			});
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
.iCase-List
	.filter-container 
		.el-select
			width: 110px
		.el-input__inner
			padding-left: 5px
			text-align: center
	.filter-item
		margin-right: 5px
	.chart
		height: 400px
</style>