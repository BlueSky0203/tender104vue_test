<template>
	<div class="app-container inspect-case" v-loading="loading">
		<h2>缺失分析</h2>
		<aside>「{{ districtList[zipCodeNow].name }}」資料初始為 {{ tenderStartDate }}</aside>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<el-radio-group v-model="listQuery.inspectType" @change="getList">
				<el-radio-button v-for="(name, type) in inspectType" :key="type" :label="Number(type)">{{ name }}</el-radio-button>
			</el-radio-group>
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
			<el-table-column label="序號" type="index" width="100" align="center" />

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
require('echarts/lib/chart/treemap');
import { getInspectCase } from "@/api/case";
import TimePicker from '@/components/TimePicker';

// const data = [
// 	{ caseName: "人孔AC覆蓋打除",	total: 11 },
// 	{ caseName: "人孔高差",	total: 1411 },
// 	{ caseName: "人手孔破損",	total: 2397 },
// 	{ caseName: "凹陷",	total: 128 },
// 	{ caseName: "坑洞",	total: 2858 },
// 	{ caseName: "私設斜陂道",	total: 1 },
// 	{ caseName: "車道與路肩分離",	total: 1284 },
// 	{ caseName: "車轍隆起",	total: 108 },
// 	{ caseName: "其他",	total: 188 },
// 	{ caseName: "波浪狀鋪面",	total: 13 },
// 	{ caseName: "剝落",	total: 1508 },
// 	{ caseName: "破損",	total: 13744 },
// 	{ caseName: "骨材剝落",	total: 2 },
// 	{ caseName: "推擠",	total: 4 },
// 	{ caseName: "掏空",	total: 63 },
// 	{ caseName: "隆起",	total: 3 },
// 	{ caseName: "塊狀裂縫",	total: 144 },
// 	{ caseName: "滑溜裂縫",	total: 6 },
// 	{ caseName: "補綻",	total: 1082 },
// 	{ caseName: "補綻及管線回填",	total: 1030 },
// 	{ caseName: "補繪標線",	total: 3 },
// 	{ caseName: "樹苗",	total: 1 },
// 	{ caseName: "龜裂",	total: 31217 },
// 	{ caseName: "縱橫裂縫",	total: 194743 },
// 	{ caseName: "薄層剝離",	total: 651 },
// 	{ caseName: "鬆動",	total: 4 },
// 	{ caseName: "鱷魚龜裂",	total: 71690 }
// ]

export default {
	name: "inspectCase",
	components: { TimePicker },
	data() {
		return {
			loading: false,
			// timeTabId: -1,
			// dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			// dateRange: [moment().startOf("d").toDate(), moment().endOf("d").toDate()],
			// searchRange: "",
			zipCodeNow: 104,
			listQuery: {
				zipCode: 104,
				inspectType: 1
			},
			headers: {
				caseName: {
					name: "名稱",
					sortable: false
				},
				total: {
					name: "數量",
					sortable: true
				}
			},
			list: [],
			inspectType: {
				1: "道路巡查",
				2: "設施巡查"
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
			// if (moment(this.dateRange[1]).isAfter(moment())) {
			//   this.dateRange[1] = moment().endOf("d").toDate();
			// }

			// let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			// let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			// this.searchRange = startDate + " - " + endDate;

			this.list = [];
			getInspectCase({
				zipCode: this.listQuery.zipCode,
				inspectType: this.listQuery.inspectType
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.zipCodeNow = this.listQuery.zipCode;
					this.list = response.data.list;
					const total = this.list.reduce((acc, curr) => acc + curr.total, 0);
					this.list.forEach(l => this.$set(l, 'percent', Math.floor(l.total / total * 10000) / 100));
					this.setChartOptions();
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		setChartOptions() {
			let legend = [];
			let series = [];

			series.push({
				type: 'treemap',
				name: '巡查統計',
				width: 800,
				data: [],
				// nodeClick: false,
				label: {
					show: true,
					color: 'white',
					fontSize: 14,
					position:'insideBottomLeft',
					formatter: (e) => {
						return e.data.name + "\n" + e.data.percent + "%";
					}
				},
				breadcrumb: {
					show: false
				}
			});

			this.list.forEach(l => {
				legend.push(l.caseName);
				series[0].data.push({
					name: l.caseName,
					value: l.total,
					percent: l.percent
				});
			});

			const options = {
				title: {
					text: `${this.inspectType[this.listQuery.inspectType]}成果`,
					textStyle: {
						color: "black"
					},
				},
				tooltip: {
					show: true,
					color: 'white',
					fontSize: 14,
					// formatter: '{b}: {d}'
					formatter: (e) => {
						return `${e.data.name}: ${e.data.value.toLocaleString()} (${e.data.percent} %)`;
					}
				},
				grid: {
					top: 55,
					bottom: 20,
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
.inspect-case
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