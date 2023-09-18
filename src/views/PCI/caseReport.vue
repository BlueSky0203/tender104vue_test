<template>
	<div class="app-container case-report" v-loading="loading">
		<h2>案件分析</h2>
		<aside>「{{ districtList[zipCodeNow].name }}」資料初始為 {{ tenderStartDate }}</aside>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<!-- <time-picker class="filter-item" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/> -->
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
			<!-- <el-button
				class="filter-item"
				type="info"
				icon="el-icon-document"
				:circle="screenWidth<567"
				@click="handleDownload"
			>輸出報表</el-button> -->
		</div>
		
		<!-- <h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5> -->

		<div class="chart" ref="chart" />

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
			<!-- <el-table-column 
				v-for="header in Object.keys(headers['fixed'])" :prop="header" :label="headers[reportCate]['fixed'][header]"
			align="center" fixed/>-->
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row }">
					<span v-if="['month', 'PCIAverage'].includes(key)">{{ row[key] }}</span>
					<el-button v-else type="text" @click="listQuery.caseType = key; listQuery.month = row.month; listQuery.pageCurrent = 1; getCaseList();">{{ row[key] }}</el-button>
				</template>
			</el-table-column>
		</el-table>

		<el-dialog :visible.sync="showCaseList" width="800px">
			<el-table v-loading="loading" empty-text="目前沒有資料" :data="caseList">
				<el-table-column label="序號" type="index" width="100" align="center" :index="indexMethod" />
				<el-table-column
					v-for="(value, key) in caseHeaders"
					:key="key"
					:prop="key"
					:label="value.name"
					align="center"
					:formatter="formatter"
					:sortable="value.sortable"
				/>
			</el-table>
			<pagination style="margin: 10px 0 20px 0" :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getCaseList" />
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import echarts from 'echarts/lib/echarts';
require('echarts/theme/macarons');
require('echarts/lib/chart/line');
require('echarts/lib/chart/bar');
import { getCaseAndPCI, getCaseList } from "@/api/pci";
import TimePicker from '@/components/TimePicker';
import Pagination from '@/components/Pagination';

// const data = [
// 	{
// 		month: "2021/03",
// 		bimInspect: 11082,
// 		"1999Report": 4,
// 		dispatch: 34,
// 		PCIAverage: 86.19
// 	},
// 	{
// 		month: "2021/04",
// 		bimInspect: 9063,
// 		"1999Report": 4,
// 		dispatch: 93,
// 		PCIAverage: 88.48
// 	},
// 	{
// 		month: "2021/05",
// 		bimInspect: 12462,
// 		"1999Report": 4,
// 		dispatch: 26,
// 		PCIAverage: 95.80
// 	},
// 	{
// 		month: "2021/06",
// 		bimInspect: 12927,
// 		"1999Report": 3,
// 		dispatch: 78,
// 		PCIAverage: 86.6
// 	},
// 	{
// 		month: "2021/07",
// 		bimInspect: 12984,
// 		"1999Report": 3,
// 		dispatch: 28,
// 		PCIAverage: 83.53
// 	},
// 	{
// 		month: "2021/08",
// 		bimInspect: 15182,
// 		"1999Report": 7,
// 		dispatch: 62,
// 		PCIAverage: 82.1
// 	},
// 	{
// 		month: "2021/09",
// 		bimInspect: 20392,
// 		"1999Report": 6,
// 		dispatch: 38,
// 		PCIAverage: 81.43
// 	},
// 	{
// 		month: "2021/10",
// 		bimInspect: 14771,
// 		"1999Report":33,
// 		dispatch: 71,
// 		PCIAverage: 78.35
// 	}
// ]

