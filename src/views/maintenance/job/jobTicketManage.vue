<template>
	<div class="app-container job-ticket-manage" v-loading="loading">
		<h2>派工單管理</h2>
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
			<br>

			<span class="filter-item">
				<div style="font-size: 12px; color: #909399">建單日期</div>
				<time-picker shortcutType="year" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			</span>
			<div class="filter-item">
				<el-input v-model="listQuery.filterStr" placeholder="請輸入" style="width: 300px" >
					<span slot="prepend">派工單號</span>
				</el-input>
			</div>
			
			<!-- <div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>合約</span>
					</div>
					<el-select v-model="listQuery.tenderId" class="tender-select" placeholder="請選擇" popper-class="type-select tender">
						<el-option v-for="(obj, id) in options.tenderMap" :key="id" :value="id" :label="obj.tenderName" />
					</el-select>
				</div>
			</div> -->

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList();">搜尋</el-button>
			<!-- <el-button class="filter-item" type="info" icon="el-icon-document" :circle="screenWidth < 567" @click="handleDownload">輸出列表</el-button> --> 
			<el-checkbox v-model="listQuery.filter" style="margin-left: 20px">已退回</el-checkbox>
		</div>

		<h5 v-if="list.length != 0 && (!listQuery.filterStr || listQuery.filterStr.length == 0)">查詢期間：{{ searchRange }}</h5>

		<el-table
			empty-text="目前沒有資料"
			:data="list"
			:key="deviceTypeNow"
			border
			fit
			:row-class-name="tableRowClassName"
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			style="width: 100%"
		>

			<el-table-column v-if="!filterNow" label="退回" width="60" align="center" fixed>
				<template slot-scope="{ row }">
					<el-button v-if="row.DateClose.length == 0 && deviceTypeNow != 4" type="danger" size="mini" style="padding: 5px" @click="beforeRemove(row, 1)">主任</el-button>
					<span v-else> - </span>
				</template>
			</el-table-column>

			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:min-width="['Amount'].includes(key) ? 60 : 30"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="[ 'CaseNoArr' ].includes(column.property)">
						<!-- <span v-if="row.CaseNoArr.length != 0">{{ row.CaseNoArr.join("、") }}</span> -->
						<span v-if="row.CaseNoActiveArr.length != 0">
							<span>{{ row.CaseNoActiveArr.length }}</span>
							<el-tooltip effect="dark" placement="bottom">
								<span slot="content">
									<div v-for="(caseNo, index) in row.CaseNoActiveArr" :key="`${caseNo}_${index}`">{{ caseNo }}
										<span v-if="row.CaseIsCancelArr && row.CaseIsCancelArr[index] == 1" style="color: #909399">(不需施作)</span>
									</div>
									<div v-for="caseNo in row.CaseNoInActiveArr" :key="caseNo">{{ caseNo }}<span style="color: #F56C6C">(退回)</span></div>
								</span>
								<i class="icon-tooltip el-icon-warning" />
							</el-tooltip>
						</span>
						<span v-else> - </span>
					</span>
					<span v-else-if="[ 'Amount' ].includes(column.property)">
						<el-input v-if="row.edit && row.DateClose.length != 0" v-model.number="row.Amount" style="width: 80%" />
						<span v-else>{{ row.DateClose.length != 0 ? row.Amount : "-" }}</span>
						<el-button v-if="row.DateClose.length != 0 && !row.edit" type="text" style="margin-left: 10px" size="mini" @click="row.edit = true"><i class="el-icon-edit" /></el-button>
						<span v-if="row.edit">
							<el-button type="text" @click="editJobTicketAmt(row)"><i class="el-icon-check" style="color: #67C23A"/></el-button>
							<el-button type="text" style="margin-left: 5px" @click="row.edit=false; getList()"><i class="el-icon-close" style="color: #F56C6C" /></el-button> 
						</span>
					</span>
					<span v-else>
						<span>{{ row[column.property] || "-" }}</span>
						<!-- <span v-if="[ 'OrderSN' ].includes(column.property)">
							<span v-if="!row.IsActive" style="color: #F56C6C">(已刪除)</span>
							<span v-else-if="row.DateClose.length != 0" style="color: #67C23A">(已完成)</span>
						</span> -->
					</span>
				</template>
			</el-table-column>

			<el-table-column :key="deviceTypeNow" label="狀態" min-width="30" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.IsActive == 0" style="color: #F56C6C">退回
						<!-- <i class="el-icon-close" style="color: #F56C6C" /> -->
					</span>
					<span v-else-if="row.DateClose.length != 0" style="color: #67C23A">完成
						<!-- <i class="el-icon-check" style="color: #67C23A" /> -->
						<el-button v-if="checkPermission(['restored.reporter'])" type="success" size="mini" plain round style="padding: 5px" @click="unFinRegisterSpec(row)">復原</el-button>
					</span>
					<span v-else>
						<span>施工中</span>
						<!-- <el-button class="btn-action" type="danger" plain size="mini" round @click="setCaseStatus(row, 8)">退回</el-button> -->
					</span>
				</template>
			</el-table-column>
			
			<el-table-column v-if="!filterNow" :key="filterNow" label="動作" align="center">
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="primary" plain size="mini" @click="showTicketDetail(row)">檢視</el-button>
					<el-button v-if="row.DateClose.length == 0" class="btn-action" type="success" plain size="mini" @click="editJobTicket(row)">編輯</el-button>
					<el-button v-if="row.DateClose.length == 0" class="btn-action" type="info" size="mini" @click="reissueJobTicket(row)">補印派工單</el-button>
				</template>
			</el-table-column>
		</el-table>

		<job-ticket-pdf ref="jobTicketPdf" style="display: none" :loading.sync="loading" :tableSelect.sync="caseSpec" :deviceTypeNow="deviceTypeNow" :contractorNow="contractorNow" :guildMap="options.guildMap" :deviceTypeMap="options.deviceType" />

		<!-- <pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" /> -->

		<!-- Dialog: 案件退回 -->
		<el-dialog
			:visible.sync="showRevokeConfirm"
			width="300px"
			:show-close="false"
			:close-on-click-modal="false"
			:close-on-press-escape="false"
			center
		>	
			<span slot="title">
				<span v-if="rowActive.revokeType == 1">確認退回 派工單號{{ rowActive.OrderSN }} 至「主任分派」?</span>
				<!-- <span v-else-if="rowActive.revokeType == 2">確認退回 派工單號{{ rowActive.OrderSN }} 至「製作派工單」?</span> -->
			</span>
			<div v-if="rowActive.revokeType == 1">原因: 
				<el-select v-model="rowActive.revokeReason">
					<el-option v-for="( name, key ) in options.reasonType" :key="key" :label="name" :value="Number(key)" />
				</el-select>
				備註:
				<el-input v-model="revokeTextarea" class="revokeReasonNote" type="textarea" :rows="2" placeholder="請輸入備註" />
			</div>
			<span slot="footer" class="footer-btns">
				<el-button @click="showRevokeConfirm = false; revokeTextarea=''; getList();">取消</el-button>
				<el-button type="primary" @click="removeDispatch()">確定</el-button>
			</span>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import checkPermission from '@/utils/permission';
