<template>
	<div class="app-container case-plan-V0" v-loading="loading">
		<h2>主任分派_V0</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>類型</span>
					</div>
					<el-select v-model.number="listQuery.deviceType" placeholder="請選擇" popper-class="type-select" style="width: 100px">
						<el-option v-for="(name, id) in options.deviceType" :key="id" :value="Number(id)" :label="name" />
					</el-select>
				</div>
			</div>

			<span class="filter-item">
				<div style="font-size: 12px; color: #909399">成案日期</div>
				<time-picker shortcutType="day" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			</span>
			<br />

			<div class="filter-item">
				<div v-if="listQuery.filterType == 1" class="select-contract">
					<el-select v-model="listQuery.filterType" popper-class="type-select">
						<el-option v-for="(name, type) in options.filterType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
					<el-select v-model="listQuery.dteamSN" class="tender-select" placeholder="請選擇" popper-class="type-select tender" clearable @clear="listQuery.dteamSN = null">
						<el-option v-for="(name, id) in options.tenderMap" :key="id" :value="id" :label="name" />
					</el-select>
				</div>
				
				<el-input
					v-else
					v-model="listQuery.filterStr"
					placeholder="請輸入"
					style="width: 300px"
				>
					<el-select slot="prepend" v-model="listQuery.filterType" popper-class="type-select">
						<el-option v-for="(name, type) in options.filterType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
				</el-input>
			</div>
			
			<!-- <div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>合約</span>
					</div>
					<el-select v-model="listQuery.dteamSN" class="tender-select" placeholder="請選擇" popper-class="type-select tender">
						<el-option v-for="(name, id) in options.tenderMap" :key="id" :value="id" :label="name" />
					</el-select>
				</div>
			</div> -->

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList();">搜尋</el-button>
			<!-- <el-button class="filter-item" type="info" icon="el-icon-document" :circle="screenWidth < 567" @click="handleDownload">輸出列表</el-button> --> 
		</div>

		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>廠商</span>
					</div>
					<el-select v-model.number="listQuery.contractor" placeholder="請選擇" popper-class="type-select" style="width: 100px">
						<el-option v-for="(name, id) in options.guildMap" :key="id" :value="Number(id)" :label="name" />
					</el-select>
				</div>
			</div>
			<el-tooltip effect="dark" content="請選擇廠商和案件" placement="bottom" :disabled="tableSelect.length != 0 && Number(listQuery.contractor) > 0">
				<span>
					<el-button class="filter-item" type="success" icon="el-icon-s-claim" :disabled="tableSelect.length == 0 || Number(listQuery.contractor) == 0" @click="showAddKit = true">分派</el-button>
				</span>
			</el-tooltip>
		</div>

		<el-table
			ref="planTable"
			empty-text="目前沒有資料"
			:data="list"
			:key="deviceTypeNow"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
			style="width: 100%"
			@selection-change="handleCheckedChange"
		>
			<el-table-column type="selection" width="60" align="center" fixed>
				<template slot-scope="{ row, $index }">
					<el-checkbox v-model="checkList[$index]" style="margin-right: 5px" @change="cellCheckBox(row, $index)" />
					<span>{{ $index + 1 }}</span>
				</template>
			</el-table-column>
			<!-- <el-table-column type="index" label="序號" width="50" align="center" /> -->
			<el-table-column prop="CaseSN" label="申請單號" width="125" align="center" fixed sortable />
			<el-table-column prop="CaseNo" label="案件編號" width="130" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseNo }}</span>
					<br>
					<span style="color: #909399; font-size: 12px">{{ row.DName }} ({{ row.CaseType }})</span>
				</template>
			</el-table-column>

			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:width="['estFinishDate'].includes(key) ? 220 : null"
				:min-width="['CaseName'].includes(key) ? 80 : null"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="[ 'estFinishDate' ].includes(column.property)">
						<el-row type="flex" align="middle">
							<el-col :span="18"><el-date-picker v-model="row.estFinishDate" type="date" placeholder="選擇日期" style="width: 100%" /></el-col>
							<el-col :span="6"><el-tag class="btn-tag" :type="row.detailTime ? 'success': 'info'" @click="row.detailTime = !row.detailTime">時段</el-tag></el-col>
						</el-row>
						<el-time-picker v-if="row.detailTime" v-model="row.estWorkingTime" is-range range-separator="至"  start-placeholder="開始時間" end-placeholder="結束時間" placeholder="選擇時間" style="width: 100%" />
					</span>
					<span v-else>
						<span>{{ row[column.property] || "-" }}</span>
					</span>
				</template>
			</el-table-column>

			<!-- 道路、熱再生 -->
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="算式" width="500" align="center">
				<template slot-scope="{ row }">
					<el-row v-if="row.accountflag0 == '1'" :gutter="5" type="flex" align="middle">
						<el-col :span="4"><el-tag class="btn-tag" type="success" @click="row.accountflag0 = '0'; calArea(row);">自訂</el-tag></el-col>
						<el-col :span="20"><el-input v-model="row.account0" @change="calArea(row)" /></el-col>
					</el-row>
					<el-row v-else :gutter="5" type="flex" align="middle">
						<el-col :span="4"><el-tag class="btn-tag" @click="row.accountflag0 = '1'; calArea(row);">簡單</el-tag></el-col>
						<el-col :span="8"><el-input v-model="row.elength" @change="calArea(row)" /></el-col>
						<el-col :span="2" style="line-height: 36px"> ✕ </el-col>
						<el-col :span="8"><el-input v-model="row.blength" @change="calArea(row)" /></el-col>
					</el-row>
				</template>
			</el-table-column>
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="預估面積" width="85" align="center">
				<template slot-scope="{ row }">
					<!-- <el-input v-model="row.acsum0" /> -->
					<span>{{ row.acsum0 || "-" }}</span>
				</template>
			</el-table-column>

			<!-- 設施 -->
			<el-table-column v-if="deviceTypeNow == 3" label="急件" width="55" align="center">
				<template slot-scope="{ row }">
					<el-checkbox v-model="row.isUrgent" />
				</template>
			</el-table-column>
			<el-table-column v-if="deviceTypeNow == 3" label="工程概述" align="center">
				<template slot-scope="{ row }">
					<el-input v-model="row.c5type" />
				</template>
			</el-table-column>
			
			<el-table-column label="動作" align="center">
				<template slot-scope="{ row }">
					<el-button-group>
						<el-button v-if="deviceTypeNow == 3" size="mini" @click="toggleExpand(row)">詳情</el-button>
						<el-button v-if="deviceTypeNow == 3" type="success" size="mini" @click="beforeEdit(row)">設計</el-button>
						<el-button type="info" size="mini" @click="showDetail(row)">檢視</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column type="expand" width="1" align="center" style="display: none">
				<template slot-scope="props">
				</template>
			</el-table-column>
		</el-table>

		<!-- <pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" /> -->

		<!-- Dialog: 案件檢視 -->
		<el-dialog width="500px" title="案件檢視" :visible.sync="showDetailDialog">
			<case-detail ref="caseDetail" :loading.sync="loading" :showDetailDialog.sync="showDetailDialog" />
			<div slot="footer" class="dialog-footer">
				<!-- <el-button @click="showDispatch = false">取消</el-button> -->
				<el-button type="primary" @click="showDetailDialog = false">確定</el-button>
			</div>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderMap, getGuildMap } from "@/api/type";