export default {
	name: "caseReport",
	components: { TimePicker, Pagination },
	data() {
		return {
			loading: false,
			// timeTabId: -1,
			showCaseList: false,
			screenWidth: window.innerWidth,
			// dateRange: [moment().startOf("d").toDate(), moment().endOf("d").toDate()],
			// searchRange: "",
			zipCodeNow: 104,
			listQuery: {
				zipCode: 104,
				caseType: "",
				month: "",
				pageCurrent: 1,
				pageSize: 50,
			},
			headers: {
				month: {
					name: "月份",
					sortable: false
				},
				bimPothole: {
					name: "坑洞案件(聖東)",
					sortable: false,
					chartType: 'bar'
				},
				bimInspect: {
					name: "巡查案件(聖東)",
					sortable: false,
					chartType: 'bar'
				},
				"1999Pothole": {
					name: "坑洞案件(1999)",
					sortable: false,
					chartType: 'bar'
				},
				"1999Report": {
					name: "查報案件(1999)",
					sortable: false,
					chartType: 'bar'
				},
				// dispatch: {
				// 	name: "派工",
				// 	sortable: false,
				// 	chartType: 'bar'
				// },
				PCIAverage: {
					name: "PCI平均",
					sortable: false,
					chartType: 'line'
				},
			},
			caseHeaders: {
				CaseNo: {
					name: "案號",
					sortable: false
				},
				BTName: {
					name: "損壞類別",
					sortable: false
				},
				CaseName: {
					name: "地址",
					sortable: false
				},
				CaseDate: {
					name: "成案日期",
					sortable: false,
				}
			},
			total: 0,
			list: [],
			caseList: [],
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
			chart: null
		};
	},
	computed: {
		tenderStartDate() {
			return moment(this.districtList[this.zipCodeNow].start).format("yyyy年MM月")
		}
	},
	mounted() {
		this.chart = echarts.init(this.$refs.chart, 'macarons', {
			width: 'auto',
			height: 'auto'
		});
		this.getList();
	},
	methods: {
		getList() {
			this.loading = true;
			// if (moment(this.dateRange[1]).isAfter(moment())) {
			//   this.dateRange[1] = moment().endOf("d").toDate();
			// }

			// let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			// let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			// this.searchRange = startDate + " - " + endDate;

			this.list = [];
			getCaseAndPCI({
				zipCode: this.listQuery.zipCode
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.zipCodeNow = this.listQuery.zipCode;
					this.list = response.data.list;
					this.list.forEach((l, i) => {
						if(l.PCIAverage != undefined) l.PCIAverage = Math.floor((l.PCIAverage) * 100) / 100;
						else l.PCIAverage = '-';
					})
					this.setChartOptions();
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		getCaseList() {
			this.caseList = [];
			this.loading = true;
			this.showCaseList = true;
			getCaseList({
				zipCode: this.zipCodeNow,
				caseType: this.listQuery.caseType,
				month: this.listQuery.month,
				pageCurrent: this.listQuery.pageCurrent,
				pageSize: this.listQuery.pageSize,
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.caseList = response.data.list;
					this.total = response.data.total;
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		indexMethod(index) {
			return (index + 1) + (this.listQuery.pageCurrent - 1) * this.listQuery.pageSize;
		},
		setChartOptions() {
			const colors = ["#7eb00a","#e5cf0d","#8d98b3","#95706d","#ffb980","#b6a2de","#2ec7c9","#5ab1ef","#d87a80","#97b552","#dc69aa","#07a2a4","#9a7fd1","#588dd5","#f5994e","#c05050","#59678c","#c9ab00","#6f5553","#c14089"];
			const headerFilter = Object.fromEntries(Object.entries(this.headers).filter(([key, _]) => key != "month"));
			let legend = [];
			let series = [];

			for(const key in headerFilter) {
				legend.push(headerFilter[key].name);
				series.push({
					type: headerFilter[key].chartType,
					name: headerFilter[key].name,
					data: this.list.map(l=>l[key]),
					yAxisIndex: headerFilter[key].chartType == "line" ? 1 : 0,
					label: {
						show: true,
						offset: [2, 2],
						formatter: '{c}'
					},
					smooth: false
				});
			}

			const options = {
				color: colors,
				xAxis: {
					name: "月份",
					type: 'category',
					nameLocation: 'middle',
					nameGap: 25,
					data: this.list.map(l=>l.month),
					axisTick: {
						show: false
					}
				},
				yAxis: [
					{
						name: '案件數',
						type: 'value',
						position: 'left',
						axisTick: {
							show: false
						},
						// axisLine: { lineStyle: { color: colors[0] } }
					},
					{
						name: 'PCI平均',
						type: 'value',
						position: 'right',
						axisTick: { show: false },
						axisLine: { lineStyle: { color: colors[3] } }
					}
				],
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'cross'
					},
					padding: [5, 10]
				},
				grid: {
					top: 55,
					bottom: 25,
					left: 30,
					right: 30,
					containLabel: true
				},
				legend: { data: legend },
				series: series
			};

			this.chart.setOption(options);
		},
		formatter(row, column) {
			if(Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property];
		},
		formatTime(time) {
			return moment(time).utc().format("YYYY-MM-DD");
		},
		handleDownload() {
			let tHeader = Object.values(this.headers);
			let filterVal = Object.keys(this.headers);
			// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ]
			// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ]
			let data = this.formatJson(filterVal, this.list);

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
.case-report
	.filter-container 
		.el-select
			width: 105px
		.el-input__inner
			padding-left: 5px
			text-align: center
	.filter-item
		margin-right: 5px
	.chart
		height: 400px
</style>