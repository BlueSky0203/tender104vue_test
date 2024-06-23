<template>
	<div class="app-container PCI-report" v-loading="loading">
		<h2>單元報表</h2>
		<aside>「{{ districtList[zipCodeNow].name }}」資料初始為 {{ tenderStartDate }}</aside>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
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
			<!-- <el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button> -->
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
			<el-table-column label="序號" type="index" width="100" align="center" :index="indexMethod" />
			<!-- <el-table-column 
				v-for="header in Object.keys(headers['fixed'])" :prop="header" :label="headers[reportCate]['fixed'][header]"
			align="center" fixed/>-->
			<el-table-column
				v-for="(value, key) in { ...headers, ...headers_PCI}"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:sortable="value.sortable"
			/>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />
	</div>
</template>

<script>
import moment from "moment";
import { getPCIList } from "@/api/pci";
import TimePicker from '@/components/TimePicker';
import Pagination from '@/components/Pagination';
// import { data } from "../../../public/assets/json/pci.json"

export default {
	name: "PCIReport",
	components: { TimePicker, Pagination },
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
				pageCurrent: 1,
				pageSize: 50,
			},
			headers: {
				id: {
					name: "單元編號",
					sortable: false
				},
				dist: {
					name: "行政區",
					sortable: false
				},
				roadName: {
					name: "道路名稱",
					sortable: false
				},
				// roadId: {
				// 	name: "道路編號",
				// 	sortable: false
				// },
				roadArea: {
					name: "道路面積",
					sortable: false
				},
			},
			headers_PCI: {
				// PCIValue_06: {
				// 	name: "PCI_2206",
				// 	sortable: false
				// },
				// PCIValue_07:{
				// 	name: "PCI_2207",
				// 	sortable: false
				// }
			},
			total: 0,
			list: [],
			roadIdMap: {
				0: "路口",
				1: "順向",
				2: "逆向"
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
	created() {
		this.getList();
	},
	methods: {
		async dateWatcher() {
			return new Promise(resolve => {
				const dateStart = this.yearShortcuts[this.timeTabId] && this.yearShortcuts[this.timeTabId].dateStart ? moment(this.yearShortcuts[this.timeTabId].dateStart).toDate() : moment().year(this.timeTabId).startOf("y");
				let dateEnd = this.yearShortcuts[this.timeTabId] && this.yearShortcuts[this.timeTabId].dateEnd ? moment(this.yearShortcuts[this.timeTabId].dateEnd).toDate() : moment().year(this.timeTabId).endOf("y");
				if(moment(dateEnd).isAfter(moment())) dateEnd = moment().endOf("d").toDate();
				this.dateRange = [ dateStart, dateEnd ];

				resolve();
			})
		},
		async getList() {
			this.loading = true;
			this.list = [];
			await this.dateWatcher();

			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;

			getPCIList({
				zipCode: this.listQuery.zipCode,
				pageCurrent: this.listQuery.pageCurrent,
				pageSize: this.listQuery.pageSize,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
			}).then(response => {
				this.zipCodeNow = this.listQuery.zipCode;
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
				} else {
					this.total = response.data.total;
					this.list = response.data.list;
					this.headers_PCI = {};
					this.list = this.list.reduce((curr, prev) => {
						const createMonth = String(prev.createMonth).padStart(2, 0);
						if(curr.length == 0 || prev.id != curr[curr.length - 1].id) {
							prev[`PCIValue_${createMonth}`] = prev.PCI_value;
							prev.createMonth = [ prev.createMonth ];
							curr.push(prev);
						} else {
							curr[curr.length - 1][`PCIValue_${createMonth}`] = prev.PCI_value;
							curr[curr.length - 1].createMonth.push(prev.createMonth);
						}
						return curr;
					}, []);
					this.list.forEach(l => {
						const createYear = String(l.createYear).slice(2);
						for(const month of l.createMonth) {
							const createMonth = String(month).padStart(2, 0);

							if(!this.headers_PCI.hasOwnProperty(`PCIValue_${createMonth}`)) {
								this.$set(this.headers_PCI, `PCIValue_${createMonth}`, {name: `PCI_${createYear}${createMonth}`, sortable: false });
							}
						}	
						this.$set(l, "roadId", `${this.roadIdMap[l.id.slice(-1)]}-${l.id.slice(-4, -1)}`);
					});
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		async dateShortcuts(index) {
			this.timeTabId = index;
			await this.dateWatcher();
			this.pageCurrent = 1;
			this.getList();
		},
		indexMethod(index) {
			return (index + 1) + (this.listQuery.pageCurrent - 1) * this.listQuery.pageSize;
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD");
		},
		async handleDownload() {
			await this.dateWatcher();

			const startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			const endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");

			getPCIList({
				zipCode: this.listQuery.zipCode,
				pageCurrent: 1,
				pageSize: this.total,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
			}).then(response => {
				let list = response.data.list;
				list = list.reduce((curr, prev) => {
					const createMonth = String(prev.createMonth).padStart(2, 0);
					if(curr.length == 0 || prev.id != curr[curr.length - 1].id) {
						prev[`PCIValue_${createMonth}`] = prev.PCI_value;
						prev.createMonth = [ prev.createMonth ];
						curr.push(prev);
					} else {
						curr[curr.length - 1][`PCIValue_${createMonth}`] = prev.PCI_value;
						curr[curr.length - 1].createMonth.push(prev.createMonth);
					}
					return curr;
				}, []);

				list.forEach((l, i) => {
					for(const month of l.createMonth) {
						const createMonth = String(month).padStart(2, 0);

						if(!this.headers_PCI.hasOwnProperty(`PCIValue_${createMonth}`)) {
							this.$set(this.headers_PCI, `PCIValue_${createMonth}`, {name: `PCI_22${createMonth}`, sortable: false });
						}
					}	
					this.$set(l, "roadId", `${this.roadIdMap[l.id.slice(-1)]}-${l.id.slice(-4, -1)}`);
					this.$set(l, "index", i+1);
				});
				let tHeader = ["序號", ...Object.values({...this.headers, ...this.headers_PCI}).map(h => h.name)];
				let filterVal =[ "index", ...Object.keys({...this.headers, ...this.headers_PCI})];
				// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ]
				// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ]
				let data = this.formatJson(filterVal, list);

				import("@/vendor/Export2Excel").then((excel) => {
					excel.export_json_to_excel({
						header: tHeader,
						data,
					});
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

.PCI-report
	.filter-container 
		.el-select
			width: 105px
		.el-input__inner
			padding-left: 5px
			text-align: center
	.filter-item
		margin-right: 5px
</style>