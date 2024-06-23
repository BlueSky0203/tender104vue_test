<template>
	<div class="app-container contract" v-loading="loading">
		<h2>合約管理</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="filter-item">
					<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
						<div class="el-input-group__prepend">
							<span>合約</span>
						</div>
						<el-select v-model.number="listQuery.tenderId" class="tender-select" placeholder="請選擇" popper-class="type-select tender" @change="listQuery.pageCurrent = 1; getList();">
							<el-option v-for="(obj, id) in options.tenderMap" :key="id" :value="Number(id)" :label="obj.tenderName" />
						</el-select>
					</div>
				</div>
			</div>
			<el-button-group style="float: right;">
				<el-button type="primary" @click="getAction">重整</el-button>
				<el-button type="success" @click="showAddDialog = true">新增</el-button>
			</el-button-group>
		</div>

		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
			style="width: 100%"
		>
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:min-width="key == 'round' ? 60 : ['title', 'roundStart', 'roundEnd'].includes(key) ? 100 : null"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="[ 'title', 'roundStart', 'roundEnd' ].includes(column.property) && row.edit">
						<el-date-picker v-if="[ 'roundStart', 'roundEnd' ].includes(column.property)" v-model="row[column.property]" type="date" size="mini" value-format="yyyy-MM-dd" placeholder="選擇日期" style="width: 134px" />
						<el-input v-else-if="[ 'title' ].includes(column.property)" v-model="row[column.property]" size="mini" style="width: 134px" />
						<el-button type="text" @click="row.edit = false; setRound(row);">
							<i class="el-icon-success" />
						</el-button>
						<el-button type="text" @click="row.edit = false; getList();">
							<i class="el-icon-error" />
						</el-button>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" width="120" align="center">
				<template slot-scope="{ row }">
					<span v-if="!row.archiveTime">
						<el-button v-if="!row.edit" class="btn-action" type="primary" plain @click="row.edit = true">編輯</el-button>
						<el-button v-else type="info" class="btn-action" @click="row.edit = false; getList();">取消</el-button>
					</span>
					<span v-else style="color: #F56C6C">已封存 <br> ({{ formatTime(row.archiveTime) }})</span>
				</template>
			</el-table-column>
			<el-table-column v-if="/^1\d{2}1$/.test(listQuery.tenderId)" :key="listQuery.tenderId" label="上傳至新工" min-width="80" align="center">
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="warning" plain :disabled="isUpload" style="margin-bottom: 5px;" @click="uploadCase2NCO(row)">上傳</el-button>
					<el-progress v-if="row.actionId" text-inside :stroke-width="16" :percentage="row.process" />
				</template>
			</el-table-column>

			<el-table-column v-if="listQuery.tenderId > 1001" :key="listQuery.tenderId" label="缺失匯入" min-width="100" align="center">
				<template slot-scope="{ row }">
					<el-button-group v-if="!row.edit">
						<el-button class="btn-action" type="info" plain :disabled="isUpload" @click="uploadCase(row, 1, true)">重點</el-button>
						<el-button class="btn-action" type="primary" plain :disabled="isUpload" @click="uploadCase(row, 1, false)">通報</el-button>
						<el-button class="btn-action" type="warning" plain :disabled="isUpload" @click="uploadCase(row, 2, false)">PCI</el-button>
					</el-button-group>
				</template>
			</el-table-column>
		</el-table>

		<el-dialog title="新增" :visible.sync="showAddDialog"	width="360px">
			<el-form ref="form" label-width="100px">
				<el-form-item label="輪次">
					<el-input-number v-model="newRoundForm.round" controls-position="right" :min="1" />
				</el-form-item>
				<el-form-item label="標題">
					<el-input v-model="newRoundForm.title" />
				</el-form-item>
				<el-form-item label="起始時間">
					<el-date-picker v-model="newRoundForm.roundStart" type="date" value-format="yyyy-MM-dd" placeholder="選擇日期" />
				</el-form-item>
				<el-form-item label="結束時間">
					<el-date-picker v-model="newRoundForm.roundEnd" type="date" value-format="yyyy-MM-dd" placeholder="選擇日期" />
				</el-form-item>
			</el-form>
			<span slot="footer" class="dialog-footer">
				<el-button @click="showAddDialog = false">取消</el-button>
				<el-button type="primary" @click="addRound()">確定</el-button>
			</span>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderMap, getTenderRound, addTenderRound, setTenderRound, getActionProcess } from "@/api/type";
import { importAllInspectCase, uploadInspectionCaseNco } from "@/api/inspection";
import checkPermission from '@/utils/permission';

