<template>
	<div class="app-container case-inform" v-loading="loading">
		<h2>製作通報單</h2>
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
					<el-select v-model="listQuery.tenderId" class="tender-select" placeholder="請選擇" popper-class="type-select tender" clearable @clear="listQuery.tenderId = null">
						<el-option v-for="(obj, id) in options.tenderMap" :key="id" :value="id" :label="obj.tenderName" />
					</el-select>
				</div>
				
				<el-input v-else v-model="listQuery.filterStr" placeholder="請輸入" style="width: 300px">
					<el-select slot="prepend" v-model="listQuery.filterType" popper-class="type-select">
						<el-option v-for="(name, type) in options.filterType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
				</el-input>
			</div>

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="listQuery.pageCurrent = 1; getList();">搜尋</el-button>
			<inspection-list-pdf ref="inspectionListPdf" style="display: inline; margin-left: 10xp" :loading.sync="loading"  :tableSelect.sync="tableSelect"  @downloadPdf="downloadPdf" />
			<el-checkbox v-model="listQuery.filter" style="margin-left: 20px">已列印</el-checkbox>
		</div>

		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

		<el-table
			ref="caseTable"
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
			<el-table-column v-if="!filterNow" :key="filterNow" type="selection" width="60" align="center" fixed>
				<template slot-scope="{ row, $index }">
					<el-checkbox v-model="checkList[$index]" style="margin-right: 5px" @change="cellCheckBox(row, $index)" />
					<span>{{ $index + 1 }}</span>
				</template>
			</el-table-column>
			<el-table-column prop="CaseNo" label="案件編號" width="130" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseNo }}</span>
					<br>
					<span style="color: #909399; font-size: 12px">{{ row.DName }} ({{ row.casetype }})</span>
				</template>
			</el-table-column>

			<!-- 道路、熱再生 -->
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="算式" width="200" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.MillingFormula != '0'">{{ row.MillingFormula }}</span>
					<span v-else>{{ row.MillingLength }} * {{ row.MillingWidth }}</span>
				</template>
			</el-table-column>
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="預估面積" width="85" align="center">
				<template slot-scope="{ row }">
					<span>{{ row.MillingArea || "-" }}</span>
				</template>
			</el-table-column>

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
					<span v-if="column.property == 'State'">
						<span v-if="row.State == 3" style="color: #67C23A">已列印</span>
						<span v-else-if="row.State == 1" style="color: #F56C6C">未列印</span>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" align="center">
				<template slot-scope="{ row }">
					<el-button type="info" size="mini" @click="showDetail(row)">檢視</el-button>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

		<!-- Dialog: 案件檢視 -->
		<el-dialog width="500px" title="案件檢視" :visible.sync="showDetailDialog">
			<case-detail ref="caseDetail" :loading.sync="loading" :showDetailDialog.sync="showDetailDialog" :deviceTypeNow="deviceTypeNow" />
			<div slot="footer" class="dialog-footer">
				<!-- <el-button @click="showDispatch = false">取消</el-button> -->
				<el-button type="primary" @click="showDetailDialog = false">確定</el-button>
			</div>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderMap } from "@/api/type";
import { getInform, confirmInform } from "@/api/dispatch";
import TimePicker from "@/components/TimePicker";
import Pagination from "@/components/Pagination";
import CaseDetail from "@/components/CaseDetail";
import InspectionListPdf from "@/components/InspectionListPdf";

