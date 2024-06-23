<template>
	<div class="app-container apply-review" v-loading="loading">
		<h2>分工判核</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>契約</span>
					</div>
					<el-select v-model.number="listQuery.groupId" class="tender-select" placeholder="請選擇"
						popper-class="type-select tender" clearable @clear="listQuery.groupId = null">
						<el-option v-for="(obj, id) in options.tenderGroup" :key="id" :value="Number(id)" :label="obj.groupName" />
					</el-select>
				</div>
			</div>
			<br>
			<div class="filter-item">
				<el-input v-model="listQuery.filterStr" placeholder="請輸入" style="width: 300px">
					<span slot="prepend">通報單號</span>
				</el-input>
			</div>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList();">搜尋</el-button>
		</div>

		<el-table ref="caseTable" empty-text="目前沒有資料" :data="list" border fit highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }" stripe style="width: 100%">
			<el-table-column prop="CaseSN" label="通報單號" width="125" align="center" fixed sortable />
			<el-table-column prop="CaseNo" label="案件編號" width="130" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseNo }}</span>
					<br>
					<span style="color: #909399; font-size: 12px">{{ row.DName }} ({{ row.casetype }})</span>
				</template>
			</el-table-column>

			<el-table-column v-for="(value, key) in headers" :key="key" :prop="key" :label="value.name" align="center"
				:formatter="formatter" :sortable="value.sortable" />

			<!-- <el-table-column label="廠商審核" width="140" align="center">
				<template slot-scope="{ row }">

				</template>
			</el-table-column> -->

			<el-table-column label="監造審核" width="140" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.FlowState & 2 || row.FlowState & 32">
						<span v-if=" row.FlowState & 2">廠商</span>
						<span v-else>分隊</span>
						<div v-if="row.FlowDesc.SV && row.FlowDesc.SV.length > 0">({{ row.FlowDesc.SV }})</div>
					</span>
					<el-button-group v-else>
						<el-button type="primary" size="mini" @click="setResult(row, 32)">分隊</el-button>
						<el-button type="success" size="mini" @click="setResult(row, 2)">廠商</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column label="分隊審核" width="140" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.FlowState & 4 || row.FlowState & 64">
						<span v-if="row.FlowState & 4">廠商</span>
						<span v-else>分隊</span>
						<div v-if="row.FlowDesc.Team && row.FlowDesc.Team.length > 0">({{ row.FlowDesc.Team }})</div>
					</span>
					<el-button-group v-else>
						<el-button type="primary" size="mini" @click="setResult(row, 64)">分隊</el-button>
						<el-button type="success" size="mini" @click="setResult(row, 4)">廠商</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column label="狀態" width="140" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 16">已完工</span>
					<span v-else-if="row.State & 8">送出派工單</span>
					<span v-else-if="row.State & 4">已分派</span>
					<span v-else-if="row.State & 2">待分派</span>
					<span v-else-if="row.State == 1">
						<span v-if="row.FlowState & 8">施工前會勘</span>
						<span v-else-if="row.FlowState & 4 || row.FlowState & 64">分隊審核</span>
						<span v-else-if="row.FlowState & 2 || row.FlowState & 32">機關審核</span>
						<span v-else-if="row.CaseSN != 0">製作通報單</span>
						<span v-else-if="row.FlowState & 1">主任審核</span>
						<span v-else>上傳至新工</span>
					</span>
					<span v-else-if="row.State == 0">已成案</span>
					<span v-else>{{ row.State }}</span>
				</template>
			</el-table-column>

			<el-table-column label="動作" width="140" align="center">
				<template slot-scope="{ row }">
					<el-button type="info" size="mini" @click="showDetail(row)">檢視</el-button>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize"
			@pagination="getList" />

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
import { getTenderGroup, getDTypeMap } from "@/api/type";
import { getApplyReviewList } from "@/api/dispatch";
import { setCaseTrackingFlow } from "@/api/inspection";
import TimePicker from "@/components/TimePicker";
import Pagination from "@/components/Pagination";
import CaseDetail from "@/components/CaseDetail";

