<template>
	<div class="app-container PCI-trend" v-loading="loading">
		<h2>佔比統計</h2>
		<aside>「{{ districtList[zipCodeNow].name }}」資料初始為 {{ tenderStartDate }}</aside>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<time-picker class="filter-item" :hasWeek="false" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
			<!-- <el-button
				class="filter-item"
				type="info"
				icon="el-icon-document"
				:circle="screenWidth<567"
				@click="handleDownload"
			>輸出報表</el-button> -->
		</div>
		
		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

		<!-- <div class="chart" ref="chart" /> -->
		<el-row>
			<el-col>
				<div id="barChart" style="width: 100%; height: 640px;"></div>
			</el-col>
		</el-row>

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
			/>
		</el-table>

	</div>
</template>

<script>
import moment from "moment";
import PieChart from "@/components/Charts/PieChart";
import echarts from 'echarts/lib/echarts';
require('echarts/theme/macarons');
import { getPCIShare } from "@/api/pci";
import TimePicker from '@/components/TimePicker';
import { dateWatcher } from "@/utils/pickerOptions";

// const data = [
// 	{
// 		month: "2021/03",
// 		PCIUnder55: 206,
// 		PCIUnder70: 417,
// 		PCIUnder100: 604,
// 		PCI100: 1280
// 	},
// 	{
// 		month: "2021/04",
// 		PCIUnder55: 367,
// 		PCIUnder70: 762,
// 		PCIUnder100: 997,
// 		PCI100: 2223
// 	},
// 	{
// 		month: "2021/05",
// 		PCIUnder55: 522,
// 		PCIUnder70: 871,
// 		PCIUnder100: 1380,
// 		PCI100: 3794
// 	},
// 	{
// 		month: "2021/06",
// 		PCIUnder55: 912,
// 		PCIUnder70: 1375,
// 		PCIUnder100: 2327,
// 		PCI100: 5356
// 	},
// 	{
// 		month: "2021/07",
// 		PCIUnder55: 1237,
// 		PCIUnder70: 1511,
// 		PCIUnder100: 2835,
// 		PCI100: 4387
// 	},
// 	{
// 		month: "2021/08",
// 		PCIUnder55: 1404,
// 		PCIUnder70: 1576,
// 		PCIUnder100: 3022,
// 		PCI100: 3968
// 	},
// 	{
// 		month: "2021/09",
// 		PCIUnder55: 1416,
// 		PCIUnder70: 1682,
// 		PCIUnder100: 3125,
// 		PCI100: 3747
// 	},
// 	{
// 		month: "2021/10",
// 		PCIUnder55: 1915,
// 		PCIUnder70: 1759,
// 		PCIUnder100: 2985,
// 		PCI100: 3311
// 	},
// ]

export default {
	name: "PCITrend",
	components: { TimePicker, PieChart },
	computed: {
		barChartOptions() {
			
		}
	},
	data() {
		return {
			loading: false,
			timeTabId: 2,
			dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			dateRange: [ moment().year(2022).month(5).startOf("month").toDate(), moment().endOf("year").toDate() ],
			searchRange: "",
			zipCodeNow: 104,
			listQuery: {
				zipCode: 104
			},
			headers: {
				month: {
					name: "月份",
					sortable: false
				},
				PCIUnder55: {
					name: "PCI <= 55",
					sortable: false
				},
				PCIUnder70: {
					name: "55 < PCI <= 70",
					sortable: false
				},
				PCIUnder100: {
					name: "70 < PCI < 100",
					sortable: false
				},
				PCI100: {
					name: "PCI = 100",
					sortable: false
				},
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
			PCITotal: 9970
		};
	},
	computed: {
		tenderStartDate() {
			return moment(this.districtList[this.zipCodeNow].start).format("yyyy年MM月")
		}
	},
	mounted() {
		this.getList();
		this.generateChart();
	},
	methods: {
		getList() {
			this.loading = true;
			dateWatcher(this.districtList[this.listQuery.zipCode].start, this.dateRange);

			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;

			this.list = [];
			getPCIShare({
				zipCode: this.listQuery.zipCode,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.zipCodeNow = this.listQuery.zipCode;
					this.list = response.data.list;
					this.list.forEach((l, i) => l.month = moment(l.datestar).format("YYYY/MM"));
					this.PCITotal = Object.keys(this.list[0]).filter(key => (!["datestar", "month"].includes(key))).reduce((acc, cur) => { acc += Number(this.list[0][cur]); return acc; }, 0);
					// this.setChartOptions();
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		formatter(row, column) {
			if(Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property];
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD");
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
		generateChart() {
			
		}
	},
	watch: {
		list() {
			const PCITotal = this.PCITotal;
			const headers = this.headers;
			const legendUsedHeaderKeys = Object.keys(headers).filter((key) => { return key.match(/^PCI.+\d$/)});
			const options = {
				legend: {},
				xAxis: {
					type: 'category',
					axisLine: {
						show: false
					},
					axisTick: {
						show: false
					}
				},
				yAxis: {
					type: 'value',
					min: 0,
					max: PCITotal,
					interval: PCITotal / 5,
					axisLabel: {
						formatter: function (value) {
							return Math.round(value / PCITotal * 100);
						}
					},
					axisLine: {
						show: false
					},
					axisTick: {
						show: false
					}
				},
				dataset: {
					source: this.list
				},
				series: legendUsedHeaderKeys.map(function(key) {
					return {
						type: 'bar',
						name: headers[key].name,
						stack: 'total',
						label: {
						show: true,
						formatter: function(params) {
							const value = params.data[key];

							return parseFloat((value / PCITotal * 100).toFixed(2)) + '%';
						}
						},
						encode: {
							x: 'month',
							y: key
						},
						barWidth: '50%'
					};
				})
			};
			echarts.init(document.getElementById('barChart'), 'macarons').setOption(options);
		}
	}
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PCI-trend
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