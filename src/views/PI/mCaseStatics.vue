<template>
	<div class="app-container mCase-statics" v-loading="loading">
		<h2>維護數量</h2>
		<aside>「{{ districtList[zipCodeNow].name }}」資料初始為 {{ tenderStartDate }}</aside>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<time-picker class="filter-item" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
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
			/>
		</el-table>

	</div>
</template>

<script>
import moment from "moment";
import echarts from 'echarts/lib/echarts';
require('echarts/theme/macarons');
require('echarts/lib/chart/bar');
require('echarts/lib/chart/line');
import { getCaseReport } from "@/api/case";
import TimePicker from '@/components/TimePicker';
import { dateWatcher } from "@/utils/pickerOptions";

// const data = [
// 	{
// 		type: "人行道(m2)",
// 		area: 258
// 	},
// 	{
// 		type: "水溝(m)",
// 		area: 1119
// 	},
// 	{
// 		type: "AC鉋鋪(m2)",
// 		area: 25489
// 	},
// 	{
// 		type: "熱再生修復(m2)",
// 		area: 2405
// 	}
// ]

export default {
	name: "mCaseStatics",
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
			listQuery: {
				zipCode: 104
			},
			headers: {
				type: {
					name: "類型",
					sortable: false
				},
				count: {
					name: "數量",
					sortable: false,
					chartType: 'line'
				},
				area: {
					name: "面積",
					sortable: false,
					chartType: 'bar'
				}
			},
			list: [],
			typeMap: {
				hotRepair: "熱再生修復(m2)",
				AC: "AC鉋鋪(m2)",
				ditch: "側溝(m)",
				sidewalk: "人行道(m2)"
			},
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
			dateWatcher(this.districtList[this.listQuery.zipCode].start, this.dateRange);

			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;

			this.list = [];
			getCaseReport({
				zipCode: this.listQuery.zipCode,
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
					const obj = response.data.list;
					this.list = Object.keys(obj).map(key => ({ type: this.typeMap[key], count: obj[key].count, area: Math.floor(obj[key].area * 100) / 100 }) );
					this.setChartOptions();
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		setChartOptions() {
			const headerFilter = Object.fromEntries(Object.entries(this.headers).filter(([key, _]) => key != "type"));
			let legend = [];
			let series = [];

			for(const key in headerFilter) {
				if(headerFilter[key].chartType == null) continue;
				legend.push(headerFilter[key].name);
				series.push({
					type: headerFilter[key].chartType,
					name: headerFilter[key].name,
					data: this.list.map(l=>l[key]),
					xAxisIndex: headerFilter[key].chartType == "bar" ? 0 : 1,
					barWidth: '40%',
					label: {
						show: headerFilter[key].chartType != "bar",
						position: 'bottom',
						formatter: '{c}'
					},
					smooth: false
				});
			}

			const options = {
				xAxis: [
					{
						name: "面積",
						type: 'value',
						boundaryGap: false,
						axisTick: {
							alignWithLabel: true
						},
						splitLine: {
							lineStyle: {
								color: ['#bbb'],
								type: 'dashed',
								opacity: 0.3
							}
						},
						splitArea: {
							show: false
						}
					},
					{
						name: '數量',
						type: 'value',
						nameGap: 8,
						boundaryGap: false,
						axisTick: {
							alignWithLabel: true
						},
						splitLine: {
							show: false
						},
						splitArea: {
							show: false
						}
					},
				],
				yAxis: {
					name: '類型',
					type: 'category',
					data: this.list.map(l => l.type),
					axisTick: {
						show: false
					}
				},
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'cross'
					},
					padding: [5, 10]
				},
				grid: {
					top: 55,
					bottom: 20,
					left: 30,
					right: 100,
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
.mCase-statics
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