import { getTenderMap, getGuildMap } from "@/api/type";
import { getJobTicketList, getJobTicketSpec, setJobTicketAmt, revokeDispatch, unFinRegister } from "@/api/dispatch";
import TimePicker from "@/components/TimePicker";
import JobTicketPdf from "@/components/JobTicketPdf";

export default {
	name: "jobTicketManage",
	components: { JobTicketPdf, TimePicker },
	data() {
		return {
			loading: false,
			showRevokeConfirm: false,
			screenWidth: window.innerWidth,
			timeTabId: 2,
			dateRange: [
				moment().startOf("month").toDate(),
				moment().endOf("day").toDate(),
			],
			searchRange: "",
			deviceTypeNow: 1,
			contractorNow: 0,
			filterNow: false,
			listQuery: {
				filter: false,
				filterStr: null,
				tenderId: null,
				deviceType: 1,
				contractor: null,
				// pageCurrent: 1,
				// pageSize: 50,
			},
			headers: {
				OrderSN: {
					name: "派工單號",
					sortable: true
				},
				Contractor: {
					name: "廠商",
					sortable: false
				},
				OrderType: {
					name: "維護類型",
					sortable: false
				},
				CaseNoArr: {
					name: "案件數量",
					sortable: false
				},
				Creater: {
					name: "建單人員",
					sortable: false
				},
				DateAssign: {
					name: "建單時間",
					sortable: false
				},
				DateClose: {
					name: "完工時間",
					sortable: false,
				},
				Amount: {
					name: "總金額",
					sortable: false,
				}
			},
			// total: 0,
			list: [],
			// detail: [],
			rowActive: {},
			options: {
				tenderMap: {},
				guildMap: {},
				deviceType: {
					1: "道路",
					2: "熱再生",
					3: "設施",
					4: "標線"
				},
				reasonType: {
					1: "無需施作",
					2: "退回重派"
				}
			},
			revokeTextarea: ""
		};
	},
	computed: { },
	watch: {
		"pdfSetting.fontSize"() {
			this.pdfSetting.lineHeight = (this.pdfSetting.fontSize + 2) * 0.35;
		}
	},
	created() { 
		this.caseSpec = [];
		getTenderMap().then(response => { this.options.tenderMap = response.data.tenderMap });
		getGuildMap().then(response => { this.options.guildMap = response.data.guildMap });
	},
	mounted() { },
	methods: {
		checkPermission,
		tableRowClassName({row, rowIndex}) {
			if (row.DateClose.length != 0) return 'success-row';
			return '';
		},
		getList(showMsg = true) {
			if (!Number(this.listQuery.contractor)) {
				this.$message({
					message: "請選擇廠商",
					type: "error",
				});
			} else {
				this.loading = true;
				this.list = [];
				this.deviceTypeNow = this.listQuery.deviceType;

				let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
				let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
				this.searchRange = startDate + " - " + endDate;

				getJobTicketList({
					filter: this.listQuery.filter,
					contractor: this.listQuery.contractor,
					dispatchSN: this.listQuery.filterStr,
					deviceType: this.listQuery.deviceType,
					timeStart: startDate,
					timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD")
				}).then(response => {
					if (response.data.list.length == 0) {
						if(showMsg) this.$message({
							message: "查無資料",
							type: "error",
						});
						this.total = 0;
					} else {
						this.list = response.data.list;
						this.checkList = Array.from({ length: this.list.length }, () => false);
						this.deviceTypeNow = this.listQuery.deviceType;
						this.contractorNow = this.listQuery.contractor;
						this.filterNow = this.listQuery.filter;

						this.list.forEach(l => {
							l.Contractor = this.options.guildMap[l.Contractor];
							l.OrderType = this.options.deviceType[l.OrderType];
							l.CaseNoActiveArr = l.CaseNoActiveArr.filter(caseNo => Number(caseNo) != 0);
							l.CaseNoInActiveArr = l.CaseNoInActiveArr.filter(caseNo => Number(caseNo) != 0);
							l.DateAssign = this.formatDate(l.DateAssign);
							l.DateClose = this.formatDate(l.DateClose);

							this.$set(l, "edit", false);
						})
					}
					this.loading = false;
				}).catch(err => this.loading = false);
			}
		},
		formatDate(time) {
			return time ? moment(time).format("YYYY-MM-DD"): "";
		},
		showTicketDetail(row) {
			this.$router.push({
				name: "finRegister",
				query: { deviceType: this.deviceTypeNow, contractor: this.contractorNow, orderSN: row.OrderSN },
			});
		},
		editJobTicketAmt(row) {
			this.$confirm(`確認修改 派工單號${row.OrderSN} 的金額為 ${row.Amount} ?`, "確認", { showClose: false })
				.then(() => {
					setJobTicketAmt({
						orderSN: row.OrderSN,
						amount: Number(row.Amount)
					}).then(response => {
						if ( response.statusCode == 20000 ) {
							this.$message({
								message: "修改成功",
								type: "success",
							});
						} else {
							this.$message({
								message: "修改失敗",
								type: "error",
							});
						}
						this.getList();
					}).catch(err => {
						console.log(err);
						this.getList();
					});
				}).catch(err => {});
		},
		unFinRegisterSpec(row) {
			this.$confirm(`確認解除 派工單號${row.OrderSN} 「完工登錄」狀態?`, "確認", { showClose: false })
				.then(() => {
					unFinRegister({
						orderSN: row.OrderSN
					}).then(response => {
						if ( response.statusCode == 20000 ) {
							this.$message({
								message: "解除成功",
								type: "success",
							});
						} else {
							this.$message({
								message: "解除失敗",
								type: "error",
							});
						}
						this.getList();
					}).catch(err => {
						console.log(err);
						this.getList();
					});
				}).catch(err => {});
		},
		editJobTicket(row) {
			this.$router.push({
				name: "jobTicketEdit",
				params: { deviceType: this.deviceTypeNow, contractor: this.contractorNow, orderSN: row.OrderSN },
			});
		},
		reissueJobTicket(row) {
			// console.log(row);
			getJobTicketSpec({
				dispatchSN: row.OrderSN,
				deviceType: this.listQuery.deviceType
			}).then(async(response) => {
				this.caseSpec.splice(0, this.caseSpec.length, ...response.data.list);

				this.caseSpec.forEach((l, i) => {
					for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea']) 
						if(Number(l[col])) l[col] = Math.round(l[col] * 1000) / 1000;
				});
				this.$refs.jobTicketPdf.imgPreload(this.caseSpec);

				switch(this.deviceTypeNow) {
					case 1:
						this.caseSpec.forEach((l, i) => {
							l.tonne = Math.round(l.MillingArea*l.MillingDepth*0.01*2.25*10) / 10;
						});
						this.$refs.jobTicketPdf.createPdf_AC(row.OrderSN).then(() => { this.$refs.jobTicketPdf.pdfDoc.save(`維修派工單_${row.OrderSN}.pdf`) });
						break;
					case 2:
						this.$refs.jobTicketPdf.createPdf_HR(row.OrderSN).then(() => { this.$refs.jobTicketPdf.pdfDoc.save(`維修派工單_${row.OrderSN}.pdf`) });	
						break;
					case 3:
						this.caseSpec.forEach((l, i) => {
							l.DatePlan = this.formatDate(l.DatePlan);
							l.DateDeadline = (l.DateDeadline == null) ? "" : this.formatDate(l.DateDeadline);
						});
						this.$refs.jobTicketPdf.createPdf_FA(row.OrderSN).then(() => { this.$refs.jobTicketPdf.pdfDoc.save(`維修派工單_${row.OrderSN}.pdf`) });	
						break;
					case 4:
						this.$refs.jobTicketPdf.createPdf_MK(row.OrderSN).then(() => { this.$refs.jobTicketPdf.pdfDoc.save(`維修派工單_${row.OrderSN}.pdf`) });	
						break;
				}
			}).catch(err => this.loading = false);
		},
		// 退回
		beforeRemove(row, revokeType) {
			this.rowActive = JSON.parse(JSON.stringify(row)); 
			this.$set(this.rowActive, "revokeType", revokeType);
			this.$set(this.rowActive, "revokeTextarea", this.revokeTextarea);
			if(revokeType == 1) this.$set(this.rowActive, "revokeReason", 1);

			this.showRevokeConfirm = true;
		},
		removeDispatch() {
			// revokeType(退回類型)- 1: 退回主任分派, 2: 退回廠商製作派工單"
			if (this.rowActive.revokeType == 1) 
				this.rowActive.revokeReason = this.options.reasonType[this.rowActive.revokeReason];
			let mergeRevokeReason = String(this.rowActive.revokeReason) + "-" + String(this.revokeTextarea);
			revokeDispatch({
				revokeType: this.rowActive.revokeType,
				revokeReason: mergeRevokeReason,
				deviceType: this.deviceTypeNow,
				dispatchSN: this.rowActive.OrderSN
			}).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "退回成功",
						type: "success",
					});
				} else {
					this.$message({
						message: "退回失敗",
						type: "error",
					});
				}
				this.getList(false);
				this.showRevokeConfirm = false;
			}).catch(err => {
				console.log(err);
				this.getList(false);
				this.showRevokeConfirm = false;
			});
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.job-ticket-manage
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
		.success-row 
			background: #F0F9EB
			&.hover-row > td
				background-color: initial !important
		.btn-action
			margin-left: 5px
			padding: 5px
	.btn-dialog
		padding: 5px 5px
	.el-dialog
		.el-dialog__body > div
			margin-top: 10px
		.el-select
			margin-top: 5px
			margin-bottom: 5px
			width: 250px
		.revokeReasonNote
			margin-top: 5px
			width: 250px
		.footer-btns
			display: flex
			justify-content: center
</style>