export default {
	name: "applyReview",
	components: { TimePicker, Pagination, CaseDetail },
	data() {
		return {
			loading: false,
			showImgViewer: false,
			showDetailDialog: true,
			showEdit: false,
			map: {},
			imgUrls: "",
			timeTabId: 1,
			screenWidth: window.innerWidth,
			dateRange: [
				moment().subtract(1, 'd').startOf("day").toDate(),
				moment().subtract(1, 'd').endOf("day").toDate(),
			],
			searchRange: "",
			listQuery: {
				groupId: null,
				caseSN: null,
				pageCurrent: 1,
				pageSize: 50,
			},
			headers: {
				DistressType: {
					name: "缺失類型",
					sortable: true
				},
				DistressLevel: {
					name: "損壞程度",
					sortable: true
				},
				Place: {
					name: "案件地點",
					sortable: false
				},
				DateCreate: {
					name: "通報時間",
					sortable: true
				},
				// DateDeadline: {
				// 	name: "預計完工日期",
				// 	sortable: false
				// }
			},
			total: 0,
			list: [],
			detail: [],
			options: {
				tenderGroup: {},
				DistressType: {},
				DistressTypeFlat: {},
				DistressLevel: {
					1: "輕",
					2: "中",
					3: "重"
				}
			}
		};
	},
	computed: { },
	watch: {},
	created() { 
		getTenderGroup().then(response => { this.options.tenderGroup = response.data.tenderGroup });
		
		getDTypeMap().then(response => {
			this.options.DistressType = response.data.distressTypeMap;
			this.options.DistressTypeFlat = Object.values(this.options.DistressType).reduce((acc, cur) => {
				for (const key in cur) acc[key] = cur[key];
				return acc;
			}, {});
		})

		if (this.$route.params.groupId && this.$route.params.caseSN) {
			this.listQuery.groupId = this.$route.params.groupId;
			this.listQuery.filterStr = this.$route.params.caseSN;
			this.getList();
		}
	},
	mounted() {
		this.showDetailDialog = false;
	},
	methods: {
		getList(showMsg = true) {
			if (!this.listQuery.groupId || !this.listQuery.filterStr || this.listQuery.filterStr.length == 0) {
				this.$message({
					message: "請輸入合約和通報單號",
					type: "warning",
				});
			} else {
				this.loading = true;
				this.list = [];

				getApplyReviewList({
					groupId: this.listQuery.groupId,
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
						this.total = response.data.total;

						this.list.forEach(l => {
							l.DateCreate = this.formatDate(l.DateCreate);
							l.DateDeadline = this.formatDate(l.DateDeadline);
							for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea'])
								if (Number(l[col])) l[col] = Math.round(l[col] * 1000) / 1000;
						})
					}
					this.loading = false;
				}).catch(err => this.loading = false);
			}
		},
		setResult(row, state) {
			const confirmText = (state & 32 || state & 64) ? '分隊' : '廠商';
			this.$prompt(`確定給「${confirmText}」辦理?`, "確認", { 
				showClose: false,
				inputPlaceholder: "備註"
			}).then(({value}) => {
				this.loading = true;
				if (state == 2 || state == 32) row.FlowDesc.SV = value;
				if (state == 4 || state == 64) row.FlowDesc.Team = value;

				setCaseTrackingFlow(row.SerialNo, {
					flowState: row.FlowState + state,
					flowDesc: JSON.stringify(row.FlowDesc)
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
		showDetail(row) {
			this.loading = true;
			this.$refs.caseDetail.getDetail(row);
		},
		formatter(row, column) {
			if (["DistressType"].includes(column.property)) return this.options.DistressTypeFlat[row.DistressType];
			else if (["DistressLevel"].includes(column.property)) return this.options.DistressLevel[row.DistressLevel];
			else if (column.property.indexOf("id") == -1 && column.property.indexOf("Id") == -1 && Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property] || "-";
		},
		formatDate(time) {
			return moment(time).isValid() ? moment(time).format("YYYY-MM-DD") : "-";
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
.apply-review
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
					width: 330px
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