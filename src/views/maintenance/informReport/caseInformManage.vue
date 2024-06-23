<template>
	<div class="app-container case-apply-manage" v-loading="loading">
		<h2>通報單管理</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>契約</span>
					</div>
					<el-select v-model.number="listQuery.groupId" class="tender-select" placeholder="請選擇" popper-class="type-select tender" clearable @clear="listQuery.groupId = null">
						<el-option v-for="(obj, id) in options.tenderGroup" :key="id" :value="Number(id)" :label="obj.groupName" />
					</el-select>
				</div>
			</div>
			<br>

			<!-- <span class="filter-item">
				<div style="font-size: 12px; color: #909399">建單日期</div>
				<time-picker shortcutType="year" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList" />
			</span> -->
			<div class="filter-item">
				<el-input v-model="listQuery.filterStr" placeholder="請輸入" style="width: 300px">
					<span slot="prepend">通報單號</span>
				</el-input>
			</div>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList();">搜尋</el-button>
		</div>

		<!-- <h5 v-if="list.length != 0 && (!listQuery.filterStr || listQuery.filterStr.length == 0)">查詢期間：{{ searchRange }}</h5> -->

		<el-table empty-text="目前沒有資料" :data="list" border fit :header-cell-style="{ 'background-color': '#F2F6FC' }"
			style="width: 100%">
			<el-table-column v-for="(value, key) in headers" :key="key" :prop="key" :label="value.name" align="center"
				min-width="30" :sortable="value.sortable">
				<template slot-scope="{ row, column }">
					<span v-if="[ 'InformType' ].includes(column.property)">
						<span>{{ options.deviceType[row.InformType] }}</span>
					</span>
					<span v-else-if="[ 'CaseNoArr' ].includes(column.property)">
						<span v-if="Object.keys(row.CaseNoObj).length != 0">
							<span>{{ Object.keys(row.CaseNoObj).length }}</span>
							<el-tooltip effect="dark" placement="bottom">
								<span slot="content">
									<div v-for="(obj, caseNo) in row.CaseNoObj" :key="`${caseNo}_${obj.flowState}`">
										{{ caseNo }}
										(<span v-if="obj.State & 16">已完工</span>
										<span v-else-if="obj.State & 8">送出派工單</span>
										<span v-else-if="obj.State & 4">已分派</span>
										<span v-else-if="obj.State & 2">待分派</span>
										<span v-else-if="obj.State == 1">
											<span v-if="obj.FlowState & 8">施工前會勘</span>
											<span v-else-if="obj.FlowState & 4 || obj.FlowState & 64">分隊審核</span>
											<span v-else-if="obj.FlowState & 2 || obj.FlowState & 32">機關審核</span>
											<span v-else-if="obj.FlowState & 1">主任審核</span>
											<span v-else>上傳至新工</span>
										</span>
										<span v-else-if="obj.State == 0">已成案</span>
										<span v-else>{{ obj.State }}</span>)
									</div>
								</span>
								<i class="icon-tooltip el-icon-warning" />
							</el-tooltip>
						</span>
						<span v-else> - </span>
					</span>
					<span v-else>
						<span>{{ row[column.property] || "-" }}</span>
					</span>
				</template>
			</el-table-column>
			<!-- <el-table-column label="通報" align="center" min-width="40">
				<template slot-scope="{ row }">
					<span v-if="row.InformState & 2">
						<i class="el-icon-check" style="color: #67C23A" />
						<div v-if="row.Bit2_At">({{ row.Bit2_At }})</div>
					</span>
					<el-button class="btn-action" :type="row.InformState & 2 ? 'info' : 'primary'" @click="applyReview(row)">
						{{ row.InformState & 2 ? '檢視' : '通報' }}
					</el-button>
					<el-button
						v-if="!(row.InformState & 2) && Object.values(row.CaseNoObj).every(obj => (obj.FlowState & 2 || obj.FlowState & 32) && (obj.FlowState & 4 || obj.FlowState & 64))"
						class="btn-action" type="success" @click="informConfirm(row, 2)">完成</el-button>
				</template>
			</el-table-column> -->
			<el-table-column label="會勘" align="center" min-width="40">
				<template slot-scope="{ row }">
					<span v-if="row.InformState & 4">
						<i class="el-icon-check" style="color: #67C23A" />
						<div v-if="row.Bit4_At">({{ row.Bit4_At }})</div>
					</span>
					<template v-else-if="row.InformState & 2">
						<el-button class="btn-action" type="warning"
							@click="ApplyId = String(row.id); showPDFDialog = true;">路段表PDF</el-button>
						<el-button class="btn-action" type="success" @click="informConfirm(row, 4)">完成</el-button>
					</template>
					<span v-else> - </span>
				</template>
			</el-table-column>
			<el-table-column label="派工" align="center" min-width="40">
				<template slot-scope="{ row }">
					<span v-if="row.InformState & 8">
						<i class="el-icon-check" style="color: #67C23A" />
						<div v-if="row.Bit8_At">({{ row.Bit8_At }})</div>
					</span>
					<el-button v-else-if="row.InformState & 4" class="btn-action" type="success"
						@click="informConfirm(row, 8)">完成</el-button>
					<span v-else> - </span>
				</template>
			</el-table-column>
			<el-table-column label="計價" align="center" min-width="40">
				<template slot-scope="{ row }">
					<span v-if="row.InformState & 16">
						<i class="el-icon-check" style="color: #67C23A" />
						<div v-if="row.Bit16_At">({{ row.Bit16_At }})</div>
					</span>
					<el-button v-else-if="row.InformState & 8" class="btn-action" type="success"
						@click="informConfirm(row, 16)">完成</el-button>
					<span v-else> - </span>
				</template>
			</el-table-column>
			<el-table-column label="結案" align="center" min-width="40">
				<template slot-scope="{ row }">
					<span v-if="row.InformState & 32">
						<i class="el-icon-check" style="color: #67C23A" />
						<div v-if="row.Bit32_At">({{ row.Bit32_At }})</div>
					</span>
					<el-button v-else-if="row.InformState & 16" class="btn-action" type="success"
						@click="informConfirm(row, 32)">結案</el-button>
					<span v-else> - </span>
				</template>
			</el-table-column>

			<el-table-column label="動作" align="center" min-width="40">
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="info" plain @click="applyTicketDetail(row)">檢視</el-button>
					<el-button class="btn-action" type="info" @click="reissueApplyTicket(row)">列印通報單</el-button>
				</template>
			</el-table-column>
		</el-table>

		<apply-ticket-pdf ref="applyTicketPdf" style="display: none" :loading.sync="loading"
			:tableSelect.sync="tableSelect" />

		<!-- 會勘路段表PDF -->
		<el-dialog :visible.sync="showPDFDialog" title="會勘路段表" width="1200px">
			<meeting-pdf :ApplyId="ApplyId" />
		</el-dialog>
		
		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize"
			@pagination="getList" />
	</div>