export default {
	name: "contract",
	data() {
		return {
			loading: false,
			isUpload: false,
			showAddDialog: false,
			screenWidth: window.innerWidth,
			listQuery: {
				tenderId: 100,
				blockId: null
			},
			headers: {
				round: {
					name: "輪次",
					sortable: false
				},
				title: {
					name: "標題",
					sortable: false
				},
				roundStart: {
					name: "起始時間",
					sortable: false
				},
				roundEnd: {
					name: "結束時間",
					sortable: false
				}
			},
			list: [],
			newRoundForm: {
				round: "",
				title: "",
				roundStart: "",
				roundEnd: ""
			},
			options: { 
				tenderMap: {}
			}
		};
	},
	computed: {},
	watch: {},
	created() {
		getTenderMap().then(response => {
			this.options.tenderMap = response.data.tenderMap;
			if(Object.keys(this.options.tenderMap).length > 0) {
				if(!Object.keys(this.options.tenderMap).includes(String(this.listQuery.tenderId))) this.listQuery.tenderId = Object.keys(this.options.tenderMap)[0];
				this.getList();
			}
		});
	},
	mounted(){ },
	methods: {
		checkPermission,
		getList() {
			this.loading = true;
			this.list = [];

			getTenderRound({ tenderId: this.listQuery.tenderId }).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
					this.newRoundForm.round = 1;
				} else {
					this.list = response.data.list;

					this.newRoundForm = {
						round: Math.max(...this.list.map(l => l.round)) + 1,
						title: "",
						roundStart: "",
						roundEnd: ""
					}

					this.list.forEach(l => {
						l.roundStart = this.formatTime(l.roundStart);
						l.roundEnd = this.formatTime(l.roundEnd);
						this.$set(l, "blockId", "");
						this.$set(l, "roadName", "");
						this.$set(l, "edit", false);
					});

					this.getAction();
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		getAction() {
			getActionProcess({ idList: this.list.map(l => l.actionId) }).then(res => {
				this.list.forEach(l => {
					const actionSpec = res.data.list.filter(r => r.id == l.actionId);
					if(actionSpec.length > 0) this.$set(l, "process", actionSpec[0].total == 0 ? 100 : Math.round(actionSpec[0].success / actionSpec[0].total * 100));
					else this.$set(l, "process", 0);
				});
			});
		},
		addRound() {
			let roundName = `Round${this.newRoundForm.round}`;
			if(this.newRoundForm.title.length > 0) roundName += `(${this.newRoundForm.title})`;

			this.$confirm(`確定新增 ${roundName}，區間為${this.newRoundForm.roundStart} - ${this.newRoundForm.roundEnd}?`, "確認", {
					showClose: false,
				}).then(() => {
				addTenderRound( { tenderId: this.listQuery.tenderId, round: this.newRoundForm.round, title: this.newRoundForm.title, timeStart: this.newRoundForm.roundStart, timeEnd: this.newRoundForm.roundEnd } ).then(response => {
					if (response.statusCode == 20000 ) {
						this.$message({
							message: "新增成功",
							type: "success",
						});
						this.showAddDialog = false;
						this.getList();
					} else {
						this.$message({
							message: "新增失敗",
							type: "error",
						});
					}
				}).catch(err => {
					console.log(err);
				});
			})
		},
		setRound(row) {
			let roundName = `Round${row.round}`;
			if(row.title.length > 0) roundName += `(${row.title})`;

			this.$confirm(`確定修改 ${roundName}，區間為${row.roundStart} - ${row.roundEnd}?`, "確認", {
					showClose: false,
				}).then(() => {
				setTenderRound( row.id, { title: row.title, timeStart: row.roundStart, timeEnd: row.roundEnd } ).then(response => {
					if (response.statusCode == 20000 ) {
						this.$message({
							message: "修改成功",
							type: "success",
						});
						this.getList();
					} else {
						this.$message({
							message: "修改失敗",
							type: "error",
						});
					}
				}).catch(err => {
					console.log(err);
					this.getList();
				});
			})
		},
		uploadCase(row, targetType, isSub = false) {
			const content = `確定上傳缺失至「${targetType == 1 ? '追蹤列表' : '缺失列表'}」?`;
			this.$confirm(content, "確認", { showClose: false }).then(() => {
				this.loading = true;
				this.isUpload = true;

				importAllInspectCase({
					surveyId: row.id,
					targetType,
					isSub
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						const result = response.result;
						this.$message({
							message: `上傳缺失結果(共 ${result.total}件): 成功 ${result.success}件 / 重複 ${result.duplicate}件 / 地址錯誤 ${result.addrFail}件`,
							type: "success",
						});
					} 
					this.getList();
					this.isUpload = false;
					this.loading = false;
				}).catch(err => {
					console.log(err);
					this.loading = false;
					this.isUpload = false;
				})

			}).catch(err => {
				console.log(err);
			});

		},
		uploadCase2NCO(row) {
			const content = `確定上傳缺失至「新工處」?`;
			this.$confirm(content, "確認", { showClose: false }).then(() => {
				this.loading = true;
				this.isUpload = true;

				uploadInspectionCaseNco({
					surveyId: row.id
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						const result = response.result;
						this.$message({
							message: `上傳缺失結果(共 ${result.total}件): 成功 ${result.success}件 / 失敗 ${result.fail}件 / 重複 ${result.duplicate}件`,
							type: "success",
						});
					} 
					this.getList();
					this.isUpload = false;
					this.loading = false;
				}).catch(err => {
					console.log(err);
					this.loading = false;
					this.isUpload = false;
				})

			}).catch(err => {
				console.log(err);
			});

		},
		formatter(row, column) {
			if (Number(row[column.property])) return row[column.property];
			else return row[column.property] || "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD");
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.contract
	.filter-container .filter-item .select-contract .el-select
		&.tender-select
			width: 520px
		.el-input__inner
			border-top-left-radius: 0
			border-bottom-left-radius: 0
			padding-left: 10px
			text-align: left
	.btn-action
		margin-left: 5px
		padding: 5px
	.el-table
		thead.is-group th
			padding: 5px 0
		.el-icon-success
			margin-right: -10px
		.el-icon-error
			color: #F56C6C
</style>