import { getDispatchListV0 } from "@/api/dispatchV0";
import TimePicker from "@/components/TimePicker";
import CaseDetail from "@/components/CaseDetail_rm100";
// import Pagination from "@/components/Pagination";

export default {
	name: "casePlanV0",
	components: { TimePicker, CaseDetail },
	data() {
		return {
			loading: false,
			showDispatch: false,
			showDetailDialog: true,
			showConfirm: false,
			timeTabId: 1,
			dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			dateRange: [
				moment().subtract(1, 'd').startOf("day").toDate(),
				moment().subtract(1, 'd').endOf("day").toDate(),
			],
			searchRange: "",
			deviceTypeNow: 1,
			listQuery: {
				filterType: 1,
				filterStr: null,
				dteamSN: null,
				deviceType: 1,
				contractor: null,
				// pageCurrent: 1,
				// pageSize: 50,
			},
			headers: {
				// CaseSN: {
				// 	name: "申請單號",
				// 	sortable: true,
				// },
				// CaseNo: {
				// 	name: "案件編號",
				// 	sortable: true,
				// },
				// CaseType: {
				// 	name: "查報來源",
				// 	sortable: false,
				// },
				// DName: {
				// 	name: "案件類型",
				// 	sortable: false,
				// },
				CaseName: {
					name: "案件地點",
					sortable: false
				},
				estFinishDate: {
					name: "預計完工日期",
					sortable: false
				},
				// estWorkingTime: {
				// 	name: "預計施作時段",
				// 	sortable: false
				// },
				// account0: {
				// 	name: "複雜算式",
				// 	sortable: false
				// },
				// elength: {
				// 	name: "預計長度",
				// 	sortable: false
				// },
				// blength: {
				// 	name: "預計寬度",
				// 	sortable: false
				// },
				// acsum0: {
				// 	name: "預估面積",
				// 	sortable: false
				// },
			},
			// total: 0,
			list: [],
			// detail: [],
			rowActive: {},
			checkIndeterminate: false,
			checkList: [],
			tableSelect: [],
			options: {
				tenderMap: {},
				guildMap: {},
				deviceType: {
					1: "道路",
					2: "熱再生",
					3: "設施",
					4: "標線"
				},
				filterType: {
					1: "合約",
					2: "通報單號",
					3: "地點(關鍵字)"
				},
			}
		};
	},
	computed: {	},
	watch: { },
	created() { 
		getTenderMap().then(response => { this.options.tenderMap = response.data.tenderMap });
		getGuildMap().then(response => { this.options.guildMap = response.data.guildMap });
	},
	mounted() {
		this.showDetailDialog = false;
	},
	methods: {
		async handleCheckedChange(val) {
			// const delay = (n) => new Promise( r => setTimeout(r, n*1000));

			// for(const val of value) {
			// 	let msgArr = [];
			// 	for(const column in this.headers) {
			// 		if(!['CaseNo', 'organAssign'].includes(column) && !val[column]) msgArr.push(`「${this.headers[column].name}」`);
			// 	}
			// 	if(msgArr.length > 0) {
			// 		this.$message({
			// 			type: "warning",
			// 			message: `請填入${val.UploadCaseNo}的${msgArr.join("、")}`
			// 		});

			// 		await delay(0.5);
			// 	}
			// }

			this.tableSelect = val;
			if(this.tableSelect.length == this.list.length) this.tableSelect.forEach((_, index) => this.$set(this.checkList, index, true));
			if(this.tableSelect.length == 0) this.checkList = this.checkList.map(() => false);
		},
		cellCheckBox(row, index) {
			if(this.checkList[index]) this.$refs.planTable.toggleRowSelection(row, true);
			else this.$refs.planTable.toggleRowSelection(row, false);
		},
		toggleExpand(row) {
			this.$refs.planTable.toggleRowExpansion(row)
		},
		getList() {
			this.loading = true;
			this.list = [];
			this.listQuery.contractor = null;

			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;

			getDispatchListV0({
				dteamSN: this.listQuery.filterType == 1 ? this.listQuery.dteamSN : null,
				reportSN: (this.listQuery.filterType == 2 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
				keywords: (this.listQuery.filterType == 3 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
				deviceType: this.listQuery.deviceType,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD")
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
				} else {
					this.list = response.data.list;
					this.checkList = Array.from({ length: this.list.length }, () => false);
					this.deviceTypeNow = this.listQuery.deviceType;

					this.list.forEach(l => {
					// 	l.reccreatetime = this.formatTime(l.reccreatetime);
						this.$set(l, "detailTime", false);
						this.$set(l, "isUrgent", false);
						l.estFinishDate = (l.estFinishDate == '0') ? moment(Number(l.CaseNo.substr(0, 7))+19110000, "YYYYMMDD", true).add(15, 'd').toDate() : l.estFinishDate;
					// 	this.$set(l, "editNote", false);
					})
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		showDetail(row) {
			this.loading = true;
			this.$refs.caseDetail.getDetail(row);
		},
		calArea(row) {
			const replaceObj = { " ": "", "＋": "+", "－": "-", "＊": "*", "x": "*", "X": "*", "×": "*", "／": "/", "（": "(", "）": ")",
				"０": '0', "１": "1", "２": "2", "３": "3", "４": "4", "５": "5", "６": "6", "７": "7", "８": "8", "９": "9" };
			// const regex = new RegExp('^[0-9*+\/().-]+$', 'g');
			const regex = /^[^*+/-](?:[*+/\-]?[(]*\d+\.?\d*[)]*)+$/g;
			
			if(row.accountflag0 == '1') {
				for(const key in replaceObj) row.account0 = row.account0.replaceAll(key, replaceObj[key]);
				row.acsum0 = regex.test(row.account0) ? Math.round(new Function(`return ${row.account0}`)() * 100) / 100 : 0;
			} else row.acsum0 = Math.round(row.elength * row.blength * 100) / 100;
		},
		beforeEdit(row) {
			this.rowActive = row; 
			// this.loading = true;

			// this.detail = [];
			// Object.assign(this.newItem, { itemId: "", itemName: "", unit: "", uPrice: "", number: 0, isEdit: true });

		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD HH:MM:ss");
		},
		async handleDownload() {
			// await this.dateWatcher();

			// const startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			// const endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");

			getRoadUnit({
				pageCurrent: 1,
				pageSize: this.total
			}).then((response) => {
				let list = response.data.list;
				list.forEach(l => l.dist = this.districtList[l.zip].name);

				const tHeader = Object.values(this.headers).map((h) => h.name);
				const filterVal = Object.keys(this.headers);
				// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ]
				// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ]
				const data = this.formatJson(filterVal, list);

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
*
	// border: 1px solid #000
	// box-sizing: border-box
.case-plan-V0
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select
				width: 110px
				.el-input__inner
					padding-left: 3px
					padding-right: 10px
					text-align: center
				.el-input__suffix
					right: 0
					// margin-right: -5px
					transform: scale(0.7)
				&.tender-select
					width: 520px
			.select-contract
				.el-select:first-child .el-input__inner
					background-color: #F5F7FA
					color: #909399
					border-right: none
					border-top-right-radius: 0
					border-bottom-right-radius: 0
					&:focus
						border-color: #DCDFE6
				.el-select:last-child .el-input__inner
					border-top-left-radius: 0
					border-bottom-left-radius: 0
					padding-left: 10px
					text-align: left
	.el-table
		.input-length, .input-width
			max-width: 60px
		.btn-tag
			cursor: pointer
		.el-table__expand-icon
			display: none
	.btn-dialog
		padding: 5px 5px
</style>