</template>

<script>
import moment from "moment";
import checkPermission from '@/utils/permission';
import { getTenderGroup } from "@/api/type";
import { getApplyInform, getInformTicketList, setinformTicketList } from "@/api/dispatch";
import Pagination from "@/components/Pagination";
import ApplyTicketPdf from "@/components/ApplyTicketPdf";
import meetingPdf from "@/views/maintenance/inform/pdf/meetingPDF.vue";

export default {
	name: "caseApplyManage",
	components: { ApplyTicketPdf, Pagination, meetingPdf },
	data() {
		return {
			loading: false,
			screenWidth: window.innerWidth,
			showPDFDialog: true,
			meetingPDFRef: null,
			// timeTabId: 2,
			// dateRange: [
			// 	moment().startOf("month").toDate(),
			// 	moment().endOf("day").toDate(),
			// ],
			searchRange: "",
			listQuery: {
				groupId: null,
				filterStr: null,
				deviceType: 1,
				pageCurrent: 1,
				pageSize: 50
			},
			headers: {
				CaseSN: {
					name: "通報單號",
					sortable: true
				},
				InformType: {
					name: "通報類型",
					sortable: true
				},
				CaseNoArr: {
					name: "案件數量",
					sortable: false
				},
				Create_At: {
					name: "建單時間",
					sortable: false
				},
			},
			total: 0,
			list: [],
			// detail: [],
			tableSelect: [],
			ApplyId: 0,
			options: {
				tenderGroup: {},
				deviceType: {
					1: "道路",
					2: "熱再生",
					3: "設施",
					4: "標線"
				},
			}
		};
	},
	computed: { },
	watch: {
		"pdfSetting.fontSize"() {
			this.pdfSetting.lineHeight = (this.pdfSetting.fontSize + 2) * 0.35;
		}
	},
	created() { 
		getTenderGroup().then(response => { this.options.tenderGroup = response.data.tenderGroup });
		this.getList();
	},
	mounted() {
		this.showPDFDialog = false;
	},
	methods: {
		checkPermission,
		getList(showMsg = true) {
			this.loading = true;
			this.list = [];

			getInformTicketList({
				groupId: this.listQuery.groupId || 0,
				caseSN: this.listQuery.filterStr,
				pageCurrent: this.listQuery.pageCurrent,
				pageSize: this.listQuery.pageSize
			}).then(response => {
				if (response.data.list.length == 0) {
					if (showMsg) this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
				} else {
					this.list = response.data.list;
					console.log(this.list);
					this.list.forEach(l => {
						l.Create_At = this.formatDate(l.Create_At);
						l.Bit1_At = this.formatDate(l.Bit1_At);
						l.Bit2_At = this.formatDate(l.Bit2_At);
						l.Bit4_At = this.formatDate(l.Bit4_At);
						l.Bit8_At = this.formatDate(l.Bit8_At);
						l.Bit16_At = this.formatDate(l.Bit16_At);
						l.Bit32_At = this.formatDate(l.Bit32_At);
					})
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		applyTicketDetail(row) {
			this.$router.push({
				name: "caseInform",
				params: { groupId: row.GroupId, informType: row.InformType, caseSN: row.CaseSN },
			});
		},
		applyReview(row) {
			this.$router.push({
				name: "applyReview",
				params: { groupId: row.GroupId, caseSN: row.CaseSN },
			});
		},
		informConfirm(row, state) {
			const textOption = {
				2: '判核',
				4: '會勘',
				8: '派工',
				16: '計價',
				32: '結案'
			}

			this.$confirm(`確定提交「${textOption[state]}」完成?`, "確認", {
				showClose: false,
			}).then(() => {
				this.loading = true;
				console.log(row);
				
				setinformTicketList(row.id, {
					informState: row.InformState + state
				}).then(response => {
					if (response.statusCode == 20000) {
						this.$message({
							message: "提交成功",
							type: "success",
						});
						this.getList();
					}
				}).catch(err => {
					console.log(err);
					this.getList();
				})
			}).catch(err => console.log(err));
		},
		reissueApplyTicket(row) {
			// console.log(row);
			this.loading = true;

			getApplyInform({
				groupId: row.GroupId,
				caseSN: row.CaseSN,
				pageCurrent: 1,
				pageSize: 999999
			}).then(response => {
				const list = response.data.list;
				list.forEach(l => {
					l.DateCreate = this.formatDate(l.DateCreate);
					l.DateDeadline = this.formatDate(l.DateDeadline);
					for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea'])
						if (Number(l[col])) l[col] = Math.round(l[col] * 1000) / 1000;
				})

				this.tableSelect.splice(0, this.tableSelect.length, ...list);
				this.$refs.applyTicketPdf.imgPreload(this.tableSelect);
				this.$refs.applyTicketPdf.createPdf(row.CaseSN, "通報", this.options.tenderGroup[this.listQuery.groupId].groupName).then(() => { 
					this.$refs.applyTicketPdf.pdfDoc.save(`修復通報單_${row.CaseSN}.pdf`); 
					this.loading = false;
				});
			}).catch(err => this.loading = false);
		},
		// getMeetingPDF(row) {
		// 	this.caseSN = String(row.CaseSN);

		// 	// getInformTicketListPDF({ caseSN: row.CaseSN }).then(response => {
		// 	// 	this.loading = false;
		// 	// 	this.showPDFDialog = true;
		// 	// }).catch(err => this.loading = false);
		// },
		formatDate(time) {
			return time ? moment(time).format("YYYY-MM-DD") : "";
		},
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.case-apply-manage
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
					transform: scale(0.7)
				&.tender-select
					width: 330px
					.el-input__inner
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
		.footer-btns
			display: flex
			justify-content: center
</style>
