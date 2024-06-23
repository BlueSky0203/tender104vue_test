<template>
	<div class="app-container precipitation" v-loading="loading">
		<h2>每月降雨天數(台北)</h2>
		<aside>「{{ districtList[zipCodeNow].name }}」資料初始為 {{ tenderStartDate }}</aside>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1" style="width: 150px">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<!-- <time-picker class="filter-item" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/> -->
			<el-button-group>
				<el-button
					v-for="(t, i) in yearShortcuts"
					:key="i"
					type="primary"
					:plain="i != timeTabId"
					size="mini"
					@click="dateShortcuts(i)"
				>{{ i }}</el-button>
			</el-button-group>
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
			<el-table-column prop="name" label="資料類型" align="center" fixed/>
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:sortable="value.sortable"
				:formatter="formatContent"
			/>
		</el-table>
	</div>
</template>

<script>
import moment from "moment";
// import { getActivReportMJ } from "@/api/analysis";
import { getCaseAndPCI } from "@/api/pci";
import { getPrecipitation } from "@/api/other"
import TimePicker from '@/components/TimePicker';

export default {
	name: "precipitation",
	components: { TimePicker },
	data() {
		return {
			loading: false,
			timeTabId: moment().year(),
			dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			dateRange: [ moment().year(2022).month(5).startOf("month").toDate(), moment().endOf("year").toDate() ],
			searchRange: "",
			zipCodeNow: 104,
			listQuery: {
				zipCode: 104,
			},
			headers: {
				1: {
					name: "一月",
					sortable: false
				},
				2: {
					name: "二月",
					sortable: false
				},
				3: {
					name: "三月",
					sortable: false
				},
				4: {
					name: "四月",
					sortable: false
				},
				5: {
					name: "五月",
					sortable: false
				},
				6: {
					name: "六月",
					sortable: false
				},
				7: {
					name: "七月",
					sortable: false
				},
				8: {
					name: "八月",
					sortable: false
				},
				9:{
					name: "九月",
					sortable: false
				},
				10: {
					name: "十月",
					sortable: false
				},
				11: {
					name: "十一月",
					sortable: false
				},
				12: {
					name: "十二月",
					sortable: false
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
		};
	},
	computed: {
		yearShortcuts() {
			const startYear = moment(this.districtList[this.listQuery.zipCode].start).year();
			let yearShortcuts = {};
			yearShortcuts[startYear] = { dateStart: this.districtList[this.listQuery.zipCode].start };

			const diff = moment().diff([ startYear ], 'years');
			for(let i = 1; i <= diff; i++) yearShortcuts[startYear+i] = {};

			return yearShortcuts;
		},
		tenderStartDate() {
			return moment(this.districtList[this.zipCodeNow].start).format("yyyy年MM月")
		}
	},
	created() { },
	mounted() {
		this.getList(); 
	},
	methods: {
		async dateWatcher() {
			return new Promise(resolve => {
				const dateStart = this.yearShortcuts[this.timeTabId] && this.yearShortcuts[this.timeTabId].dateStart ? moment(this.yearShortcuts[this.timeTabId].dateStart).toDate() : moment().year(this.timeTabId).startOf("y");
				let dateEnd = this.yearShortcuts[this.timeTabId] && this.yearShortcuts[this.timeTabId].dateEnd ? moment(this.yearShortcuts[this.timeTabId].dateEnd).toDate() : moment().year(this.timeTabId).endOf("y");
				if(moment(dateEnd).isAfter(moment())) dateEnd = moment().subtract(1, "d").endOf("d").toDate();
				this.dateRange = [ dateStart, dateEnd ];
				resolve();
			})
		},
		async getList() {
			this.loading = true;
			this.list = [];
			await this.dateWatcher();

			const startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			const endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");

			// 抓取降雨天數
			if(this.timeTabId == moment().year()) {
				fetch("https://opendata.cwa.gov.tw/api/v1/rest/datastore/C-B0025-001?Authorization=rdec-key-123-45678-011121314&StationID=466920").then(res => res.json()).then(json => {
					const record = json.records.location.filter(loc => loc.station.StationID == "466920")[0];
					const precipitation = record.stationObsTimes.stationObsTime;
					const lastIndex = precipitation.length - 1;
					const nowMonth = moment(precipitation[lastIndex].Date).get("month") + 1;

					this.list = [ precipitation.reduce((init, curr) => {
						const month = moment(curr.Date).month() + 1;
						const precipitationSpec = curr.weatherElements.Precipitation;
						
						if(moment(curr.Date).isBetween(...this.dateRange) && Number(precipitationSpec) > 0) {
							if(init[month] == undefined) init[month] = 1;
							else init[month]++;
						}
						return init;
					}, { name: "降雨天數" })];

					if(this.list[0][nowMonth] == undefined) this.list[0][nowMonth] = 0;
				});
			} else {
				getPrecipitation({
					timeStart: startDate,
					timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
				}).then(response => {
					this.list = [ response.data.list.reduce((init, curr) => {
						const month = moment(curr.date).month() + 1;
						init[month] = curr.rainyCount;
						return init;
					}, { name: "降雨天數" })];
				})
			}

			// 抓取坑洞數
			getCaseAndPCI({
				zipCode: this.listQuery.zipCode,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
			}).then(response => {
				this.zipCodeNow = this.listQuery.zipCode;
				this.searchRange = `${startDate} - ${endDate}`;

				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					let caseObj = { name: "坑洞數" };
					const caseReport = response.data.list;
					caseReport.forEach(data => {
						const month = moment(data.month).get("month") + 1;
						caseObj[month] = data.bimPothole;
					})
					this.list.push(caseObj);
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		async dateShortcuts(index) {
			this.timeTabId = index;
			await this.dateWatcher();
			this.getList();
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD");
		},
		formatContent(row, column) {
			const num = row[column.property];
			if(column.property == "name") return num;
			else if (Number(num)) return num;
			else return "-";
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
</style>