export default {
	name: "caseInform",
	components: { TimePicker, Pagination, CaseDetail, InspectionListPdf },
	data() {
		return {
			loading: false,
			showImgViewer: false,
			showDetailDialog: true,
			map: {},
			imgUrls: "",
			caseTypeTemp: [],
			caseTitleTemp: [],
			timeTabId: 1,
			screenWidth: window.innerWidth,
			dateRange: [
				moment().subtract(1, 'd').startOf("day").toDate(),
				moment().subtract(1, 'd').endOf("day").toDate(),
			],
			searchRange: "",
			deviceTypeNow: 1,
			filterNow: false,
			listQuery: {
				filter: false,
				filterType: 1,
				tenderRound: 100001,
				filterStr: null,
				tenderId: null,
				deviceType: 1,
				pageCurrent: 1,
				pageSize: 50,
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
				// DName: {
				// 	name: "案件類型",
				// 	sortable: false,
				// },
				Place: {
					name: "案件地點",
					sortable: false
				},
				DateDeadline: {
					name: "預計完工日期",
					sortable: false
				},
				State: {
					name: "列印狀態",
					sortable: false
				}
				// MillingFormula: {
				// 	name: "複雜算式",
				// 	sortable: false
				// },
				// MillingLength: {
				// 	name: "預計長度",
				// 	sortable: false
				// },
				// MillingWidth: {
				// 	name: "預計寬度",
				// 	sortable: false
				// },
				// MillingArea: {
				// 	name: "預估面積",
				// 	sortable: false
				// },
			},
			total: 0,
			list: [],
			tableSelect:[],
			checkIndeterminate: false,
			checkList: [],
			apiHeader: [ "SerialNo" ],
			options: {
				tenderMap: {},
				filterType: {
					1: "合約",
					2: "道管編號",
					3: "地點(關鍵字)"
				},
				deviceType: {
					1: "道路",
					2: "熱再生",
					3: "設施",
					4: "標線"
				},
				levelMap: {
					0: "全部",
					1: "輕",
					2: "中",
					3: "重"
				},
			}
		};
	},
	computed: {},
	watch: {},
	created() {
		getTenderMap().then(response => { this.options.tenderMap = response.data.tenderMap });
	},
	mounted() {
		this.showDetailDialog = false;
	},
	methods: {
		async handleCheckedChange(val) {
			this.tableSelect = val;
			if(this.tableSelect.length == this.list.length) this.tableSelect.forEach((_, index) => this.$set(this.checkList, index, true));
			if(this.tableSelect.length == 0) this.checkList = this.checkList.map(() => false);
		},
		cellCheckBox(row, index) {
			if(this.checkList[index]) this.$refs.caseTable.toggleRowSelection(row, true);
			else this.$refs.caseTable.toggleRowSelection(row, false);
		},
		caseFilterList(list) {
			// console.log(list);
			let caseFilterList = [];
			for(const row of list) {
				let caseItem = {};
				for(const key of this.apiHeader) caseItem[key] = row[key];
				caseFilterList.push(caseItem);
			}

			return caseFilterList;
		},
		downloadPdf(callback) {
			this.$confirm(`確認列印？`, "確認", { showClose: false }).then(() => {
				confirmInform({
					caseList: this.caseFilterList(this.tableSelect)
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						const caseSN = response.data.caseSN;
						this.$message({
							message: `製作成功(通報單號 ${caseSN})`,
							type: "success",
						});
						callback(caseSN);
					} else {
						this.$message({
							message: "製作失敗",
							type: "error",
						});
					}
					this.getList(false);
				})
			}).catch(err => {
				console.log(err);
				this.$refs.inspectionListPdf.showJobTicket = false;
				this.loading = false;
			});
		},
		showDetail(row) {
			this.loading = true;
			this.$refs.caseDetail.getDetail(row);
		},
		getList() {
			this.loading = true;
			this.list = [];
			this.tableSelect = [];

			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;

			getInform({
				filter: this.listQuery.filter,
				tenderId: this.listQuery.filterType == 1 ? this.listQuery.tenderId : null,
				caseNo: (this.listQuery.filterType == 2 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
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
					this.filterNow = this.listQuery.filter;
					this.listQuery.contractor = null;
					if(this.deviceTypeNow == 3) {
						const guildFilter = Object.keys(this.options.guildMap).filter(key => this.options.guildMap[key] == '泓景');
						if(guildFilter.length > 0) this.listQuery.contractor = Number(guildFilter[0]);
					}

					this.list.forEach(l => {
						l.DateCreate = this.formatTime(l.DateCreate);
						l.DateDeadline = this.formatTime(l.DateDeadline);
						for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea']) 
							if(Number(l[col])) l[col] = Math.round(l[col] * 1000) / 1000;
					})

					this.$refs.inspectionListPdf.imgPreload(this.list);
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		indexMethod(index) {
			return (index + 1 + (this.listQuery.pageCurrent - 1) * this.listQuery.pageSize);
		},
		formatter(row, column) {
			if (column.property.indexOf("id") == -1 && column.property.indexOf("Id") == -1 && Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property] || "-";
		},
		formatTime(time) {
			return moment(time).isValid() ? moment(time).utc().format("YYYY-MM-DD") : "-";
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.imgHover
	max-width: 800px
	// height: 400px
.case-inform
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
					margin-right: -3px
					transform: scale(0.7)
				&.tender-select
					width: 520px
					.el-input__inner
						padding-left: 10px
						text-align: left
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
	.btn-action
		margin-left: 5px
		padding: 5px
	.img-preview
		width: 100%
		.el-image-viewer__mask
			opacity: 0.7
		.el-icon-circle-close
			color:  #FFF
	.dialog-filter 
		.el-dialog
			width: 450px
			overflow: hidden
		.el-dialog__header
			background-color: #EBEEF5
		.el-dialog__body
			height: 80%
			padding: 10px
			margin: 0px 10px
			.el-row
				display: flex
				flex-wrap: wrap
				.el-col
					padding: 10px 0px
					position: relative
					&::before
						display: block
						content: ''
						position: absolute
						border: 1px solid #eee
						height: 100%
						width: 100%
					&.check-all-col::before
						box-shadow: 0px 0px 2px #409EFF
					.el-checkbox
						width: 100%
						padding-left: 20px
					.check-all-btn
						padding-left: 10px
						margin-bottom: 5px
						background-color: #F2F6FC
						border: none
						border-radius: 0px
						box-shadow: inset 0px 0px 1px #C0C4CC
						&.is-checked
							background-color: #409EFF
							span
								color: white
					.el-checkbox__input.is-indeterminate .el-checkbox__inner
						background-color: lighten(#409EFF, 15)
					.el-select
						width: 55px
						.el-input__inner
							padding: 0 13px 0 5px
							text-align: center
							background-color: transparent
						.el-input__suffix
							right: 0px
							margin-right: -3px
							transform: scale(0.7)
			.el-dialog__footer
				margin: 5px 0px
	.dialog-map
		min-height: 300px 
		.el-dialog__body
			height: 30%
</style>